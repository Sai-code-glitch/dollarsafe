import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Free money calculators",
  description: "Free calculators for debt payoff, budgeting, emergency funds, retirement and compound interest. No sign-up needed.",
  alternates: { canonical: "/tools" },
};

export default function ToolsIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Free money calculators</h1>
      <p className="mt-2 text-slate-600">Run the numbers in seconds. No sign-up, and nothing you enter is stored.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <Link key={t.slug} href={`/tools/${t.slug}`} className="card hover:border-brand-300">
            <h2 className="font-semibold text-slate-900">{t.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.summary}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-brand-700">Open calculator →</span>
          </Link>
        ))}
      </div>
      <p className="mt-10 text-sm text-slate-600">
        Want answers for your situation? <Link href="/signup" className="font-semibold text-brand-700 underline">Ask Dollarsafe&apos;s AI money coach free</Link>.
      </p>
    </div>
  );
}
