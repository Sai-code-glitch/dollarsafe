import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { error, json, sameOrigin } from "@/lib/http";
import { createCheckoutUrl } from "@/lib/stripe";

const schema = z.object({ plan: z.enum(["PLUS", "PREMIUM"]) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Choose a plan", 400);
  try {
    return json({ url: await createCheckoutUrl(user, parsed.data.plan) });
  } catch (err) {
    console.error("checkout failed", err);
    return error("Couldn't start checkout. Please try again.", 502);
  }
}
