"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "./api";

export function AuthForm({ mode, next }: { mode: "signup" | "login"; next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmAdult, setConfirmAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const signup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api(signup ? "/api/auth/signup" : "/api/auth/login", {
        body: signup ? { email, password, confirmAdult, acceptTerms } : { email, password },
      });
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      window.location.href = signup ? "/onboarding" : safeNext ?? "/chat";
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 10 : undefined}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {signup && <p className="mt-1 text-xs text-slate-500">At least 10 characters.</p>}
      </div>
      {signup && (
        <div className="space-y-2 text-sm text-slate-700">
          <label className="flex gap-2">
            <input type="checkbox" checked={confirmAdult} onChange={(e) => setConfirmAdult(e.target.checked)} required />
            <span>I am 18 or older. (Teens can join through a parent&apos;s Family Premium plan.)</span>
          </label>
          <label className="flex gap-2">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} required />
            <span>
              I agree to the <Link className="underline" href="/legal/terms" target="_blank">Terms</Link> and{" "}
              <Link className="underline" href="/legal/privacy" target="_blank">Privacy Policy</Link>, and I understand Dollarsafe is an AI that
              provides financial education, not individualized investment, tax or legal advice (
              <Link className="underline" href="/legal/disclosures" target="_blank">disclosures</Link>).
            </span>
          </label>
        </div>
      )}
      {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "One moment…" : signup ? "Create account" : "Sign in"}</button>
      <p className="text-center text-sm text-slate-600">
        {signup ? (
          <>Already have an account? <Link className="font-semibold text-brand-700" href="/login">Sign in</Link></>
        ) : (
          <>New to Dollarsafe? <Link className="font-semibold text-brand-700" href="/signup">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
