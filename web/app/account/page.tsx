import { requireIdentity } from "@/lib/auth/session";
import { getAccountProfile } from "@/lib/shop";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// Account (surface: /account, DESIGN §5.8). The logged-in customer's own profile:
// name, login username, and their accountCode (the code they read off to link this
// same account on another channel — e.g. WhatsApp via the assistant). Identity-gated
// (requireIdentity) and own-only; Sign out lives here now that the header no longer
// carries the "Shopping as" bar.
export default async function AccountPage() {
  await requireIdentity();
  const profile = await getAccountProfile();

  // requireIdentity guarantees a session; if the profile can't resolve, fail soft.
  if (!profile) {
    return (
      <section className="mx-auto w-full max-w-md py-16">
        <p className="font-serif text-base text-ink-muted">
          We couldn&rsquo;t load your account just now. Please try again.
        </p>
      </section>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: "Name", value: profile.displayName },
    { label: "Username", value: `@${profile.username}` },
  ];

  return (
    <section className="mx-auto w-full max-w-md py-12">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-2xl tracking-wide text-ink">Account</h1>
        <p className="font-serif text-base text-ink-muted">
          Your cart, orders &amp; returns are private to you.
        </p>
      </header>

      <div className="rounded-md border border-line bg-panel p-7">
        <dl className="flex flex-col gap-5">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <dt className="font-sans text-xs uppercase tracking-wide text-ink-muted">
                {row.label}
              </dt>
              <dd className="font-serif text-lg text-ink">{row.value}</dd>
            </div>
          ))}

          {profile.accountCode && (
            <div className="flex flex-col gap-1.5 border-t border-line pt-5">
              <dt className="font-sans text-xs uppercase tracking-wide text-ink-muted">
                Account code
              </dt>
              <dd>
                <span className="inline-block rounded-pill border border-gold/40 bg-gold/10 px-3 py-1 font-sans text-sm font-medium tracking-wider text-gold-deep">
                  {profile.accountCode}
                </span>
              </dd>
              <p className="mt-1 font-sans text-xs leading-relaxed text-ink-muted">
                Share this code with the Amelya&rsquo;s assistant on WhatsApp to link
                this account to that number, so chat and the storefront see the same
                cart, orders &amp; returns.
              </p>
            </div>
          )}
        </dl>
      </div>

      <form action={logout} className="mt-6">
        <Button type="submit" variant="outline" className="w-full">
          Sign out
        </Button>
      </form>
    </section>
  );
}
