import { z } from "zod";
import type * as Beta from "@anthropic-ai/sdk/resources/beta/messages/messages";
import {
  budgetBreakdown,
  compoundGrowth,
  contributionLimits,
  debtPayoffPlan,
  emergencyFundTarget,
  federalTaxEstimate,
  loanPayment,
  retirementProjection,
} from "../finance/calculators";

/**
 * Calculator tools the advisor can call. Each has a strict JSON schema for the API and a matching
 * zod schema that is checked again before the calculator runs.
 */

const money = z.number().min(0).max(1e9);
const pct = (max: number) => z.number().min(0).max(max);

const schemas = {
  compound_growth: z.object({
    startingBalance: money,
    monthlyContribution: money,
    annualReturnPct: pct(20),
    years: z.number().min(1).max(80),
  }),
  budget_breakdown: z.object({
    monthlyTakeHome: money,
    needsPct: pct(100),
    wantsPct: pct(100),
    savingsPct: pct(100),
  }),
  debt_payoff_plan: z.object({
    debts: z
      .array(z.object({ name: z.string().min(1).max(60), balance: money, aprPct: pct(100), minimumPayment: money }))
      .min(1)
      .max(15),
    extraMonthlyPayment: money,
    strategy: z.enum(["avalanche", "snowball"]),
  }),
  emergency_fund_target: z.object({
    monthlyEssentialExpenses: money,
    incomeStability: z.enum(["stable", "variable"]),
    dependents: z.number().int().min(0).max(20),
    currentSavings: money,
  }),
  retirement_projection: z.object({
    currentAge: z.number().int().min(13).max(100),
    retirementAge: z.number().int().min(14).max(100),
    currentSavings: money,
    monthlyContribution: money,
    annualReturnPct: pct(15),
    inflationPct: pct(10),
    withdrawalRatePct: pct(10),
  }),
  contribution_limits: z.object({
    age: z.number().int().min(13).max(120),
    hsaCoverage: z.enum(["self", "family", "none"]),
  }),
  federal_tax_estimate: z.object({
    filingStatus: z.enum(["single", "married_joint", "married_separate", "head_of_household"]),
    grossIncome: money,
    preTaxContributions: money,
  }),
  loan_payment: z.object({
    principal: money,
    aprPct: pct(100),
    years: z.number().min(0.25).max(50),
  }),
} as const;

export type ToolName = keyof typeof schemas;

