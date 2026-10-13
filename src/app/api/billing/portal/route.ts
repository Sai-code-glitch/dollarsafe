import { getCurrentUser } from "@/lib/auth";
import { error, json, sameOrigin } from "@/lib/http";
import { createPortalUrl } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  try {
    return json({ url: await createPortalUrl(user) });
  } catch (err) {
    console.error("portal failed", err);
    return error("Couldn't open billing. Please try again.", 502);
  }
}
