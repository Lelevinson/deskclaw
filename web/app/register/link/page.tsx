import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { linkExistingAccount } from "@/lib/auth/actions";
import { getCurrentCustomerName } from "@/lib/shop";

export default async function LinkAccountPage() {
  // Resolution-based (see login/register): a stale cookie should not bounce.
  if (await getCurrentCustomerName()) redirect("/");

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 py-16">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-2xl tracking-wide text-ink">Set up web login</h1>
        <p className="font-serif text-base text-ink-muted">
          Already registered with us in chat? Add a username and password to your existing account using
          your account code, and you&rsquo;ll keep the same cart and orders.
        </p>
      </header>
      <AuthForm mode="link" action={linkExistingAccount} />
    </section>
  );
}
