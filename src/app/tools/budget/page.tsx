import type { Metadata } from "next";
import { ToolPage } from "@/components/tools/ToolPage";
import { BudgetCalculator } from "@/components/tools/BudgetCalculator";
import { toolMetadata } from "@/components/tools/metadata";

export const metadata: Metadata = toolMetadata("budget");

export default function Page() {
  return (
    <ToolPage
      slug="budget"
      intro="Enter your take-home pay to see a simple 50/30/20 split, then adjust the percentages to fit your life."
      explainer={
        <>
          <h2 className="text-lg font-semibold text-slate-900">How the 50/30/20 rule works</h2>
          <p>
            About 50% of take-home pay goes to needs, 30% to wants, and 20% to savings and paying down debt beyond the minimums. It is a starting
            point, not a rule: in high-cost areas needs often take 60% or more, and that is fine as long as savings still gets something every month.
          </p>
          <p>If your savings share is small, start by automating a transfer on payday, even $25, and raise it each time your pay goes up.</p>
        </>
      }
    >
      <BudgetCalculator />
    </ToolPage>
  );
}
