import { z } from "zod";
import type * as Beta from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { error, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";
import { PLANS } from "@/lib/plans";
import { checkInput, checkOutput } from "@/lib/advisor/guardrails";
import { runAdvisor } from "@/lib/advisor/agent";
import { buildSystem, isMinor, modelClient, planFor, recordTokens, releaseMessage, reserveMessage, toHistory } from "@/lib/advisor/service";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z.object({
  message: z.string().trim().min(1).max(4000),
  profileId: z.string().min(1),
  conversationId: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  if (!rateLimit(`chat:${user.id}`, 12, 60_000).ok) return error("You're sending messages quickly. Wait a moment and try again.", 429);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Invalid message", 400);
  const { message, profileId } = parsed.data;

  const profile = await db.profile.findFirst({ where: { id: profileId, userId: user.id } });
  if (!profile) return error("Profile not found", 404);

  let conversation = parsed.data.conversationId
    ? await db.conversation.findFirst({ where: { id: parsed.data.conversationId, userId: user.id, profileId } })
    : null;
  if (parsed.data.conversationId && !conversation) return error("Conversation not found", 404);

  const planId = planFor(user);
  const plan = PLANS[planId];
  const guard = checkInput(message, { isMinor: isMinor(profile) });

  if (!guard.blockedResponse) {
    const reservation = await reserveMessage(user.id, planId);
    if (!reservation.ok)
      return error(`You've used all ${reservation.limit} questions in your ${plan.name} plan this month.`, 402, { code: "quota_exceeded" });
  }

  conversation ??= await db.conversation.create({
    data: { userId: user.id, profileId, title: guard.sanitized.slice(0, 60) + (guard.sanitized.length > 60 ? "…" : "") },
  });
  const earlier = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: plan.conversationMemory,
    select: { role: true, content: true },
  });
  await db.message.create({ data: { conversationId: conversation.id, role: "USER", content: guard.sanitized, flags: guard.flags } });
  if (guard.flags.length) await audit("guardrail.input", user.id, { flags: guard.flags, conversationId: conversation.id });

  const conversationId = conversation.id;
  const encoder = new TextEncoder();
  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort());

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected; the abort signal stops the model call
        }
      };
      send("meta", { conversationId });
      for (const n of guard.notices) send("notice", n);

      try {
        if (guard.blockedResponse) {
          send("text", { text: guard.blockedResponse });
          const saved = await db.message.create({
            data: { conversationId, role: "ASSISTANT", content: guard.blockedResponse, model: "guardrail", flags: guard.flags },
          });
          send("done", { messageId: saved.id, counted: false });
          return;
        }

        const userContent: Beta.BetaContentBlockParam[] = [{ type: "text", text: guard.sanitized }];
        if (guard.turnInstructions.length)
          userContent.push({
            type: "text",
            text: `<dollarsafe_safety_note>\n${guard.turnInstructions.join("\n")}\n</dollarsafe_safety_note>`,
          });

        const result = await runAdvisor({
          client: modelClient(),
          system: buildSystem(profile, planId),
          history: toHistory(earlier.reverse()),
          userContent,
          effort: plan.effort,
          signal: abort.signal,
          onEvent: (e) => {
            if (e.type === "text") send("text", { text: e.text });
            else if (e.type === "status") send("status", { message: e.message });
            else send("tool", { name: e.name, ok: e.ok });
          },
        });

        let content = result.text;
        const out = checkOutput(content);
        if (out.correction) {
          content += `\n\n> ${out.correction}`;
          send("text", { text: `\n\n> ${out.correction}` });
          await audit("guardrail.output", user.id, { flags: out.flags, conversationId });
        }

        const saved = await db.message.create({
          data: {
            conversationId,
            role: "ASSISTANT",
            content,
            model: result.model,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            flags: [...guard.flags, ...out.flags],
            toolCalls: result.toolCalls as unknown as Prisma.InputJsonValue,
          },
        });
        await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        await recordTokens(user.id, result.inputTokens, result.outputTokens);
        send("done", { messageId: saved.id, counted: true });
      } catch (err) {
        console.error("advisor error", err);
        await releaseMessage(user.id);
        send("error", { message: "Something went wrong while answering. Your question wasn't counted; please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
