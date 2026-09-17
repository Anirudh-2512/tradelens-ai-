import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="tl-numerical text-lg tracking-[0.3em]">
            <span className="text-[var(--gold)]">TRADE</span>LENS
          </Link>
          <h1 className="mt-8 text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to your intelligence terminal.
          </p>
        </div>
        <div className="tl-card p-6">
          <Suspense fallback={<div className="h-40" />}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
