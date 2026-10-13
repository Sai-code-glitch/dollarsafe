import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="October 13, 2026">
      <p>These Terms govern your use of Dollarsafe (the &quot;Service&quot;). By creating an account you agree to them.</p>
      <h2>1. The Service</h2>
      <p>
        Dollarsafe is an automated, AI-powered financial education and general guidance service for people in the United States. It is described
        in our <a href="/legal/disclosures">Disclosures</a>, which are part of these Terms. The Service does not provide individualized investment,
        tax, legal or insurance advice, and you are solely responsible for your financial decisions.
      </p>
      <h2>2. Eligibility and accounts</h2>
      <p>
        Account holders must be at least 18 and reside in the United States. An account holder on Family Premium may add profiles for household
        members, including teens aged 13-17 with the account holder&apos;s consent as parent or legal guardian; the account holder is responsible for
        all activity under the account. Keep your password secure and tell us promptly about any unauthorized use.
      </p>
      <h2>3. Subscriptions and billing</h2>
      <ul>
        <li>Paid plans are billed monthly in advance through our payment processor, Stripe, and renew automatically until canceled.</li>
        <li>You can cancel at any time from your account page. Cancellation takes effect at the end of the current billing period, and you keep access until then. Except where required by law, payments are non-refundable.</li>
        <li>Each plan includes a monthly number of questions. Unused questions do not roll over.</li>
        <li>We may change prices with at least 30 days&apos; notice by email; changes apply from your next billing period.</li>
      </ul>
      <h2>4. Acceptable use</h2>
      <p>
        Don&apos;t use the Service for anything illegal, to seek help with fraud, tax evasion or concealing assets, to attempt to extract or alter the
        Service&apos;s instructions, to overload it, or to resell it. Don&apos;t submit Social Security numbers, account numbers, passwords or card numbers.
        We may suspend accounts that violate these Terms.
      </p>
      <h2>5. AI output</h2>
      <p>
        Answers are generated automatically and may be inaccurate or incomplete. Verify important information independently. The Service is provided
        &quot;as is&quot; without warranties of any kind, to the fullest extent permitted by law.
      </p>
      <h2>6. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Dollarsafe will not be liable for indirect, incidental, special, consequential or punitive damages,
        or for financial losses arising from decisions you make, and our total liability for any claim is limited to the amount you paid us in the
        12 months before the claim.
      </p>
      <h2>7. Termination</h2>
      <p>You can delete your account at any time from your account page. We may terminate access for violations of these Terms.</p>
      <h2>8. Changes</h2>
      <p>We may update these Terms. Material changes will be emailed or shown in the app at least 30 days before they take effect.</p>
      <h2>9. Contact</h2>
      <p>Questions about these Terms: use the contact address listed on our website.</p>
    </LegalPage>
  );
}
