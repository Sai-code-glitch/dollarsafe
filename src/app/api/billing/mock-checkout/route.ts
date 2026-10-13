import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { billingMockMode, env } from "@/lib/env";

/** Local development only: simulates a successful Stripe checkout when no Stripe key is configured. */
export async function GET(req: Request) {
  if (!billingMockMode()) return new NextResponse("Not found", { status: 404 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", env.appUrl));
  const plan = new URL(req.url).searchParams.get("plan");
  if (plan !== "PLUS" && plan !== "PREMIUM") return new NextResponse("Bad plan", { status: 400 });
  await db.user.update({
    where: { id: user.id },
    data: { plan, subscriptionStatus: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000) },
  });
  await audit("billing.mock_checkout", user.id, { plan });
  return NextResponse.redirect(new URL("/account?checkout=success", env.appUrl));
}
