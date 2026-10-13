"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "./api";
import type { PlanId } from "@/lib/plans";

export function PlanButton({ plan, signedIn, current }: { plan: PlanId; signedIn: boolean; current: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (current) return <span className="btn-secondary w-full cursor-default">Your current plan</span>;
  if (!signedIn) return <Link href={`/signup?plan=${plan}`} className="btn-primary w-full">{plan === "FREE" ? "Start free" : "Get started"}</Link>;
  if (plan === "FREE") return <Link href="/account" className="btn-secondary w-full">Manage in account</Link>;

  return (
    <>
      <button
        className="btn-primary w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            const { url } = await api<{ url: string }>("/api/billing/checkout", { body: { plan } });
            window.location.href = url;
          } catch (e) {
            setErr((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening checkout…" : "Upgrade"}
      </button>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </>
  );
}
