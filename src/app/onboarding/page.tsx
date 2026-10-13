import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";

export const metadata: Metadata = { title: "Tell us about you" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (await db.profile.count({ where: { userId: user.id } })) redirect("/chat");
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">Tell Dollarsafe a little about you</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">
        This takes a minute and makes every answer fit your life stage. Share only what you&apos;re comfortable with; you can change it any time.
      </p>
      <ProfileForm submitLabel="Start coaching" onDone="/chat" allowMinor={false} />
    </div>
  );
}
