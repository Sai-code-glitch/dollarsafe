import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { planFor } from "@/lib/advisor/service";
import { PlanButton } from "@/components/PlanButton";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const user = await getCurrentUser();
  const current = user ? planFor(user) : null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-bold">Plans for every household</h1>
      <p className="mt-2 text-slate-600">Start free. Upgrade, downgrade or cancel any time from your account.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {Object.values(PLANS).map((p) => (
          <div key={p.id} className={`card flex flex-col ${p.id === "PLUS" ? "ring-2 ring-brand-500" : ""}`}>
            {p.id === "PLUS" && <span className="mb-2 self-start rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">Most popular</span>}
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p className="mt-2 text-4xl font-bold">
              {p.priceMonthlyUsd === 0 ? "$0" : `$${p.priceMonthlyUsd}`}
              <span className="text-base font-normal text-slate-500">/month</span>
            </p>
            <p className="mt-2 text-sm text-slate-600">{p.tagline}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-brand-600" aria-hidden>✓</span>{f}</li>
              ))}
            </ul>
            <div className="mt-6">
              <PlanButton plan={p.id} signedIn={!!user} current={current === p.id} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-xs text-slate-500">
        Prices in USD; applicable sales tax may be added at checkout. Subscriptions renew monthly until canceled. Dollarsafe provides financial
        education and general guidance, not individualized investment advice.
      </p>
    </div>
  );
}
