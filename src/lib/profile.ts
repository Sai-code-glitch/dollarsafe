import { z } from "zod";

export const MIN_AGE = 13; // COPPA: no accounts or profiles for children under 13
export const ADULT_AGE = 18;

export type LifeStageId = "teen" | "young_adult" | "early_career" | "family_builder" | "pre_retiree" | "retiree";

export interface LifeStage {
  id: LifeStageId;
  label: string;
  ages: string;
  focus: string[];
  tone: string;
}

export const LIFE_STAGES: Record<LifeStageId, LifeStage> = {
  teen: {
    id: "teen",
    label: "Teen",
    ages: "13-17",
    focus: [
      "how money, paychecks and taxes work",
      "saving for goals and the habit of paying yourself first",
      "bank accounts, debit vs. credit, and staying safe from scams",
      "what compound growth means and why starting early matters",
      "custodial and teen accounts that need a parent or guardian",
    ],
    tone: "Friendly, encouraging and concrete. Use short sentences and everyday examples (first job, phone bill, saving for a car). Never discuss credit products, loans, investing apps or anything a minor cannot legally open on their own except to explain they need a parent or guardian.",
  },
  young_adult: {
    id: "young_adult",
    label: "Student & young adult",
    ages: "18-24",
    focus: [
      "first budget and first paycheck",
      "building credit responsibly",
      "student loans: federal vs. private, repayment plans",
      "starter emergency fund",
      "employer retirement match and Roth IRA basics",
    ],
    tone: "Practical and encouraging. Assume limited income and little financial background; define jargon.",
  },
  early_career: {
    id: "early_career",
    label: "Early career",
    ages: "25-34",
    focus: [
      "budgeting and automating savings",
      "paying down high-interest debt",
      "retirement accounts (401(k), IRA, HSA) and getting the full employer match",
      "renting vs. buying, saving for a down payment",
      "insurance basics (health, renters, disability)",
    ],
    tone: "Direct and practical. Balance short-term goals with long-term habits.",
  },
  family_builder: {
    id: "family_builder",
    label: "Family builder",
    ages: "35-49",
    focus: [
      "household budgets and cash flow with dependents",
      "balancing retirement saving with college saving (529 plans)",
      "mortgage and debt strategy",
      "life and disability insurance, wills and beneficiaries",
      "teaching kids about money",
    ],
    tone: "Calm and organized. Help prioritize competing goals.",
  },
  pre_retiree: {
    id: "pre_retiree",
    label: "Pre-retiree",
    ages: "50-64",
    focus: [
      "catch-up contributions and retirement readiness",
      "estimating retirement income needs",
      "Social Security claiming basics",
      "health care before Medicare",
      "reducing debt before retirement",
    ],
    tone: "Thorough and reassuring. Be precise with numbers and timelines.",
  },
  retiree: {
    id: "retiree",
    label: "Retiree",
    ages: "65+",
    focus: [
      "making savings last and sustainable withdrawal concepts",
      "required minimum distributions (RMDs) basics",
      "Medicare enrollment basics",
      "protecting against fraud and elder financial abuse",
      "estate planning basics and beneficiary designations",
    ],
    tone: "Patient, clear and respectful. Avoid jargon, spell out acronyms, and use larger concrete examples.",
  },
};

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  // Birth month is not collected (data minimisation), so this is the age reached this calendar year.
  return now.getUTCFullYear() - birthYear;
}

export function lifeStageForAge(age: number): LifeStageId {
  if (age < ADULT_AGE) return "teen";
  if (age < 25) return "young_adult";
  if (age < 35) return "early_career";
  if (age < 50) return "family_builder";
  if (age < 65) return "pre_retiree";
  return "retiree";
}

export const INCOME_BANDS = {
  none: "No income yet",
  under_25k: "Under $25,000",
  "25k_50k": "$25,000 - $50,000",
  "50k_100k": "$50,000 - $100,000",
  "100k_200k": "$100,000 - $200,000",
  over_200k: "Over $200,000",
  prefer_not: "Prefer not to say",
} as const;

export const EMPLOYMENT = {
  student: "Student",
  employed: "Employed (W-2)",
  self_employed: "Self-employed / gig",
  unemployed: "Between jobs",
  retired: "Retired",
  homemaker: "Caregiver / homemaker",
} as const;

export const GOALS = {
  budget: "Build a budget",
  emergency_fund: "Emergency fund",
  debt: "Pay off debt",
  credit: "Build credit",
  retirement: "Save for retirement",
  home: "Buy a home",
  college: "Save for education",
  taxes: "Understand taxes",
  investing_basics: "Learn investing basics",
  income_in_retirement: "Income in retirement",
} as const;

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY",
  "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

const keys = <T extends Record<string, string>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

export const profileInputSchema = z
  .object({
    displayName: z.string().trim().min(1).max(40),
    birthYear: z.number().int().min(1900),
    state: z.enum(US_STATES),
    householdSize: z.number().int().min(1).max(15),
    incomeBand: z.enum(keys(INCOME_BANDS)),
    employment: z.enum(keys(EMPLOYMENT)),
    goals: z.array(z.enum(keys(GOALS))).max(10),
    riskComfort: z.enum(["low", "medium", "high"]),
    notes: z.string().max(1000).default(""),
    guardianConsent: z.boolean().default(false),
  })
  .superRefine((p, ctx) => {
    const age = ageFromBirthYear(p.birthYear);
    if (age < MIN_AGE) ctx.addIssue({ code: "custom", path: ["birthYear"], message: "Dollarsafe is for ages 13 and up." });
    if (age > 120) ctx.addIssue({ code: "custom", path: ["birthYear"], message: "Please enter a valid birth year." });
    if (age < ADULT_AGE && !p.guardianConsent)
      ctx.addIssue({ code: "custom", path: ["guardianConsent"], message: "A parent or guardian must confirm consent for a teen profile." });
  });

export type ProfileInput = z.infer<typeof profileInputSchema>;
