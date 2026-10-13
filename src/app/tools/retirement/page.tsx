import type { Metadata } from "next";
import { ToolPage } from "@/components/tools/ToolPage";
import { RetirementCalculator } from "@/components/tools/RetirementCalculator";
import { toolMetadata } from "@/components/tools/metadata";

export const metadata: Metadata = toolMetadata("retirement");

export default function Page() {
  return (
    <ToolPage
      slug="retirement"
      intro="Project what your retirement savings could grow to, see it in today's dollars, and estimate the yearly income it might support."
      explainer={
        <>
          <h2 className="text-lg font-semibold text-slate-900">Reading your projection</h2>
          <p>
            Future dollars buy less because of inflation, so the today&apos;s-dollars figure is the more useful one for planning. The 4% figure is a
            common rule of thumb for how much a portfolio might support each year in retirement; it is not a guarantee.
          </p>
          <p>
            This projection leaves out Social Security, pensions and taxes. For 2026, you can defer up to $24,500 into a 401(k) and $7,500 into an
            IRA, with extra catch-up amounts from age 50.
          </p>
        </>
      }
    >
      <RetirementCalculator />
    </ToolPage>
  );
}
