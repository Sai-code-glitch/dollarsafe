import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp, error, json, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";

const schema = z.object({
  email: z.email().max(254).transform((e) => e.toLowerCase().trim()),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
  confirmAdult: z.literal(true, { error: "The account holder must be 18 or older." }),
  acceptTerms: z.literal(true, { error: "Please accept the Terms and the disclosures." }),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const limited = rateLimit(`signup:${clientIp(req)}`, 5, 60 * 60_000);
  if (!limited.ok) return error("Too many sign-ups from this network. Try again later.", 429);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  const { email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return error("An account with this email already exists. Try signing in.", 409);

  const user = await db.user.create({ data: { email, passwordHash: await hashPassword(password), acceptedTermsAt: new Date() } });
  await createSession(user.id);
  await audit("auth.signup", user.id, { ip: clientIp(req) });
  return json({ ok: true });
}
