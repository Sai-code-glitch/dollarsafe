import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 13, 2026">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> email address and a securely hashed password.</li>
        <li><strong>Profile:</strong> what you choose to share, such as first name, birth year, state, household size, income range, work status, goals and notes.</li>
        <li><strong>Conversations:</strong> your questions and Dollarsafe&apos;s answers, including calculator inputs.</li>
        <li><strong>Billing:</strong> handled by Stripe. We store your Stripe customer and subscription IDs and plan status, never your full card number.</li>
        <li><strong>Security logs:</strong> sign-in events, IP address at sign-in, and safety-system events.</li>
      </ul>
      <p>
        We do not ask for, and automatically remove, Social Security numbers, card numbers and labeled account numbers that you type. We do not connect
        to your bank accounts.
      </p>
      <h2>How we use it</h2>
      <p>
        To provide and personalize the Service, generate answers and monthly check-ups, process subscriptions, keep the Service secure, meet legal
        obligations and keep records of the guidance provided. <strong>We do not sell or share your personal information</strong> for cross-context
        behavioral advertising.
      </p>
      <h2>Service providers</h2>
      <ul>
        <li><strong>Anthropic</strong> processes conversation content to generate answers. Under Anthropic&apos;s commercial terms, API data is not used to train their models.</li>
        <li><strong>Stripe</strong> processes payments.</li>
        <li>Our hosting and database providers store data on our behalf.</li>
      </ul>
      <h2>Retention</h2>
      <p>We keep your data while your account is open. When you delete your account, your profiles, conversations and reports are deleted. Minimal security and billing records may be kept as required by law.</p>
      <h2>Your rights</h2>
      <p>
        You can download all of your data and delete your account at any time from the Account page. Depending on your state (for example,
        California, Colorado, Connecticut, Virginia and others), you may have rights to know, access, correct, delete and port your personal
        information, and to opt out of sales and targeted advertising (we do neither). We will not discriminate against you for exercising these rights.
      </p>
      <h2>Children</h2>
      <p>Dollarsafe is not directed to children under 13 and does not knowingly collect their information. Teen profiles (13-17) exist only under a consenting parent or guardian&apos;s account, and the parent or guardian can edit or remove them at any time.</p>
      <h2>Security</h2>
      <p>Data is encrypted in transit. Passwords are hashed with bcrypt, and session tokens are stored only as keyed hashes.</p>
    </LegalPage>
  );
}
