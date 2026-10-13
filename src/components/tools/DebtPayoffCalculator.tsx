"use client";

import { useMemo, useState } from "react";
import { debtPayoffPlan } from "@/lib/finance/calculators";
import { NumberField, ResultError, Stat, monthsLabel, num, usd } from "./fields";

interface Row {
  id: number;
  name: string;
  balance: string;
  apr: string;
  min: string;
}

let nextId = 3;

export function DebtPayoffCalculator() {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, name: "Credit card", balance: "4200", apr: "24.9", min: "110" },
    { id: 2, name: "Car loan", balance: "9800", apr: "7.5", min: "260" },
  ]);
  const [extra, setExtra] = useState("200");
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");

  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const result = useMemo(() => {
    const debts = rows
      .filter((r) => num(r.balance) > 0)
      .map((r, i) => ({ name: r.name.trim() || `Debt ${i + 1}`, balance: num(r.balance), aprPct: num(r.apr), minimumPayment: num(r.min) }));
    if (!debts.length) return { error: "Enter at least one debt with a balance." };
    let plan;
    try {
      plan = debtPayoffPlan({ debts, extraMonthlyPayment: num(extra), strategy });
    } catch (e) {
      return { error: (e as Error).message };
    }
    // Baseline for the "you save" line; minimums alone may never pay a debt off, which just hides it.
    let minimumsOnly = null;
    try {
      minimumsOnly = debtPayoffPlan({ debts, extraMonthlyPayment: 0, strategy });
    } catch {}
    return { plan, minimumsOnly };
  }, [rows, extra, strategy]);

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="card space-y-4 md:col-span-3">
        {rows.map((r, i) => (
          <fieldset key={r.id} className="rounded-xl border border-slate-200 p-3">
            <legend className="px-1 text-xs font-semibold text-slate-500">Debt {i + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="label">Name</span>
                <input className="input" value={r.name} onChange={(e) => update(r.id, { name: e.target.value })} maxLength={40} />
              </label>
              <NumberField label="Balance" prefix="$" value={r.balance} onChange={(v) => update(r.id, { balance: v })} />
              <NumberField label="Interest rate (APR)" suffix="%" value={r.apr} onChange={(v) => update(r.id, { apr: v })} />
              <NumberField label="Minimum payment" prefix="$" suffix="/mo" value={r.min} onChange={(v) => update(r.id, { min: v })} />
              {rows.length > 1 && (
                <button type="button" className="self-end text-left text-sm text-red-700 underline" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>
                  Remove
                </button>
              )}
            </div>
          </fieldset>
        ))}
        {rows.length < 10 && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setRows((rs) => [...rs, { id: nextId++, name: "", balance: "", apr: "", min: "" }])}
          >
            + Add a debt
          </button>
        )}
        <NumberField label="Extra you can pay each month" prefix="$" suffix="/mo" value={extra} onChange={setExtra} />
        <div>
          <span className="label">Strategy</span>
          <div className="grid grid-cols-2 gap-2">
            {(["avalanche", "snowball"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={strategy === s}
                onClick={() => setStrategy(s)}
                className={strategy === s ? "btn-primary" : "btn-secondary"}
              >
                {s === "avalanche" ? "Avalanche (highest rate first)" : "Snowball (smallest balance first)"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 md:col-span-2" aria-live="polite">
        {"error" in result ? (
          <ResultError message={result.error!} />
        ) : (
          <>
            <Stat
              emphasis
              label="Debt-free in"
              value={result.plan!.monthsToDebtFree ? monthsLabel(result.plan!.monthsToDebtFree) : "50+ years"}
            />
            <Stat label="Total interest" value={usd(result.plan!.totalInterest)} />
            <Stat label="Monthly payment" value={usd(result.plan!.monthlyBudget)} />
            {result.minimumsOnly?.monthsToDebtFree && result.plan!.monthsToDebtFree && num(extra) > 0 && (
              <p className="rounded-xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                Paying {usd(num(extra))} extra saves about{" "}
                <strong>{usd(Math.max(0, result.minimumsOnly.totalInterest - result.plan!.totalInterest))}</strong> in interest and{" "}
                <strong>{monthsLabel(Math.max(0, result.minimumsOnly.monthsToDebtFree - result.plan!.monthsToDebtFree))}</strong> compared with minimums only.
              </p>
            )}
            <div className="card p-4">
              <h3 className="text-sm font-semibold">Payoff order</h3>
              <ol className="mt-2 space-y-1 text-sm">
                {result.plan!.payoffOrder.map((name) => {
                  const d = result.plan!.perDebt.find((p) => p.name === name);
                  return (
                    <li key={name} className="flex justify-between gap-2">
                      <span>{name}</span>
                      <span className="text-slate-500">{d?.paidOffMonth ? `month ${d.paidOffMonth}` : "not paid off"}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
            {result.plan!.note && <ResultError message={result.plan!.note} />}
          </>
        )}
      </div>
    </div>
  );
}
