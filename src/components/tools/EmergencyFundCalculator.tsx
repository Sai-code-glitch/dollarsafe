"use client";

import { useMemo, useState } from "react";
import { emergencyFundTarget } from "@/lib/finance/calculators";
import { NumberField, Stat, num, usd } from "./fields";

export function EmergencyFundCalculator() {
  const [expenses, setExpenses] = useState("2500");
  const [stability, setStability] = useState<"stable" | "variable">("stable");
  const [dependents, setDependents] = useState("0");
  const [saved, setSaved] = useState("1200");
  const [monthly, setMonthly] = useState("200");

  const r = useMemo(
    () =>
      emergencyFundTarget({
        monthlyEssentialExpenses: num(expenses),
        incomeStability: stability,
        dependents: Math.floor(num(dependents)),
        currentSavings: num(saved),
      }),
    [expenses, stability, dependents, saved],
  );
  const monthsToGoal = r.gapToLowTarget > 0 && num(monthly) > 0 ? Math.ceil(r.gapToLowTarget / num(monthly)) : null;

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="card space-y-4 md:col-span-3">
        <NumberField label="Essential monthly expenses" prefix="$" suffix="/mo" value={expenses} onChange={setExpenses} hint="Housing, utilities, food, insurance, transport and minimum debt payments." />
        <div>
          <span className="label">Your income</span>
          <div className="grid grid-cols-2 gap-2">
            {(["stable", "variable"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={stability === s} onClick={() => setStability(s)} className={stability === s ? "btn-primary" : "btn-secondary"}>
                {s === "stable" ? "Steady paycheck" : "Variable / self-employed"}
              </button>
            ))}
          </div>
        </div>
        <NumberField label="People who depend on your income" value={dependents} onChange={setDependents} step="1" />
        <NumberField label="Emergency savings today" prefix="$" value={saved} onChange={setSaved} />
        <NumberField label="How much you can add each month" prefix="$" suffix="/mo" value={monthly} onChange={setMonthly} />
      </div>
      <div className="space-y-3 md:col-span-2" aria-live="polite">
        <Stat emphasis label={`Target (${r.monthsRange} months of expenses)`} value={`${usd(r.targetLow)} - ${usd(r.targetHigh)}`} />
        <Stat label="You have" value={r.monthsCovered === null ? usd(r.currentSavings) : `${r.monthsCovered} months covered`} />
        <Stat label="Gap to the low end" value={usd(r.gapToLowTarget)} />
        {r.currentSavings < r.starterGoal && (
          <p className="text-sm text-slate-600">First milestone: a {usd(r.starterGoal)} starter fund for small surprises.</p>
        )}
        {monthsToGoal && <p className="text-sm text-slate-600">At {usd(num(monthly))} a month you&apos;d reach the low end in about {monthsToGoal} months.</p>}
      </div>
    </div>
  );
}
