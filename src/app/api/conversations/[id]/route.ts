import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { error, json, sameOrigin } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const { id } = await params;
  const conversation = await db.conversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, flags: true, createdAt: true } } },
  });
  if (!conversation) return error("Conversation not found", 404);
  return json({ conversation });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return error("Forbidden", 403);
  const user = await getCurrentUser();
  if (!user) return error("Sign in required", 401);
  const { id } = await params;
  const result = await db.conversation.deleteMany({ where: { id, userId: user.id } });
  if (!result.count) return error("Conversation not found", 404);
  return json({ ok: true });
}
