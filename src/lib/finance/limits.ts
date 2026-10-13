/**
 * US federal figures used by the calculators. These change every year: update this file each
 * November when the IRS publishes the next year's inflation adjustments, and bump TAX_YEAR.
 * Sources: IRS Rev. Proc. 2025-32 (tax brackets, standard deduction), IRS Notice 2025-67
 * (401(k)/IRA limits), IRS Rev. Proc. 2025-19 (HSA limits).
 */
export const TAX_YEAR = 2026;

export type FilingStatus = "single" | "married_joint" | "married_separate" | "head_of_household";

export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 16_100,
  married_separate: 16_100,
  married_joint: 32_200,
  head_of_household: 24_150,
};

/** [upper bound of bracket, rate]. The last bracket's bound is Infinity. */
export const TAX_BRACKETS: Record<FilingStatus, [number, number][]> = {
  single: [
    [12_400, 0.1],
    [50_400, 0.12],
    [105_700, 0.22],
    [201_775, 0.24],
    [256_225, 0.32],
    [640_600, 0.35],
    [Infinity, 0.37],
  ],
  married_joint: [
    [24_800, 0.1],
    [100_800, 0.12],
    [211_400, 0.22],
    [403_550, 0.24],
    [512_450, 0.32],
    [768_700, 0.35],
    [Infinity, 0.37],
  ],
  married_separate: [
    [12_400, 0.1],
    [50_400, 0.12],
    [105_700, 0.22],
    [201_775, 0.24],
    [256_225, 0.32],
    [384_350, 0.35],
    [Infinity, 0.37],
  ],
  head_of_household: [
    [17_700, 0.1],
    [67_450, 0.12],
    [105_700, 0.22],
    [201_750, 0.24],
    [256_200, 0.32],
    [640_600, 0.35],
    [Infinity, 0.37],
  ],
};

export const CONTRIBUTION_LIMITS = {
  employee401k: 24_500,
  catchUp401k50: 8_000,
  /** SECURE 2.0 "super catch-up" for ages 60-63 replaces the regular catch-up. */
  superCatchUp401k60to63: 11_250,
  ira: 7_500,
  iraCatchUp50: 1_100,
  hsaSelf: 4_400,
  hsaFamily: 8_750,
  hsaCatchUp55: 1_000,
} as const;

export const SOURCES_NOTE = `Figures are for tax year ${TAX_YEAR}. Confirm current numbers at irs.gov before acting.`;
