"use client";

import { useMemo, useState } from "react";
import { budgetBreakdown } from "@/lib/finance/calculators";
import { NumberField, ResultError, Stat, num, usd } from "./fields";

export function BudgetCalculator() {
  const [pay, setPay] = useState("4000");
  const [needs, setNeeds] = useState("50");
  const [wants, setWants] = useState("30");
  const [savings, setSavings] = useState("20");

  const result = useMemo(() => {
    try {
      return { b: budgetBreakdown({ monthlyTakeHome: num(pay), needsPct: num(needs), wantsPct: num(wants), savingsPct: num(savings) }) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [pay, needs, wants, savings]);

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="card space-y-4 md:col-span-3">
        <NumberField label="Monthly take-home pay" prefix="$" suffix="/mo" value={pay} onChange={setPay} hint="What lands in your bank account after taxes and deductions." />
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label="Needs" suffix="%" value={needs} onChange={setNeeds} />
          <NumberField label="Wants" suffix="%" value={wants} onChange={setWants} />
          <NumberField label="Savings & debt" suffix="%" value={savings} onChange={setSavings} />
        </div>
        <p className="text-xs text-slate-500">Needs: rent, utilities, groceries, insurance, minimum payments. Wants: dining out, streaming, travel.</p>
      </div>
      <div className="space-y-3 md:col-span-2" aria-live="polite">
        {"error" in result ? (
          <ResultError message={result.error!} />
        ) : (
          <>
            <Stat label={`Needs (${num(needs)}%)`} value={`${usd(result.b!.needs)}/mo`} />
            <Stat label={`Wants (${num(wants)}%)`} value={`${usd(result.b!.wants)}/mo`} />
            <Stat emphasis label={`Savings & extra debt payments (${num(savings)}%)`} value={`${usd(result.b!.savingsAndDebt)}/mo`} />
            <p className="text-sm text-slate-600">That&apos;s {usd(result.b!.savingsAndDebt * 12)} a year toward savings and debt.</p>
          </>
        )}
      </div>
    </div>
  );
}
