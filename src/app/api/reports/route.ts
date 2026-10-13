import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { error, json } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const reports = await db.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 24,
    include: { profile: { select: { displayName: true } } },
  });
  return json({ reports });
}
