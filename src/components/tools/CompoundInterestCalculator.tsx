"use client";

import { useMemo, useState } from "react";
import { compoundGrowth } from "@/lib/finance/calculators";
import { NumberField, Stat, num, usd } from "./fields";

export function CompoundInterestCalculator() {
  const [start, setStart] = useState("1000");
  const [monthly, setMonthly] = useState("200");
  const [ret, setRet] = useState("6");
  const [years, setYears] = useState("20");

  const g = useMemo(
    () =>
      compoundGrowth({
        startingBalance: num(start),
        monthlyContribution: num(monthly),
        annualReturnPct: Math.min(num(ret), 15),
        years: Math.min(Math.max(num(years), 0), 70),
      }),
    [start, monthly, ret, years],
  );
  const max = Math.max(1, ...g.yearly.map((y) => y.balance));

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="card grid gap-4 sm:grid-cols-2 md:col-span-3">
        <NumberField label="Starting amount" prefix="$" value={start} onChange={setStart} />
        <NumberField label="Monthly deposit" prefix="$" suffix="/mo" value={monthly} onChange={setMonthly} />
        <NumberField label="Assumed yearly return" suffix="%" value={ret} onChange={setRet} hint="Capped at 15%. Real returns vary." />
        <NumberField label="Years" value={years} onChange={setYears} step="1" hint="Up to 70." />
        {g.yearly.length > 0 && (
          <div className="sm:col-span-2">
            <span className="label">Balance by year</span>
            <div className="flex h-32 items-end gap-1" role="img" aria-label="Bar chart of balance by year">
              {g.yearly.map((y) => (
                <div key={y.year} className="flex flex-1 flex-col justify-end" title={`Year ${y.year}: ${usd(y.balance)}`}>
                  <div className="rounded-t bg-brand-500" style={{ height: `${((y.balance - y.contributed) / max) * 100}%` }} />
                  <div className="bg-slate-300" style={{ height: `${(y.contributed / max) * 100}%` }} />
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500"><span className="text-brand-600">■</span> growth <span className="ml-2 text-slate-400">■</span> deposits</p>
          </div>
        )}
      </div>
      <div className="space-y-3 md:col-span-2" aria-live="polite">
        <Stat emphasis label="Ending balance" value={usd(g.finalBalance)} />
        <Stat label="You deposit" value={usd(g.totalContributed)} />
        <Stat label="Growth" value={usd(g.totalGrowth)} />
        <p className="text-xs text-slate-500">{g.note}</p>
      </div>
    </div>
  );
}
