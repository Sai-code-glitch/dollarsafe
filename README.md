# Dollarsafe

An automated, subscription-based AI money coach for people in the US, at every stage of life: teens (under a parent's plan), students, early career, families, pre-retirees and retirees. Everything runs without a human in the loop: answers, calculations, safety checks, billing, and monthly check-up reports are all automatic.

**Product framing:** Dollarsafe provides *financial education and general guidance*. It does not recommend specific securities and is not a registered investment adviser. See [Compliance](#compliance-read-before-launch) before launching.

## What's in the box

| Area | What it does |
| --- | --- |
| **AI advisor** | Claude (`claude-opus-5-5` by default) with adaptive thinking, streamed to the browser. A tool loop gives it 8 deterministic calculators so it never does money math in its head. Server-side refusal fallback (`fallbacks: "default"`) and prompt caching are on. |
| **Life stages** | Birth year maps to one of six stages; each has its own focus areas and tone, injected into the system prompt with the user's profile (state, household, income band, goals, risk comfort, notes). |
| **Calculators** | Compound growth, 50/30/20 budget, debt payoff (avalanche/snowball), emergency fund, retirement projection, 2026 contribution limits (incl. SECURE 2.0 age 60-63 catch-up), 2026 federal income tax estimate, loan payment. All in `src/lib/finance/`. |
| **Guardrails** | Deterministic checks before and after every model call: SSN/card/account redaction before anything is stored or sent; fixed refusal for illegal requests; crisis (988), scam (FTC, elder fraud hotline) and professional-referral notices; "no stock picks" enforcement on input and output; prompt-injection handling; teen-safe instructions. Flags are stored on every message for recordkeeping. |
| **Subscriptions** | Starter (free, 15 questions/mo), Plus ($9.99, 300/mo), Family Premium ($19.99, 1,000/mo, 5 profiles incl. teens 13-17, monthly AI check-up). Stripe Checkout + Billing Portal + webhooks with idempotency; grace period for past-due/canceled-at-period-end. Usage is reserved atomically per month. |
| **Automation** | Daily cron (`/api/cron/monthly-checkup`) writes each Premium profile's AI check-up once per month and self-heals missed runs. Self-service plan changes, cancellation, data export and account deletion. |
| **Accounts & security** | Email + password (bcrypt), DB sessions with HMAC-hashed tokens in httpOnly cookies, origin checks on all mutating routes, rate limits on sign-up/login/chat, security headers, audit log. |
| **Mock modes** | No Anthropic key: an offline mock model runs the *real* calculators through the same tool loop. No Stripe key (dev only): upgrades apply instantly. The whole product works locally with no keys. |

## Quick start (local, no keys needed)

Requirements: Node 20.9+ and PostgreSQL 16 (or Docker).

```bash
cp .env.example .env
docker compose up -d          # or point DATABASE_URL at your own Postgres
npm install
npx prisma migrate deploy
npm run dev                   # http://localhost:3000
```

Sign up, fill in your profile, and start chatting. With no `ANTHROPIC_API_KEY` you'll see "Demo mode" answers backed by real calculator output. Upgrades go through a simulated checkout.

To use the real AI, set `ANTHROPIC_API_KEY` in `.env` and restart.

Check configuration at any time: `GET /api/health` reports database status, AI/billing mode, and anything missing for production.

## Tests

```bash
npm test        # 58 unit tests: calculators, guardrails, life stages, plans, billing mapping, the agent loop (scripted + mock model)
npm run lint    # TypeScript type-check
npm run build   # production build
```

CI (`.github/workflows/ci.yml`) runs all three against a Postgres service.

## Stripe setup

1. In the Stripe Dashboard create two recurring monthly Prices (Plus $9.99, Family Premium $19.99) and put their IDs in `STRIPE_PRICE_PLUS_MONTHLY` and `STRIPE_PRICE_PREMIUM_MONTHLY`.
2. Set `STRIPE_SECRET_KEY`.
3. Add a webhook endpoint `https://YOUR_DOMAIN/api/billing/webhook` listening to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.payment_failed`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Enable the Customer Portal (Settings → Billing → Customer portal) with plan switching between the two prices and cancellation at period end.
5. Recommended: enable Stripe Tax for sales tax, and Smart Retries + automatic dunning emails for failed payments.

Local webhook testing: `stripe listen --forward-to localhost:3000/api/billing/webhook`.

## Deploying (Vercel + managed Postgres)

1. Create a Postgres database (Neon, Supabase, RDS, etc.) and set `DATABASE_URL`.
2. Import the repo into Vercel. Set every variable from `.env.example` (`APP_URL` = your production URL; `SESSION_SECRET` and `CRON_SECRET` from `openssl rand -hex 32`).
3. Build command: set in `vercel.json` (`prisma migrate deploy && npm run build`), so database migrations run on every deploy.
4. `vercel.json` schedules the check-up cron daily; Vercel sends `Authorization: Bearer $CRON_SECRET` automatically. On another host, call `GET /api/cron/monthly-checkup` daily with that header.
5. Visit `/api/health`; it returns 200 only when the database is reachable and production config is complete.

Production notes:
- The chat route streams for up to 300s (`maxDuration`); make sure your plan allows it.
- The rate limiter is in-memory per instance. For many instances, back `src/lib/rateLimit.ts` with Redis (e.g. Upstash).
- Mock billing is disabled automatically when `NODE_ENV=production`.

## Tuning

- **Prices, quotas, profiles per plan, answer depth:** `src/lib/plans.ts` (`effort` per plan maps to Claude's effort setting).
- **Model:** `ANTHROPIC_MODEL` (default `claude-opus-5-5`).
- **Advisor policy and tone:** `src/lib/advisor/systemPrompt.ts`; per-stage focus and tone in `src/lib/profile.ts`.
- **Guardrail patterns:** `src/lib/advisor/guardrails.ts` (tests in `tests/guardrails.test.ts`).
- **Yearly figures:** update `src/lib/finance/limits.ts` each November when the IRS publishes next year's brackets and limits, then update the expected values in `tests/calculators.test.ts`.

## Architecture

```
src/
  app/                    Next.js App Router pages and API routes
    api/chat              SSE stream: guardrails → quota → Claude tool loop → output check → save
    api/billing/*         Stripe checkout, portal, webhook (+ dev-only mock checkout)
    api/cron/*            Monthly AI check-ups
    api/account/*         Data export and deletion
  lib/
    advisor/agent.ts      Model-agnostic tool loop (ModelClient seam; Claude and mock implementations)
    advisor/tools.ts      Strict JSON schemas + zod validation for each calculator
    advisor/guardrails.ts Deterministic input/output safety checks
    advisor/systemPrompt.ts  Cached policy prompt + per-user profile prompt
    finance/              Pure calculators and yearly IRS figures
    plans.ts, profile.ts  Plans/entitlements, life stages, profile validation
    auth.ts, stripe.ts, db.ts, env.ts
  proxy.ts                Redirects signed-out visitors away from app pages
prisma/schema.prisma      Users, sessions, profiles, conversations, messages, usage, reports, audit log, Stripe events
```

Earlier conversation turns are replayed to Claude as plain text, and each turn's tool loop is append-only, so preserved-thinking checks never fail and the prompt cache stays warm.

## Compliance: read before launch

This codebase is built to operate as an **education and general-guidance** service, which is the model that lets it run with no human involvement. Things to know:

1. **Investment advice requires registration.** In the US, giving personalized advice about securities for compensation generally makes you an investment adviser under the Investment Advisers Act of 1940 (SEC registration, usually once you exceed $100M in assets under management or qualify for the internet-adviser exemption) or state law (state registration below that). Automated "robo-advisers" are covered too. Dollarsafe avoids this by never recommending specific securities, funds or allocations, enforced by the system prompt plus input and output guardrails. The publisher's exclusion for impersonal, general publications is the closest analogue, but personalized chat makes the line fact-specific.
2. **If you want to offer registered advice later**, you would need: Form ADV (Parts 1 and 2A brochure) filed via IARD; SEC registration under the internet-adviser exemption (Rule 203A-2(e): advice exclusively through an interactive website, with limited exceptions) or state registration; a Chief Compliance Officer and written compliance policies (Rule 206(4)-7); a fiduciary duty of care and loyalty, including suitability and conflicts disclosure; books and records retention (Rule 204-2); Marketing Rule compliance; Form CRS if serving retail investors; a privacy notice under Regulation S-P; and in practice a custodian or broker-dealer partner if you place trades. The SEC's 2017 robo-adviser guidance (IM Guidance Update 2017-02) also expects disclosure of the algorithm's limits and oversight of it.
3. **Other rules that apply now:**
   - **AI disclosure:** the app states it is AI on every page and in the Terms (some states, e.g. Utah and California, have AI-disclosure rules).
   - **Privacy:** GLBA may apply to financial service providers; state privacy laws (CCPA/CPRA and others) are covered with export/delete. Have the Privacy Policy reviewed.
   - **Minors:** no users under 13 (COPPA); teens only under a consenting parent's account.
   - **Subscriptions:** FTC and state automatic-renewal laws (e.g. California's ARL) require clear terms before purchase, consent, a confirmation, and easy online cancellation. Stripe Checkout + the Customer Portal provide the mechanics; make sure the checkout page shows the renewal terms.
   - **Advertising:** avoid claims like "financial advisor", "guaranteed savings", or performance promises.
4. **The legal pages in `src/app/legal/` are AI-drafted starting points.** They are not reviewed by a lawyer. A one-time review by a securities/fintech attorney before launch is strongly recommended; it doesn't change the "no human in the loop" operation of the product.
