import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { LIFE_STAGES, ageFromBirthYear, lifeStageForAge } from "@/lib/profile";
import { planFor, usageThisMonth } from "@/lib/advisor/service";
import { Chat } from "@/components/Chat";

export const metadata: Metadata = { title: "Your money coach" };

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/chat");
  const profiles = await db.profile.findMany({ where: { userId: user.id }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] });
  if (!profiles.length) redirect("/onboarding");
  const plan = PLANS[planFor(user)];
  const used = await usageThisMonth(user.id);
  return (
    <Chat
      planName={plan.name}
      used={used}
      limit={plan.monthlyMessages}
      profiles={profiles.map((p) => {
        const stage = LIFE_STAGES[lifeStageForAge(ageFromBirthYear(p.birthYear))];
        return { id: p.id, displayName: p.displayName, stageLabel: stage.label, stageId: stage.id };
      })}
    />
  );
}
