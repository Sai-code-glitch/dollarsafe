import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Disclosures" };

export default function Disclosures() {
  return (
    <LegalPage title="Important disclosures" updated="October 13, 2026">
      <h2>Dollarsafe is an AI, and no human reviews its answers</h2>
      <p>
        Every answer, calculation and monthly check-up is generated automatically by artificial intelligence (Anthropic&apos;s Claude models) using
        the information you provide. No human financial professional reviews your conversations or answers before you see them. AI can make
        mistakes, misunderstand your situation, or rely on outdated information. Check important facts and numbers before acting on them.
      </p>
      <h2>Education and general guidance, not individualized investment advice</h2>
      <p>
        Dollarsafe provides financial education and general guidance about budgeting, saving, debt, credit, insurance concepts, retirement and
        education accounts, and how taxes work. Dollarsafe is <strong>not</strong> registered as an investment adviser with the U.S. Securities
        and Exchange Commission or any state, and is not a broker-dealer, bank, insurance agency, tax preparer, CPA firm or law firm.
      </p>
      <ul>
        <li>Dollarsafe does not recommend, rate or predict any specific security, fund, ETF, cryptocurrency or other investment product, and does not tell you to buy, sell or hold one.</li>
        <li>Dollarsafe does not manage money, hold assets, execute trades or have access to your accounts.</li>
        <li>Nothing Dollarsafe says is an offer or solicitation to buy or sell any security or financial product.</li>
        <li>For personalized investment, tax or legal advice, consult a registered investment adviser, fee-only fiduciary planner, CPA, enrolled agent or attorney.</li>
      </ul>
      <h2>Projections are illustrations</h2>
      <p>
        Calculators use the assumptions shown (for example, a constant rate of return or inflation). Real investment returns vary and can be
        negative; past performance does not guarantee future results. Tax figures are simplified federal estimates for the tax year stated and
        exclude many credits, deductions, and state and local taxes. Contribution limits and tax brackets change every year; confirm current
        figures at irs.gov.
      </p>
      <h2>Teens</h2>
      <p>
        Teen profiles (ages 13-17) are available only under an adult&apos;s Family Premium account with parent or guardian consent. Dollarsafe
        does not knowingly collect information from children under 13.
      </p>
      <h2>If you need help now</h2>
      <ul>
        <li>Emotional crisis: call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline). Emergency: call 911.</li>
        <li>Fraud or scams: reportfraud.ftc.gov. Age 60+: National Elder Fraud Hotline 1-833-372-8311.</li>
        <li>Debt help: nonprofit credit counseling through the NFCC (nfcc.org). Local assistance: 211.org.</li>
      </ul>
    </LegalPage>
  );
}
