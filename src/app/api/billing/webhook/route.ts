import { error, json } from "@/lib/http";
import { handleStripeWebhook } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  try {
    const ok = await handleStripeWebhook(body, req.headers.get("stripe-signature"));
    return ok ? json({ received: true }) : error("Invalid signature", 400);
  } catch (err) {
    console.error("stripe webhook failed", err);
    return error("Webhook handler failed", 500); // Stripe retries with backoff
  }
}
