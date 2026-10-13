import type { Metadata } from "next";
import { ToolPage } from "@/components/tools/ToolPage";
import { CompoundInterestCalculator } from "@/components/tools/CompoundInterestCalculator";
import { toolMetadata } from "@/components/tools/metadata";

export const metadata: Metadata = toolMetadata("compound-interest");

export default function Page() {
  return (
    <ToolPage
      slug="compound-interest"
      intro="See how a starting amount plus regular monthly deposits could grow over time with compound growth."
      explainer={
        <>
          <h2 className="text-lg font-semibold text-slate-900">Why starting early matters</h2>
          <p>
            Compound growth means you earn returns on your past returns. Over long periods, growth can end up larger than everything you deposited,
            which is why small, steady amounts started early often beat larger amounts started late.
          </p>
          <p>Returns are never guaranteed. Savings accounts pay a lower, steadier rate; stock investments can grow more but can also lose value.</p>
        </>
      }
    >
      <CompoundInterestCalculator />
    </ToolPage>
  );
}
