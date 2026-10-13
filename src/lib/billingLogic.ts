import type { PlanId } from "./plans";

export type DbSubscriptionStatus = "NONE" | "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED";

/** Map Stripe's subscription status onto ours. */
export function mapStripeStatus(status: string): DbSubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    case "incomplete":
    case "paused":
    default:
      return "NONE";
  }
}

export function planForPriceId(priceId: string | null | undefined, prices: { plus?: string; premium?: string }): PlanId | null {
  if (!priceId) return null;
  if (priceId === prices.plus) return "PLUS";
  if (priceId === prices.premium) return "PREMIUM";
  return null;
}
