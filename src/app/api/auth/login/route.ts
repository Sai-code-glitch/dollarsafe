import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp, error, json, sameOrigin } from "@/lib/http";
import { rateLimit } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().max(254).transform((e) => e.toLowerCase().trim()), password: z.string().max(200) });
// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = "$2b$12$yaxhzaagXnzaJ4MykLzXGOzHEsP0wm0FlcFRr9mB9A5E51.05gb8e";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Invalid email or password.", 400);
  const { email, password } = parsed.data;

  const ip = clientIp(req);
  if (!rateLimit(`login:ip:${ip}`, 20, 15 * 60_000).ok || !rateLimit(`login:email:${email}`, 8, 15 * 60_000).ok)
    return error("Too many attempts. Wait 15 minutes and try again.", 429);

  const user = await db.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    await audit("auth.login_failed", user?.id ?? null, { ip });
    return error("Invalid email or password.", 401);
  }
  await createSession(user.id);
  await audit("auth.login", user.id, { ip });
  return json({ ok: true });
}
