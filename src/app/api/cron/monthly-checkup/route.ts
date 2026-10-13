import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { audit } from "@/lib/audit";
import { error, json } from "@/lib/http";
import { currentPeriod } from "@/lib/plans";
import { runAdvisor } from "@/lib/advisor/agent";
import { checkOutput } from "@/lib/advisor/guardrails";
import { buildSystem, modelClient, planFor, recordTokens } from "@/lib/advisor/service";

export const runtime = "nodejs";
export const maxDuration = 300;

const BATCH = 20;

function authorized(req: Request) {
  const expected = env.cronSecret;
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected) return !env.isProduction; // open locally when no secret is set
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/**
 * Runs daily. Writes this month's AI check-up for every Family Premium profile that doesn't have one
 * yet, a batch at a time, so a missed or partial run catches up the next day without duplicates.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return error("Unauthorized", 401);
  const period = currentPeriod();
  const since = new Date(Date.now() - 31 * 86_400_000);

  const profiles = await db.profile.findMany({
    where: {
      user: { plan: "PREMIUM", subscriptionStatus: { in: ["ACTIVE", "TRIALING"] } },
      reports: { none: { period } },
    },
    include: { user: true, conversations: { where: { updatedAt: { gte: since } }, select: { title: true }, take: 15 } },
    take: BATCH,
  });

  let written = 0;
  for (const profile of profiles) {
    const planId = planFor(profile.user);
    if (planId !== "PREMIUM") continue;
    const topics = profile.conversations.map((c) => `- ${c.title}`).join("\n") || "- (no conversations this month)";
    try {
      const result = await runAdvisor({
        client: modelClient(),
        system: buildSystem(profile, planId),
        history: [],
        effort: "medium",
        onEvent: () => undefined,
        userContent: [
          {
            type: "text",
            text: `Write my monthly financial check-up for ${period}. Topics I asked about recently:\n${topics}\n\nStructure: a one-paragraph summary; "This month's three priorities" as a numbered list tailored to my life stage and goals; one calculator-backed insight (run one relevant calculator with clearly labeled assumptions); one seasonal reminder relevant to this time of year in the US (tax deadlines, open enrollment, contribution deadlines, holiday spending, etc.); and one short encouraging closing line. Keep it under 400 words.`,
          },
        ],
      });
      const out = checkOutput(result.text);
      const content = out.correction ? `${result.text}\n\n> ${out.correction}` : result.text;
      await db.report.create({ data: { userId: profile.userId, profileId: profile.id, period, content } });
      await recordTokens(profile.userId, result.inputTokens, result.outputTokens);
      written++;
    } catch (err) {
      console.error("checkup failed for profile", profile.id, err);
      await audit("cron.checkup_failed", profile.userId, { profileId: profile.id, period });
    }
  }
  return json({ period, candidates: profiles.length, written });
}
