import Link from "next/link";
import { LIFE_STAGES } from "@/lib/profile";
import { PLANS } from "@/lib/plans";

const stageIcons: Record<string, string> = {
  teen: "🎒",
  young_adult: "🎓",
  early_career: "💼",
  family_builder: "🏡",
  pre_retiree: "🧭",
  retiree: "🌅",
};

const faqs = [
  {
    q: "Is Dollarsafe a financial advisor?",
    a: "No. Dollarsafe is an AI money coach that provides financial education and general guidance. It helps you understand your options and run the numbers, but it doesn't tell you which specific stocks, funds or crypto to buy, and it isn't a registered investment adviser.",
  },
  {
    q: "Is a human reading my conversations?",
    a: "No. Dollarsafe runs fully automatically. Your conversations are stored so you can come back to them and so we can keep required records, and you can export or delete everything at any time.",
  },
  {
    q: "Can my teenager use it?",
    a: "Yes, with Family Premium. A parent or guardian creates a teen profile (ages 13-17) and gives consent. Teen guidance stays age-appropriate and points to custodial accounts that require an adult.",
  },
  {
    q: "Do I need to connect my bank?",
    a: "No. You share only what you choose, in your own words. Dollarsafe never asks for account numbers, passwords or your Social Security number.",
  },
  { q: "Can I cancel anytime?", a: "Yes. Cancel or change plans yourself from your account page; you keep access until the end of the period you paid for." },
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">AI money coach · Built for the US</p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Clear money guidance for every stage of life.</h1>
            <p className="mt-4 text-lg text-slate-600">
              From a first paycheck to retirement income, Dollarsafe explains your options in plain English, runs the math for you, and gives you
              next steps that fit your age, goals and budget. Available 24/7.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">Start free</Link>
              <Link href="/pricing" className="btn-secondary px-6 py-3 text-base">See plans</Link>
            </div>
            <p className="mt-3 text-xs text-slate-500">15 free questions a month. No card required.</p>
          </div>
          <div className="card space-y-4">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-3 text-sm text-white">
              I have $4,200 on a credit card at 24.9% and a $9,800 car loan. I can put an extra $200 a month toward debt. What should I pay first?
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm text-slate-800">
              <p className="font-semibold">Put the extra $200 on the credit card first.</p>
              <p className="mt-1">
                At 24.9% it costs you far more than the car loan. Keep paying the car&apos;s minimum and you&apos;d clear the card in about 17 months,
                then roll that payment onto the car and be completely debt-free in about 28 months.
              </p>
              <p className="mt-2 text-xs text-slate-500">Calculated with Dollarsafe&apos;s debt payoff planner</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold">Guidance that grows up with you</h2>
        <p className="mt-2 text-slate-600">Tell Dollarsafe your age and goals once. Every answer adapts to where you are.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(LIFE_STAGES).map((s) => (
            <div key={s.id} className="card">
              <div className="text-2xl" aria-hidden>{stageIcons[s.id]}</div>
              <h3 className="mt-2 font-semibold">{s.label} <span className="font-normal text-slate-500">· {s.ages}</span></h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {s.focus.slice(0, 3).map((f) => (
                  <li key={f}>• {f.charAt(0).toUpperCase() + f.slice(1)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {[
            ["Real math, not guesses", "Built-in calculators for budgets, debt payoff, emergency funds, retirement, loans, contribution limits and federal taxes. The AI uses them for every number."],
            ["Safe by design", "No stock picks. Scam warnings. Crisis resources. Sensitive numbers are automatically removed. Teen profiles stay age-appropriate."],
            ["Private and in your control", "No bank connection needed. Export or delete your data any time. We never sell your information."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="font-semibold text-slate-900">{t}</h3>
              <p className="mt-2 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold">Simple plans</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Object.values(PLANS).map((p) => (
            <div key={p.id} className="card">
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-1 text-3xl font-bold">{p.priceMonthlyUsd === 0 ? "Free" : `$${p.priceMonthlyUsd}`}<span className="text-sm font-normal text-slate-500">{p.priceMonthlyUsd ? "/month" : ""}</span></p>
              <p className="mt-2 text-sm text-slate-600">{p.tagline}</p>
            </div>
          ))}
        </div>
        <Link href="/pricing" className="mt-6 inline-block text-sm font-semibold text-brand-700 underline">Compare plans</Link>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="text-2xl font-bold">Questions</h2>
        <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-medium text-slate-900">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
