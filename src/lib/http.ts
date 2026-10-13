import "server-only";
import { NextResponse } from "next/server";
import { env } from "./env";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const error = (message: string, status: number, extra?: Record<string, unknown>) =>
  NextResponse.json({ error: message, ...extra }, { status });

/**
 * Defence in depth against CSRF on cookie-authenticated routes (cookies are also SameSite=Lax):
 * browsers always send Origin on cross-site POSTs, so reject any that don't match this app.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin navigations and non-browser clients
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return o.host === host || o.origin === new URL(env.appUrl).origin;
  } catch {
    return false;
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
