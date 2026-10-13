import "server-only";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";

/** Append-only audit trail (sign-ins, billing changes, guardrail events, data exports/deletions). */
export async function audit(type: string, userId: string | null, detail: Prisma.InputJsonValue = {}) {
  try {
    await db.auditLog.create({ data: { type, userId, detail } });
  } catch (err) {
    console.error("audit log write failed", type, err);
  }
}
