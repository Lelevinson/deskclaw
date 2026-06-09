import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { register } from "@/lib/auth/actions";
import { getCurrentCustomerName } from "@/lib/shop";

export default async function RegisterPage() {
  // Resolution-based (see login page): a stale cookie should not bounce.
  if (await getCurrentCustomerName()) redirect("/");

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 py-16">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-2xl tracking-wide text-ink">Create an account</h1>
        <p className="font-serif text-base text-ink-muted">
          Join Amelya&rsquo;s to keep a cart and follow your orders.
        </p>
      </header>
      <AuthForm mode="register" action={register} />
    </section>
  );
}
