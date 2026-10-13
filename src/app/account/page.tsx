import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { billingMockMode } from "@/lib/env";
import { planFor, usageThisMonth } from "@/lib/advisor/service";
import { AccountActions } from "@/components/AccountActions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ checkout?: string; portal?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const { checkout, portal } = await searchParams;
  const planId = planFor(user);
  const plan = PLANS[planId];
  const used = await usageThisMonth(user.id);
  const reports = await db.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { profile: { select: { displayName: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-2xl font-bold">Account</h1>
      {checkout === "success" && <p className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">You&apos;re subscribed. Thank you! Your new plan is active.</p>}
      {portal === "mock" && <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">Billing portal is simulated in local mock mode. Configure Stripe to manage real subscriptions.</p>}

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="font-semibold">{user.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Plan</p>
            <p className="font-semibold">{plan.name}{plan.priceMonthlyUsd ? ` · $${plan.priceMonthlyUsd}/mo` : ""}</p>
            {user.currentPeriodEnd && planId !== "FREE" && (
              <p className="text-xs text-slate-500">
                {user.subscriptionStatus === "CANCELED" ? "Access ends" : "Renews"} {user.currentPeriodEnd.toLocaleDateString("en-US")}
              </p>
            )}
            {user.subscriptionStatus === "PAST_DUE" && <p className="text-xs font-semibold text-red-700">Payment failed. Update your card to keep your plan.</p>}
          </div>
        </div>
        <div className="mt-5">
          <p className="text-sm text-slate-600">{used} of {plan.monthlyMessages} questions used this month</p>
          <div className="mt-1 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (used / plan.monthlyMessages) * 100)}%` }} /></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/pricing" className="btn-primary">{planId === "FREE" ? "Upgrade" : "Change plan"}</Link>
          <Link href="/profiles" className="btn-secondary">Profiles</Link>
          <AccountActions hasBilling={!!user.stripeCustomerId || billingMockMode()} />
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold">Monthly check-ups</h2>
        {plan.monthlyCheckup ? (
          reports.length ? (
            <div className="mt-3 space-y-3">
              {reports.map((r) => (
                <details key={r.id} className="rounded-xl border border-slate-200 p-3">
                  <summary className="cursor-pointer text-sm font-medium">{r.period} · {r.profile.displayName}</summary>
                  <div className="prose-answer mt-2"><ReactMarkdown remarkPlugins={[remarkGfm]}>{r.content}</ReactMarkdown></div>
                </details>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Your first AI check-up for each profile arrives automatically within a day.</p>
          )
        ) : (
          <p className="mt-2 text-sm text-slate-600">Family Premium includes an automatic AI financial check-up for every profile each month.</p>
        )}
      </section>
    </div>
  );
}
