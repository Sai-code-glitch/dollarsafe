import type { Metadata } from "next";
import { ToolPage } from "@/components/tools/ToolPage";
import { DebtPayoffCalculator } from "@/components/tools/DebtPayoffCalculator";
import { toolMetadata } from "@/components/tools/metadata";

export const metadata: Metadata = toolMetadata("debt-payoff");

export default function Page() {
  return (
    <ToolPage
      slug="debt-payoff"
      intro="Add your credit cards and loans to see when you could be debt-free, how much interest you'd pay, and which debt to pay first."
      explainer={
        <>
          <h2 className="text-lg font-semibold text-slate-900">Avalanche or snowball?</h2>
          <p>
            The <strong>avalanche</strong> method sends every extra dollar to the debt with the highest interest rate, which usually costs the
            least in total interest. The <strong>snowball</strong> method pays the smallest balance first, which gives you quick wins and can make it
            easier to stick with. Both work if you keep making every minimum payment and stop adding new debt.
          </p>
          <p>
            If a minimum payment barely covers the interest, that balance can take decades to clear. Adding even a small extra amount each month
            shortens the timeline sharply; try changing the extra payment above to see how much.
          </p>
        </>
      }
    >
      <DebtPayoffCalculator />
    </ToolPage>
  );
}
