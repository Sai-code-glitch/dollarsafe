import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/chat");
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="mb-6 text-2xl font-bold">Welcome back</h1>
      <AuthForm mode="login" next={next} />
    </div>
  );
}
