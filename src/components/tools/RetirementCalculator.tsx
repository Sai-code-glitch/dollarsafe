"use client";

import { useMemo, useState } from "react";
import { retirementProjection } from "@/lib/finance/calculators";
import { NumberField, ResultError, Stat, num, usd } from "./fields";

export function RetirementCalculator() {
  const [age, setAge] = useState("30");
  const [retireAge, setRetireAge] = useState("67");
  const [saved, setSaved] = useState("25000");
  const [monthly, setMonthly] = useState("500");
  const [ret, setRet] = useState("6");
  const [inflation, setInflation] = useState("2.5");

  const result = useMemo(() => {
    try {
      return {
        r: retirementProjection({
          currentAge: num(age),
          retirementAge: num(retireAge),
          currentSavings: num(saved),
          monthlyContribution: num(monthly),
          annualReturnPct: Math.min(num(ret), 15),
          inflationPct: num(inflation),
          withdrawalRatePct: 4,
        }),
      };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [age, retireAge, saved, monthly, ret, inflation]);

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="card grid gap-4 sm:grid-cols-2 md:col-span-3">
        <NumberField label="Your age" value={age} onChange={setAge} step="1" />
        <NumberField label="Retirement age" value={retireAge} onChange={setRetireAge} step="1" />
        <NumberField label="Retirement savings today" prefix="$" value={saved} onChange={setSaved} />
        <NumberField label="Monthly contribution" prefix="$" suffix="/mo" value={monthly} onChange={setMonthly} hint="Include any employer match." />
        <NumberField label="Assumed yearly return" suffix="%" value={ret} onChange={setRet} hint="Capped at 15%. Real returns vary." />
        <NumberField label="Assumed inflation" suffix="%" value={inflation} onChange={setInflation} />
      </div>
      <div className="space-y-3 md:col-span-2" aria-live="polite">
        {"error" in result ? (
          <ResultError message={result.error!} />
        ) : (
          <>
            <Stat emphasis label={`Projected at ${num(retireAge)}`} value={usd(result.r!.projectedBalance)} />
            <Stat label="In today's dollars" value={usd(result.r!.projectedBalanceInTodaysDollars)} />
            <Stat label="Yearly income at a 4% withdrawal (today's dollars)" value={usd(result.r!.annualIncomeInTodaysDollars)} />
            <p className="text-xs text-slate-500">{result.r!.note}</p>
          </>
        )}
      </div>
    </div>
  );
}
