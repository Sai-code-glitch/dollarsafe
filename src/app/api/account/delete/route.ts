import { z } from "zod";
import { db } from "@/lib/db";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { error, json, sameOrigin } from "@/lib/http";
import { stripe } from "@/lib/stripe";

const schema = z.object({ confirm: z.literal("DELETE") });

/** Self-service account deletion: cancels billing immediately and erases the user's data. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  if (!schema.safeParse(await req.json().catch(() => null)).success) return error('Type DELETE to confirm.', 400);

  if (env.stripeSecretKey && user.stripeSubscriptionId && user.subscriptionStatus !== "CANCELED") {
    try {
      await stripe().subscriptions.cancel(user.stripeSubscriptionId);
    } catch (err) {
      console.error("subscription cancel failed", err);
      return error("We couldn't cancel your subscription, so nothing was deleted. Please try again.", 502);
    }
  }
  await audit("account.deleted", null, { userId: user.id }); // userId kept in detail; the FK is cleared on delete
  await destroySession();
  await db.user.delete({ where: { id: user.id } });
  return json({ ok: true });
}
