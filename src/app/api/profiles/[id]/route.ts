import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { error, json, sameOrigin } from "@/lib/http";
import { ADULT_AGE, ageFromBirthYear, profileInputSchema } from "@/lib/profile";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const { id } = await params;
  const existing = await db.profile.findFirst({ where: { id, userId: user.id } });
  if (!existing) return error("Profile not found", 404);
  const parsed = profileInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Invalid profile", 400);
  if (existing.isPrimary && ageFromBirthYear(parsed.data.birthYear) < ADULT_AGE) return error("The account holder must be 18 or older.", 400);
  const profile = await db.profile.update({ where: { id }, data: parsed.data });
  return json({ profile });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const { id } = await params;
  const existing = await db.profile.findFirst({ where: { id, userId: user.id } });
  if (!existing) return error("Profile not found", 404);
  if (existing.isPrimary) return error("The account holder's profile can't be removed. Delete the account instead.", 400);
  await db.profile.delete({ where: { id } });
  return json({ ok: true });
}
