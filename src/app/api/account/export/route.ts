import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { error } from "@/lib/http";

/** Download everything Dollarsafe stores about the signed-in user (CCPA/CPRA right to know). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const data = await db.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      acceptedTermsAt: true,
      createdAt: true,
      profiles: true,
      conversations: { include: { messages: { select: { role: true, content: true, createdAt: true } } } },
      reports: true,
      usage: true,
    },
  });
  await audit("account.export", user.id);
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="dollarsafe-export.json"' },
  });
}
