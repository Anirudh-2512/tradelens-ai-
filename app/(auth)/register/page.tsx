import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { DISCLAIMER } from "@/constants";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Link href="/" className="tl-numerical text-lg tracking-[0.3em]">
            <span className="text-[var(--gold)]">TRADE</span>LENS
          </Link>
          <h1 className="mt-8 text-2xl font-semibold">Enter TradeLens</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create your market intelligence terminal.
          </p>
        </div>
        <div className="tl-card p-6">
          <Suspense fallback={<div className="h-56" />}>
            <AuthForm mode="register" />
          </Suspense>
        </div>
        <p className="mt-8 text-center text-[10px] leading-relaxed text-[var(--muted)]">
          {DISCLAIMER}
        </p>
      </div>
    </main>
  );
}
