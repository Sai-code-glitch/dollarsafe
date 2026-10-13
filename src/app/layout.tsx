import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: { default: "Dollarsafe: AI money coach for every age", template: "%s · Dollarsafe" },
  description:
    "Dollarsafe is an AI money coach for every stage of life, from first paycheck to retirement. Budgeting, debt, saving, retirement accounts and taxes, explained for you.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white" aria-hidden>$</span>
              Dollarsafe
            </Link>
            <div className="flex items-center gap-3 whitespace-nowrap text-sm sm:gap-4">
              <Link href="/pricing" className="text-slate-600 hover:text-slate-900">Pricing</Link>
              {user ? (
                <>
                  <Link href="/chat" className="text-slate-600 hover:text-slate-900">Coach</Link>
                  <Link href="/account" className="text-slate-600 hover:text-slate-900">Account</Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" className="text-slate-600 hover:text-slate-900">Sign in</Link>
                  <Link href="/signup" className="btn-primary">Start free</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 text-xs leading-relaxed text-slate-500">
            <p>
              <strong className="text-slate-700">Dollarsafe is an AI service that provides financial education and general guidance.</strong>{" "}
              It is not a registered investment adviser, broker-dealer, tax preparer, law firm or insurance agency, and it does not
              recommend specific securities. Answers are generated automatically by AI without human review and may contain errors.
              Consider a licensed professional before major decisions. <Link className="underline" href="/legal/disclosures">Full disclosures</Link>.
            </p>
            <p className="flex flex-wrap gap-4">
              <Link className="underline" href="/legal/terms">Terms</Link>
              <Link className="underline" href="/legal/privacy">Privacy</Link>
              <Link className="underline" href="/legal/disclosures">Disclosures</Link>
              <span>In crisis? Call or text 988.</span>
              <span>© {new Date().getFullYear()} Dollarsafe</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
