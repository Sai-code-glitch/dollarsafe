/**
 * Subscription plans and what each one unlocks. Prices here are display values;
 * the amount actually charged comes from the Stripe Price IDs configured in the environment.
 */
export type PlanId = "FREE" | "PLUS" | "PREMIUM";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthlyUsd: number;
  tagline: string;
  monthlyMessages: number;
  maxProfiles: number;
  /** Claude effort level for this tier's answers. */
  effort: "low" | "medium" | "high";
  monthlyCheckup: boolean;
  conversationMemory: number; // how many earlier messages are sent back as context
  features: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Starter",
    priceMonthlyUsd: 0,
    tagline: "Try Dollarsafe with a few questions each month.",
    monthlyMessages: 15,
    maxProfiles: 1,
    effort: "low",
    monthlyCheckup: false,
    conversationMemory: 6,
    features: ["15 questions per month", "All money calculators", "Guidance tuned to your life stage"],
  },
  PLUS: {
    id: "PLUS",
    name: "Plus",
    priceMonthlyUsd: 9.99,
    tagline: "Your everyday money coach.",
    monthlyMessages: 300,
    maxProfiles: 1,
    effort: "medium",
    monthlyCheckup: false,
    conversationMemory: 20,
    features: [
      "300 questions per month",
      "Deeper, more thorough answers",
      "Longer conversation memory",
      "Budget, debt, retirement and tax planners",
    ],
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Family Premium",
    priceMonthlyUsd: 19.99,
    tagline: "Guidance for the whole household, every age.",
    monthlyMessages: 1000,
    maxProfiles: 5,
    effort: "high",
    monthlyCheckup: true,
    conversationMemory: 40,
    features: [
      "1,000 questions per month",
      "Up to 5 family profiles, including teens 13-17",
      "Most thorough answers",
      "Automatic monthly financial check-up report",
    ],
  },
};

export const PAID_PLANS: PlanId[] = ["PLUS", "PREMIUM"];

/** Paid features apply only while the subscription is in good standing. */
export function effectivePlan(plan: PlanId, status: string, currentPeriodEnd: Date | null, now = new Date()): PlanId {
  if (plan === "FREE") return "FREE";
  if (status === "ACTIVE" || status === "TRIALING") return plan;
  // Grace period: keep access until the paid period ends (e.g. canceled at period end, or a retrying payment).
  if ((status === "PAST_DUE" || status === "CANCELED") && currentPeriodEnd && currentPeriodEnd > now) return plan;
  return "FREE";
}

export function currentPeriod(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
