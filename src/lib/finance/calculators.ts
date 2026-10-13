import { CONTRIBUTION_LIMITS, FilingStatus, SOURCES_NOTE, STANDARD_DEDUCTION, TAX_BRACKETS, TAX_YEAR } from "./limits";

/** Deterministic money math. The advisor calls these instead of doing arithmetic itself. */

const round2 = (n: number) => Math.round(n * 100) / 100;

export function compoundGrowth(input: {
  startingBalance: number;
  monthlyContribution: number;
  annualReturnPct: number;
  years: number;
}) {
  const { startingBalance, monthlyContribution, annualReturnPct, years } = input;
  const r = annualReturnPct / 100 / 12;
  const yearly: { year: number; balance: number; contributed: number }[] = [];
  let balance = startingBalance;
  let contributed = startingBalance;
  for (let m = 1; m <= Math.round(years * 12); m++) {
    balance = balance * (1 + r) + monthlyContribution;
    contributed += monthlyContribution;
    if (m % 12 === 0) yearly.push({ year: m / 12, balance: round2(balance), contributed: round2(contributed) });
  }
  return {
    finalBalance: round2(balance),
    totalContributed: round2(contributed),
    totalGrowth: round2(balance - contributed),
    yearly: yearly.length > 12 ? yearly.filter((y, i) => i % Math.ceil(yearly.length / 12) === 0 || i === yearly.length - 1) : yearly,
    note: "Illustration with a constant assumed return. Real returns vary year to year and can be negative.",
  };
}

export function budgetBreakdown(input: { monthlyTakeHome: number; needsPct?: number; wantsPct?: number; savingsPct?: number }) {
  const needsPct = input.needsPct ?? 50;
  const wantsPct = input.wantsPct ?? 30;
  const savingsPct = input.savingsPct ?? 20;
  const total = needsPct + wantsPct + savingsPct;
  if (Math.abs(total - 100) > 0.01) throw new Error(`Percentages must add up to 100 (got ${total}).`);
  const t = input.monthlyTakeHome;
  return {
    monthlyTakeHome: t,
    needs: round2((t * needsPct) / 100),
    wants: round2((t * wantsPct) / 100),
    savingsAndDebt: round2((t * savingsPct) / 100),
    split: `${needsPct}/${wantsPct}/${savingsPct}`,
  };
}

export interface Debt {
  name: string;
  balance: number;
  aprPct: number;
  minimumPayment: number;
}

export function debtPayoffPlan(input: { debts: Debt[]; extraMonthlyPayment: number; strategy: "avalanche" | "snowball" }) {
  const debts = input.debts.map((d) => ({ ...d, remaining: d.balance, interestPaid: 0, paidOffMonth: 0 }));
  if (debts.length === 0) throw new Error("Add at least one debt.");
  for (const d of debts) {
    const monthlyInterest = d.balance * (d.aprPct / 100 / 12);
    if (d.minimumPayment <= monthlyInterest && input.extraMonthlyPayment <= 0)
      throw new Error(`The minimum payment on "${d.name}" does not cover its monthly interest, so it would never be paid off.`);
  }
  const order = [...debts].sort((a, b) =>
    input.strategy === "avalanche" ? b.aprPct - a.aprPct || a.balance - b.balance : a.balance - b.balance || b.aprPct - a.aprPct,
  );
  const budget = debts.reduce((s, d) => s + d.minimumPayment, 0) + input.extraMonthlyPayment;
  let month = 0;
  const MAX_MONTHS = 600;
  while (debts.some((d) => d.remaining > 0.005) && month < MAX_MONTHS) {
    month++;
    for (const d of debts) {
      if (d.remaining <= 0) continue;
      const interest = d.remaining * (d.aprPct / 100 / 12);
      d.remaining += interest;
      d.interestPaid += interest;
    }
    let available = budget;
    for (const d of debts) {
      if (d.remaining <= 0) continue;
      const pay = Math.min(d.minimumPayment, d.remaining, available);
      d.remaining -= pay;
      available -= pay;
    }
    for (const d of order) {
      if (available <= 0) break;
      if (d.remaining <= 0) continue;
      const pay = Math.min(d.remaining, available);
      d.remaining -= pay;
      available -= pay;
    }
    for (const d of debts) if (d.remaining <= 0.005 && !d.paidOffMonth) {
      d.remaining = 0;
      d.paidOffMonth = month;
    }
  }
  const finished = !debts.some((d) => d.remaining > 0.005);
  return {
    strategy: input.strategy,
    monthlyBudget: round2(budget),
    payoffOrder: order.map((d) => d.name),
    monthsToDebtFree: finished ? month : null,
    totalInterest: round2(debts.reduce((s, d) => s + d.interestPaid, 0)),
    perDebt: debts.map((d) => ({ name: d.name, paidOffMonth: d.paidOffMonth || null, interestPaid: round2(d.interestPaid) })),
    note: finished ? undefined : `Not paid off within ${MAX_MONTHS / 12} years at this payment level.`,
  };
}

