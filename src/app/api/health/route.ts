import { db } from "@/lib/db";
import { aiMockMode, billingMockMode, assertProductionConfig } from "@/lib/env";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "unreachable";
  }
  const configProblems = assertProductionConfig();
  const healthy = database === "ok" && configProblems.length === 0;
  return json(
    { status: healthy ? "ok" : "degraded", database, aiMode: aiMockMode() ? "mock" : "live", billingMode: billingMockMode() ? "mock" : "stripe", configProblems },
    healthy ? 200 : 503,
  );
}
