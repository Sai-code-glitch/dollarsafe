import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { LIFE_STAGES, ageFromBirthYear, lifeStageForAge } from "@/lib/profile";
import { planFor } from "@/lib/advisor/service";
import { ProfileForm } from "@/components/ProfileForm";
import { DeleteProfileButton } from "@/components/DeleteProfileButton";

export const metadata: Metadata = { title: "Profiles" };

export default async function ProfilesPage({ searchParams }: { searchParams: Promise<{ edit?: string; add?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { edit, add } = await searchParams;
  const profiles = await db.profile.findMany({ where: { userId: user.id }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] });
  const plan = PLANS[planFor(user)];
  const editing = profiles.find((p) => p.id === edit);
  const canAdd = profiles.length < plan.maxProfiles;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Profiles</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your plan includes {plan.maxProfiles} profile{plan.maxProfiles > 1 ? "s" : ""}. {plan.maxProfiles === 1 && <Link className="underline" href="/pricing">Family Premium</Link>}
        {plan.maxProfiles === 1 && " adds up to 5 family members, including teens."}
      </p>

      <ul className="mt-6 space-y-3">
        {profiles.map((p) => {
          const age = ageFromBirthYear(p.birthYear);
          return (
            <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold">{p.displayName} {p.isPrimary && <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">Account holder</span>}</p>
                <p className="text-sm text-slate-600">About {age} · {LIFE_STAGES[lifeStageForAge(age)].label} · {p.state}</p>
              </div>
              <div className="flex gap-2">
                <Link className="btn-secondary" href={`/profiles?edit=${p.id}`}>Edit</Link>
                {!p.isPrimary && <DeleteProfileButton id={p.id} />}
              </div>
            </li>
          );
        })}
      </ul>

      {editing && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Edit {editing.displayName}</h2>
          <ProfileForm initial={editing} submitLabel="Save changes" onDone="/profiles" allowMinor={!editing.isPrimary} />
        </section>
      )}

      {!editing && canAdd && profiles.length > 0 && (
        add ? (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Add a family member</h2>
            <ProfileForm initial={{ birthYear: new Date().getFullYear() - 15, incomeBand: "none", employment: "student" }} submitLabel="Add profile" onDone="/profiles" allowMinor />
          </section>
        ) : (
          <Link href="/profiles?add=1" className="btn-primary mt-6">Add a family member</Link>
        )
      )}
    </div>
  );
}
