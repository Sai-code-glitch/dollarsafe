import "server-only";
import Stripe from "stripe";
import { db } from "./db";
import { env, billingMockMode } from "./env";
import { audit } from "./audit";
import { mapStripeStatus, planForPriceId } from "./billingLogic";
import type { PlanId } from "./plans";
import type { CurrentUser } from "./auth";

let stripeClient: Stripe | null = null;
export function stripe(): Stripe {
  if (!env.stripeSecretKey) throw new Error("Stripe is not configured");
  stripeClient ??= new Stripe(env.stripeSecretKey, { appInfo: { name: "Dollarsafe" } });
  return stripeClient;
}

const prices = () => ({ plus: env.stripePricePlus, premium: env.stripePricePremium });

export async function createCheckoutUrl(user: CurrentUser, plan: Exclude<PlanId, "FREE">): Promise<string> {
  if (billingMockMode()) return `${env.appUrl}/api/billing/mock-checkout?plan=${plan}`;
  const priceId = plan === "PLUS" ? env.stripePricePlus : env.stripePricePremium;
  if (!priceId) throw new Error(`No Stripe price configured for ${plan}`);

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({ email: user.email, metadata: { userId: user.id } });
    customerId = customer.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  // Existing subscribers change plans in the billing portal so proration is handled by Stripe.
  if (user.stripeSubscriptionId && (user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "TRIALING" || user.subscriptionStatus === "PAST_DUE")) {
    return createPortalUrl(user);
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: { metadata: { userId: user.id } },
    success_url: `${env.appUrl}/account?checkout=success`,
    cancel_url: `${env.appUrl}/pricing?checkout=canceled`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export async function createPortalUrl(user: CurrentUser): Promise<string> {
  if (billingMockMode()) return `${env.appUrl}/account?portal=mock`;
  if (!user.stripeCustomerId) throw new Error("No billing account yet");
  const portal = await stripe().billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${env.appUrl}/account` });
  return portal.url;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  const plan = planForPriceId(item?.price.id, prices());
  const status = mapStripeStatus(sub.status);
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;

  const user =
    (await db.user.findUnique({ where: { stripeCustomerId: customerId } })) ??
    (sub.metadata?.userId ? await db.user.findUnique({ where: { id: sub.metadata.userId } }) : null);
  if (!user) {
    console.warn("Stripe subscription for unknown customer", customerId);
    return;
  }
  // A newer subscription replaces the old one; ignore late events for a subscription we no longer track.
  if (user.stripeSubscriptionId && user.stripeSubscriptionId !== sub.id && status === "CANCELED") return;

  const data = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    subscriptionStatus: status,
    currentPeriodEnd: periodEnd,
    plan: status === "CANCELED" && (!periodEnd || periodEnd <= new Date()) ? ("FREE" as const) : (plan ?? user.plan),
  };
  await db.user.update({ where: { id: user.id }, data });
  await audit("billing.subscription_synced", user.id, { subscriptionId: sub.id, status: sub.status, plan: data.plan });
}

/** Verify, de-duplicate and apply a Stripe webhook. Returns false if the signature is invalid. */
export async function handleStripeWebhook(rawBody: string, signature: string | null): Promise<boolean> {
  if (!env.stripeWebhookSecret || !signature) return false;
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch {
    return false;
  }
  const seen = await db.stripeEvent.findUnique({ where: { id: event.id } });
  if (seen) return true;

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      if (s.mode === "subscription" && s.subscription) {
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
        const userId = s.client_reference_id;
        if (userId && s.customer) {
          const customerId = typeof s.customer === "string" ? s.customer : s.customer.id;
          await db.user.updateMany({ where: { id: userId }, data: { stripeCustomerId: customerId } });
        }
        await syncSubscription(await stripe().subscriptions.retrieve(subId));
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await syncSubscription(event.data.object);
      break;
    case "invoice.payment_failed": {
      const customer = event.data.object.customer;
      const customerId = typeof customer === "string" ? customer : customer?.id;
      if (customerId) {
        const user = await db.user.findUnique({ where: { stripeCustomerId: customerId } });
        if (user) await audit("billing.payment_failed", user.id, { invoice: event.data.object.id ?? null });
      }
      break;
    }
  }
  await db.stripeEvent.create({ data: { id: event.id, type: event.type } });
  return true;
}
