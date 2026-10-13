import "server-only";
import type * as Beta from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { db } from "../db";
import { env, aiMockMode } from "../env";
import { PLANS, PlanId, currentPeriod, effectivePlan } from "../plans";
import { ADULT_AGE, ageFromBirthYear } from "../profile";
import { ClaudeModelClient, ModelClient } from "./agent";
import { MockModelClient } from "./mock";
export { toHistory } from "./history";
import { POLICY_PROMPT, buildProfilePrompt } from "./systemPrompt";
import type { CurrentUser } from "../auth";
import type { Profile } from "@/generated/prisma/client";

let client: ModelClient | null = null;
export function modelClient(): ModelClient {
  client ??= aiMockMode() ? new MockModelClient() : new ClaudeModelClient(env.anthropicApiKey!, env.anthropicModel);
  return client;
}

export function planFor(user: Pick<CurrentUser, "plan" | "subscriptionStatus" | "currentPeriodEnd">): PlanId {
  return effectivePlan(user.plan, user.subscriptionStatus, user.currentPeriodEnd);
}

export function buildSystem(profile: Profile, planId: PlanId): Beta.BetaTextBlockParam[] {
  return [
    { type: "text", text: POLICY_PROMPT },
    { type: "text", text: buildProfilePrompt(profile, { planName: PLANS[planId].name }) },
  ];
}

export const isMinor = (profile: Pick<Profile, "birthYear">) => ageFromBirthYear(profile.birthYear) < ADULT_AGE;

/**
 * Reserve one message from this month's allowance. The increment happens first so concurrent
 * requests can't overspend; a rejected or failed request gives its reservation back.
 */
export async function reserveMessage(userId: string, planId: PlanId): Promise<{ ok: boolean; used: number; limit: number }> {
  const limit = PLANS[planId].monthlyMessages;
  const period = currentPeriod();
  const record = await db.usageRecord.upsert({
    where: { userId_period: { userId, period } },
    create: { userId, period, messageCount: 1 },
    update: { messageCount: { increment: 1 } },
  });
  if (record.messageCount > limit) {
    await releaseMessage(userId);
    return { ok: false, used: limit, limit };
  }
  return { ok: true, used: record.messageCount, limit };
}

export async function releaseMessage(userId: string) {
  await db.usageRecord.updateMany({ where: { userId, period: currentPeriod(), messageCount: { gt: 0 } }, data: { messageCount: { decrement: 1 } } });
}

export async function recordTokens(userId: string, inputTokens: number, outputTokens: number) {
  await db.usageRecord.updateMany({
    where: { userId, period: currentPeriod() },
    data: { inputTokens: { increment: inputTokens }, outputTokens: { increment: outputTokens } },
  });
}

export async function usageThisMonth(userId: string) {
  const r = await db.usageRecord.findUnique({ where: { userId_period: { userId, period: currentPeriod() } } });
  return r?.messageCount ?? 0;
}
