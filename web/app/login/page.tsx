import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { login } from "@/lib/auth/actions";
import { getCurrentCustomerName } from "@/lib/shop";

export default async function LoginPage() {
  // Resolution-based: a stale cookie (no such customer) should NOT bounce — show
  // the form so the visitor can re-authenticate.
  if (await getCurrentCustomerName()) redirect("/");

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 py-16">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-2xl tracking-wide text-ink">Sign in</h1>
        <p className="font-serif text-base text-ink-muted">Welcome back to Amelya&rsquo;s.</p>
      </header>
      <AuthForm mode="login" action={login} />
    </section>
  );
}