type JsonSchema = Beta.BetaTool["input_schema"];
const num = (description: string) => ({ type: "number", description });
const obj = (properties: Record<string, unknown>): JsonSchema => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const TOOL_DEFINITIONS: Beta.BetaTool[] = [
  {
    name: "compound_growth",
    description:
      "Project how savings grow with a starting balance, a fixed monthly contribution and an assumed constant annual return, compounded monthly. Use for 'how much will I have if I save X' questions. Returns year-by-year balances.",
    input_schema: obj({
      startingBalance: num("Current balance in USD"),
      monthlyContribution: num("Amount added each month in USD"),
      annualReturnPct: num("Assumed average annual return in percent, e.g. 6 for 6%. Use conservative assumptions (e.g. 4-7 for a diversified long-term portfolio, ~4 for high-yield savings)."),
      years: num("Number of years"),
    }),
    strict: true,
  },
  {
    name: "budget_breakdown",
    description:
      "Split monthly take-home pay into needs, wants and savings/debt buckets. Default split is 50/30/20; adjust the percentages (they must total 100) for high cost of living or aggressive debt payoff.",
    input_schema: obj({
      monthlyTakeHome: num("Monthly take-home (after-tax) pay in USD"),
      needsPct: num("Percent for needs"),
      wantsPct: num("Percent for wants"),
      savingsPct: num("Percent for savings and extra debt payments"),
    }),
    strict: true,
  },
  {
    name: "debt_payoff_plan",
    description:
      "Simulate paying off several debts month by month with avalanche (highest APR first, least interest) or snowball (smallest balance first, quick wins). Returns payoff order, months to debt-free and total interest. Run both strategies to compare when helpful.",
    input_schema: obj({
      debts: {
        type: "array",
        description: "Each debt",
        items: obj({
          name: { type: "string", description: "Label such as 'Visa' or 'Car loan'" },
          balance: num("Current balance in USD"),
          aprPct: num("Annual percentage rate, e.g. 24.9"),
          minimumPayment: num("Required monthly minimum in USD"),
        }),
      },
      extraMonthlyPayment: num("Extra amount per month on top of all minimums, in USD"),
      strategy: { type: "string", enum: ["avalanche", "snowball"] },
    }),
    strict: true,
  },
  {
    name: "emergency_fund_target",
    description: "Compute an emergency fund target range from essential monthly expenses, income stability and dependents, and the gap from current savings.",
    input_schema: obj({
      monthlyEssentialExpenses: num("Rent/mortgage, utilities, food, insurance, minimum debt payments, transport, in USD"),
      incomeStability: { type: "string", enum: ["stable", "variable"] },
      dependents: num("Number of dependents"),
      currentSavings: num("Cash savings already set aside, in USD"),
    }),
    strict: true,
  },
  {
    name: "retirement_projection",
    description:
      "Illustrate a retirement savings path: projected balance at retirement in future and today's dollars, and annual income at a chosen withdrawal rate. Excludes Social Security and pensions.",
    input_schema: obj({
      currentAge: num("Current age"),
      retirementAge: num("Target retirement age"),
      currentSavings: num("Current retirement savings in USD"),
      monthlyContribution: num("Monthly contribution including any employer match, in USD"),
      annualReturnPct: num("Assumed average annual return percent (use 5-7 for illustration)"),
      inflationPct: num("Assumed inflation percent (2.5-3 typical)"),
      withdrawalRatePct: num("Withdrawal rate percent in retirement (4 is a common rule of thumb)"),
    }),
    strict: true,
  },
  {
    name: "contribution_limits",
    description: "Current-year IRS contribution limits for 401(k)/403(b), IRA and HSA, including age-based catch-up amounts.",
    input_schema: obj({
      age: num("Age at the end of the tax year"),
      hsaCoverage: { type: "string", enum: ["self", "family", "none"] },
    }),
    strict: true,
  },
  {
    name: "federal_tax_estimate",
    description:
      "Estimate regular federal income tax with the standard deduction for the current tax year: taxable income, tax by bracket, marginal and effective rate. Use to explain how brackets work or the effect of pre-tax contributions.",
    input_schema: obj({
      filingStatus: { type: "string", enum: ["single", "married_joint", "married_separate", "head_of_household"] },
      grossIncome: num("Annual gross income in USD"),
      preTaxContributions: num("Annual pre-tax 401(k)/HSA/etc. contributions in USD (0 if none)"),
    }),
    strict: true,
  },
  {
    name: "loan_payment",
    description: "Monthly payment, total paid and total interest for a fixed-rate amortizing loan (auto, mortgage principal & interest, personal or student loan).",
    input_schema: obj({
      principal: num("Amount borrowed in USD"),
      aprPct: num("Annual interest rate percent"),
      years: num("Loan term in years"),
    }),
    strict: true,
  },
];

const runners: { [K in ToolName]: (input: z.infer<(typeof schemas)[K]>) => unknown } = {
  compound_growth: compoundGrowth,
  budget_breakdown: budgetBreakdown,
  debt_payoff_plan: debtPayoffPlan,
  emergency_fund_target: emergencyFundTarget,
  retirement_projection: retirementProjection,
  contribution_limits: contributionLimits,
  federal_tax_estimate: federalTaxEstimate,
  loan_payment: loanPayment,
};

export function isToolName(name: string): name is ToolName {
  return name in schemas;
}

/** Validate and run one tool call. Never throws: errors come back as `{ ok: false }` for the model to read. */
export function runTool(name: string, input: unknown): { ok: true; output: unknown } | { ok: false; error: string } {
  if (!isToolName(name)) return { ok: false, error: `Unknown tool: ${name}` };
  const parsed = schemas[name].safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: `Invalid input: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}` };
  }
  try {
    return { ok: true, output: (runners[name] as (i: unknown) => unknown)(parsed.data) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Calculation failed" };
  }
}
