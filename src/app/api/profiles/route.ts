import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { error, json, sameOrigin } from "@/lib/http";
import { PLANS } from "@/lib/plans";
import { ADULT_AGE, ageFromBirthYear, profileInputSchema } from "@/lib/profile";
import { planFor } from "@/lib/advisor/service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const profiles = await db.profile.findMany({ where: { userId: user.id }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] });
  return json({ profiles });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const parsed = profileInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Invalid profile", 400);

  const plan = PLANS[planFor(user)];
  const count = await db.profile.count({ where: { userId: user.id } });
  const isPrimary = count === 0;
  if (!isPrimary && count >= plan.maxProfiles)
    return error(`Your ${plan.name} plan includes ${plan.maxProfiles} profile${plan.maxProfiles > 1 ? "s" : ""}. Upgrade to Family Premium to add family members.`, 402);
  if (isPrimary && ageFromBirthYear(parsed.data.birthYear) < ADULT_AGE)
    return error("The first profile is the account holder's and must be 18 or older. Teens can be added under Family Premium.", 400);

  const profile = await db.profile.create({ data: { ...parsed.data, userId: user.id, isPrimary } });
  return json({ profile }, 201);
}
