import Link from "next/link";
import { TOOLS, toolBySlug } from "@/lib/tools";

/** Shared layout for the public calculator pages: heading, calculator, coach CTA, related tools, disclaimer. */
export function ToolPage({ slug, intro, children, explainer }: { slug: string; intro: string; children: React.ReactNode; explainer: React.ReactNode }) {
  const tool = toolBySlug(slug)!;
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <nav className="text-sm text-slate-500">
        <Link href="/tools" className="hover:text-slate-800">Free money tools</Link> <span aria-hidden>/</span> {tool.title}
      </nav>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{tool.title}</h1>
      <p className="mt-2 text-slate-600">{intro}</p>

      <div className="mt-8">{children}</div>

      <section className="card mt-8 border-brand-200 bg-brand-50">
        <h2 className="text-lg font-semibold text-slate-900">Want this explained for your situation?</h2>
        <p className="mt-1 text-sm text-slate-700">
          Ask Dollarsafe&apos;s AI money coach a follow-up like <em>&ldquo;{tool.followUp}&rdquo;</em> and get an answer that fits your age, goals and
          budget.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href="/signup" className="btn-primary">Ask the coach free</Link>
          <span className="text-xs text-slate-600">15 free questions a month. No card required.</span>
        </div>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed text-slate-700">{explainer}</section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">More free calculators</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TOOLS.filter((t) => t.slug !== slug).map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`} className="card p-4 hover:border-brand-300">
              <span className="font-medium text-slate-900">{t.title}</span>
              <span className="mt-1 block text-sm text-slate-600">{t.summary}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-10 text-xs text-slate-500">
        For education only. Results are estimates based on the numbers you enter and simple assumptions; they are not financial, tax or investment
        advice. Nothing you enter here is stored.
      </p>
    </div>
  );
}
