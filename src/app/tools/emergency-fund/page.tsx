import type { Metadata } from "next";
import { ToolPage } from "@/components/tools/ToolPage";
import { EmergencyFundCalculator } from "@/components/tools/EmergencyFundCalculator";
import { toolMetadata } from "@/components/tools/metadata";

export const metadata: Metadata = toolMetadata("emergency-fund");

export default function Page() {
  return (
    <ToolPage
      slug="emergency-fund"
      intro="Find out how much to keep set aside for job loss, car repairs or medical bills, and how far you are from that goal."
      explainer={
        <>
          <h2 className="text-lg font-semibold text-slate-900">How much is enough?</h2>
          <p>
            A common guideline is 3 to 6 months of essential expenses with a steady paycheck, and 6 to 9 months if your income varies. Each person
            who depends on you adds a few more months of cushion. Many people start with a $1,000 starter fund, pay down high-interest debt, then
            build the rest.
          </p>
          <p>Keep it somewhere safe and easy to reach, such as an FDIC-insured high-yield savings account, separate from everyday checking.</p>
        </>
      }
    >
      <EmergencyFundCalculator />
    </ToolPage>
  );
}
