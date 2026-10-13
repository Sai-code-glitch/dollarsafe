import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/chat");
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="mb-1 text-2xl font-bold">Create your free account</h1>
      <p className="mb-6 text-sm text-slate-600">15 free questions every month. Upgrade any time.</p>
      <AuthForm mode="signup" />
    </div>
  );
}
