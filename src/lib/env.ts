import "server-only";

/** Centralised, validated access to environment configuration. */
function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const env = {
  appUrl: read("APP_URL") ?? "http://localhost:3000",
  databaseUrl: read("DATABASE_URL") ?? "postgresql://dollarsafe:dollarsafe@localhost:5432/dollarsafe",
  sessionSecret: read("SESSION_SECRET") ?? "dev-only-insecure-session-secret-change-me",
  anthropicApiKey: read("ANTHROPIC_API_KEY"),
  anthropicModel: read("ANTHROPIC_MODEL") ?? "claude-opus-5-5",
  stripeSecretKey: read("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: read("STRIPE_WEBHOOK_SECRET"),
  stripePricePlus: read("STRIPE_PRICE_PLUS_MONTHLY"),
  stripePricePremium: read("STRIPE_PRICE_PREMIUM_MONTHLY"),
  cronSecret: read("CRON_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
};

/** Mock AI mode: no Anthropic key configured. Answers are deterministic and offline. */
export const aiMockMode = () => !env.anthropicApiKey;

/** Mock billing mode: no Stripe key configured. Never allowed in production. */
export const billingMockMode = () => !env.stripeSecretKey && !env.isProduction;

export function assertProductionConfig(): string[] {
  const problems: string[] = [];
  if (!env.isProduction) return problems;
  if (env.sessionSecret.length < 32 || env.sessionSecret.includes("change-me")) problems.push("SESSION_SECRET must be a random string of 32+ characters");
  if (!env.anthropicApiKey) problems.push("ANTHROPIC_API_KEY is required in production");
  if (!env.stripeSecretKey || !env.stripeWebhookSecret) problems.push("STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required in production");
  if (!env.stripePricePlus || !env.stripePricePremium) problems.push("STRIPE_PRICE_PLUS_MONTHLY and STRIPE_PRICE_PREMIUM_MONTHLY are required in production");
  if (!env.cronSecret || env.cronSecret === "change-me") problems.push("CRON_SECRET must be set in production");
  return problems;
}
