import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { error, json } from "@/lib/http";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const profileId = new URL(req.url).searchParams.get("profileId") ?? undefined;
  const conversations = await db.conversation.findMany({
    where: { userId: user.id, ...(profileId ? { profileId } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true, profileId: true },
  });
  return json({ conversations });
}
