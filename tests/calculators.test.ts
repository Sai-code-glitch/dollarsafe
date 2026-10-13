import { describe, expect, it } from "vitest";
import {
  budgetBreakdown,
  compoundGrowth,
  contributionLimits,
  debtPayoffPlan,
  emergencyFundTarget,
  federalTaxEstimate,
  loanPayment,
  retirementProjection,
} from "@/lib/finance/calculators";

describe("compoundGrowth", () => {
  it("equals contributions when the return is zero", () => {
    const r = compoundGrowth({ startingBalance: 1000, monthlyContribution: 100, annualReturnPct: 0, years: 10 });
    expect(r.finalBalance).toBe(13000);
    expect(r.totalGrowth).toBe(0);
  });
  it("matches the closed-form future value", () => {
    const r = compoundGrowth({ startingBalance: 0, monthlyContribution: 200, annualReturnPct: 6, years: 20 });
    const i = 0.005;
    const fv = 200 * ((Math.pow(1 + i, 240) - 1) / i);
    expect(r.finalBalance).toBeCloseTo(fv, 0);
    expect(r.yearly.at(-1)?.year).toBe(20);
  });
});

describe("budgetBreakdown", () => {
  it("splits 50/30/20 by default", () => {
    expect(budgetBreakdown({ monthlyTakeHome: 4000 })).toMatchObject({ needs: 2000, wants: 1200, savingsAndDebt: 800 });
  });
  it("rejects percentages that don't total 100", () => {
    expect(() => budgetBreakdown({ monthlyTakeHome: 4000, needsPct: 60, wantsPct: 30, savingsPct: 20 })).toThrow(/100/);
  });
});

describe("debtPayoffPlan", () => {
  const debts = [
    { name: "Card", balance: 4200, aprPct: 24.9, minimumPayment: 110 },
    { name: "Car", balance: 9800, aprPct: 7.5, minimumPayment: 260 },
  ];
  it("avalanche pays less interest than snowball and targets the highest APR first", () => {
    const av = debtPayoffPlan({ debts, extraMonthlyPayment: 200, strategy: "avalanche" });
    const sb = debtPayoffPlan({ debts: [...debts, { name: "Store card", balance: 500, aprPct: 19, minimumPayment: 25 }], extraMonthlyPayment: 200, strategy: "snowball" });
    expect(av.payoffOrder[0]).toBe("Card");
    expect(sb.payoffOrder[0]).toBe("Store card");
    const av3 = debtPayoffPlan({ debts: [...debts, { name: "Store card", balance: 500, aprPct: 19, minimumPayment: 25 }], extraMonthlyPayment: 200, strategy: "avalanche" });
    expect(av3.totalInterest).toBeLessThanOrEqual(sb.totalInterest);
    // Matches the worked example on the landing page.
    expect(av.monthsToDebtFree).toBe(28);
    expect(av.perDebt.find((d) => d.name === "Card")?.paidOffMonth).toBe(17);
  });
  it("flags a minimum payment that never covers interest", () => {
    expect(() => debtPayoffPlan({ debts: [{ name: "X", balance: 10000, aprPct: 30, minimumPayment: 100 }], extraMonthlyPayment: 0, strategy: "avalanche" })).toThrow(/never be paid off/);
  });
});

describe("emergencyFundTarget", () => {
  it("widens the range for variable income and dependents", () => {
    const r = emergencyFundTarget({ monthlyEssentialExpenses: 3000, incomeStability: "variable", dependents: 2, currentSavings: 5000 });
    expect(r.monthsRange).toBe("6-12");
    expect(r.targetLow).toBe(18000);
    expect(r.gapToLowTarget).toBe(13000);
  });
});

describe("retirementProjection", () => {
  it("reports real and nominal balances", () => {
    const r = retirementProjection({ currentAge: 35, retirementAge: 65, currentSavings: 50000, monthlyContribution: 800, annualReturnPct: 6, inflationPct: 2.5, withdrawalRatePct: 4 });
    expect(r.yearsUntilRetirement).toBe(30);
    expect(r.projectedBalanceInTodaysDollars).toBeLessThan(r.projectedBalance);
    expect(r.annualIncomeAtWithdrawalRate).toBeCloseTo(r.projectedBalance * 0.04, 0);
  });
  it("rejects a retirement age in the past", () => {
    expect(() => retirementProjection({ currentAge: 70, retirementAge: 65, currentSavings: 0, monthlyContribution: 0, annualReturnPct: 5, inflationPct: 2, withdrawalRatePct: 4 })).toThrow();
  });
});

describe("contributionLimits", () => {
  it.each([
    [40, 24500, 7500],
    [52, 32500, 8600],
    [61, 35750, 8600],
    [64, 32500, 8600],
  ])("age %i: 401k %i, IRA %i", (age, k, ira) => {
    const r = contributionLimits({ age, hsaCoverage: "none" });
    expect(r.employee401k).toBe(k);
    expect(r.ira).toBe(ira);
    expect(r.hsa).toBeNull();
  });
  it("adds the HSA catch-up at 55", () => {
    expect(contributionLimits({ age: 56, hsaCoverage: "family" }).hsa).toBe(9750);
  });
});

describe("federalTaxEstimate", () => {
  it("applies the standard deduction and brackets", () => {
    const r = federalTaxEstimate({ filingStatus: "single", grossIncome: 65000, preTaxContributions: 3000 });
    expect(r.taxableIncome).toBe(45900);
    expect(r.estimatedFederalIncomeTax).toBe(5260);
    expect(r.marginalRate).toBe("12%");
  });
  it("returns zero tax below the standard deduction", () => {
    expect(federalTaxEstimate({ filingStatus: "married_joint", grossIncome: 30000, preTaxContributions: 0 }).estimatedFederalIncomeTax).toBe(0);
  });
});

describe("loanPayment", () => {
  it("computes an amortized payment", () => {
    expect(loanPayment({ principal: 25000, aprPct: 6.9, years: 5 }).monthlyPayment).toBeCloseTo(493.85, 1);
  });
  it("handles 0% loans", () => {
    expect(loanPayment({ principal: 12000, aprPct: 0, years: 1 }).monthlyPayment).toBe(1000);
  });
});
