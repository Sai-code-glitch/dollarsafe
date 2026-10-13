export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="prose-answer mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-sm text-slate-500">Last updated {updated}</p>
      {children}
    </article>
  );
}