export function emergencyFundTarget(input: {
  monthlyEssentialExpenses: number;
  incomeStability: "stable" | "variable";
  dependents: number;
  currentSavings: number;
}) {
  let low = 3;
  let high = 6;
  if (input.incomeStability === "variable") {
    low = 6;
    high = 9;
  }
  if (input.dependents > 0) high += 3;
  const lowTarget = round2(input.monthlyEssentialExpenses * low);
  const highTarget = round2(input.monthlyEssentialExpenses * high);
  return {
    monthsRange: `${low}-${high}`,
    targetLow: lowTarget,
    targetHigh: highTarget,
    starterGoal: Math.min(1000, lowTarget),
    currentSavings: input.currentSavings,
    gapToLowTarget: round2(Math.max(0, lowTarget - input.currentSavings)),
    monthsCovered: input.monthlyEssentialExpenses > 0 ? round2(input.currentSavings / input.monthlyEssentialExpenses) : null,
  };
}

export function retirementProjection(input: {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  annualReturnPct: number;
  inflationPct: number;
  withdrawalRatePct: number;
}) {
  const years = input.retirementAge - input.currentAge;
  if (years <= 0) throw new Error("Retirement age must be after current age.");
  const growth = compoundGrowth({
    startingBalance: input.currentSavings,
    monthlyContribution: input.monthlyContribution,
    annualReturnPct: input.annualReturnPct,
    years,
  });
  const inflationFactor = Math.pow(1 + input.inflationPct / 100, years);
  const realBalance = growth.finalBalance / inflationFactor;
  return {
    yearsUntilRetirement: years,
    projectedBalance: growth.finalBalance,
    projectedBalanceInTodaysDollars: round2(realBalance),
    totalContributed: growth.totalContributed,
    annualIncomeAtWithdrawalRate: round2(growth.finalBalance * (input.withdrawalRatePct / 100)),
    annualIncomeInTodaysDollars: round2(realBalance * (input.withdrawalRatePct / 100)),
    note: "Illustration only. Assumes constant returns and inflation; does not include Social Security, pensions or taxes.",
  };
}

export function contributionLimits(input: { age: number; hsaCoverage: "self" | "family" | "none" }) {
  const L = CONTRIBUTION_LIMITS;
  const catchUp401k = input.age >= 60 && input.age <= 63 ? L.superCatchUp401k60to63 : input.age >= 50 ? L.catchUp401k50 : 0;
  const iraCatch = input.age >= 50 ? L.iraCatchUp50 : 0;
  const hsaBase = input.hsaCoverage === "self" ? L.hsaSelf : input.hsaCoverage === "family" ? L.hsaFamily : 0;
  const hsaCatch = input.hsaCoverage !== "none" && input.age >= 55 ? L.hsaCatchUp55 : 0;
  return {
    taxYear: TAX_YEAR,
    employee401k: L.employee401k + catchUp401k,
    employee401kCatchUpIncluded: catchUp401k,
    ira: L.ira + iraCatch,
    iraCatchUpIncluded: iraCatch,
    hsa: input.hsaCoverage === "none" ? null : hsaBase + hsaCatch,
    notes: [
      "401(k) limit is the employee deferral limit; employer contributions are separate.",
      "Roth IRA eligibility phases out at higher incomes.",
      "HSA requires enrollment in an HSA-eligible high-deductible health plan; not allowed once enrolled in Medicare.",
      SOURCES_NOTE,
    ],
  };
}

export function federalTaxEstimate(input: { filingStatus: FilingStatus; grossIncome: number; preTaxContributions: number }) {
  const deduction = STANDARD_DEDUCTION[input.filingStatus];
  const taxable = Math.max(0, input.grossIncome - input.preTaxContributions - deduction);
  let tax = 0;
  let lower = 0;
  let marginal = 0.1;
  const breakdown: { rate: string; taxedAmount: number; tax: number }[] = [];
  for (const [upper, rate] of TAX_BRACKETS[input.filingStatus]) {
    if (taxable <= lower) break;
    const amount = Math.min(taxable, upper) - lower;
    tax += amount * rate;
    marginal = rate;
    breakdown.push({ rate: `${Math.round(rate * 100)}%`, taxedAmount: round2(amount), tax: round2(amount * rate) });
    lower = upper;
  }
  return {
    taxYear: TAX_YEAR,
    standardDeduction: deduction,
    taxableIncome: round2(taxable),
    estimatedFederalIncomeTax: round2(tax),
    marginalRate: `${Math.round(marginal * 100)}%`,
    effectiveRateOnGross: input.grossIncome > 0 ? `${round2((tax / input.grossIncome) * 100)}%` : "0%",
    breakdown,
    notes: [
      "Estimate of regular federal income tax only, using the standard deduction.",
      "Excludes credits, other deductions, payroll (FICA), self-employment, state and local taxes.",
      SOURCES_NOTE,
    ],
  };
}

export function loanPayment(input: { principal: number; aprPct: number; years: number }) {
  const n = Math.round(input.years * 12);
  if (n <= 0) throw new Error("Loan term must be positive.");
  const r = input.aprPct / 100 / 12;
  const payment = r === 0 ? input.principal / n : (input.principal * r) / (1 - Math.pow(1 + r, -n));
  return {
    monthlyPayment: round2(payment),
    totalPaid: round2(payment * n),
    totalInterest: round2(payment * n - input.principal),
    months: n,
  };
}
