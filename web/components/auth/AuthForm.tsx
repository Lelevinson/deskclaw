"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/lib/auth/actions";

type AuthAction = (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
type AuthMode = "login" | "register" | "link";

// Shared login / register / link form. Uses useActionState so a failed action
// renders its error inline; a successful action redirects server-side (never
// returns here). The "link" mode sets up a web login for an account that already
// exists (e.g. registered over WhatsApp), gated by its verification code.
export function AuthForm({ mode, action }: { mode: AuthMode; action: AuthAction }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, {});
  const isRegister = mode === "register";
  const isLink = mode === "link";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {isRegister && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">Your name</Label>
          <Input id="displayName" name="displayName" autoComplete="name" required />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required />
        {isLink && (
          <p className="font-sans text-xs text-ink-muted">Choose a username for signing in on the web.</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister || isLink ? "new-password" : "current-password"}
          required
        />
        {(isRegister || isLink) && (
          <p className="font-sans text-xs text-ink-muted">At least 8 characters.</p>
        )}
      </div>
      {isLink && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="accountCode">Account code</Label>
          <Input id="accountCode" name="accountCode" autoComplete="off" required />
          <p className="font-sans text-xs text-ink-muted">
            The code from when you registered with us in chat (for example over WhatsApp).
          </p>
        </div>
      )}

      {state.error && (
        <p role="alert" className="font-sans text-sm text-stock-out-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending
          ? isRegister
            ? "Creating…"
            : isLink
              ? "Setting up…"
              : "Signing in…"
          : isRegister
            ? "Create account"
            : isLink
              ? "Set up web login"
              : "Sign in"}
      </Button>

      <div className="flex flex-col gap-1 text-center font-sans text-sm text-ink-muted">
        {isLink ? (
          <>
            <span>
              Want a fresh account?{" "}
              <Link href="/register" className="text-gold-deep hover:underline">
                Create one
              </Link>
            </span>
            <span>
              Already set up?{" "}
              <Link href="/login" className="text-gold-deep hover:underline">
                Sign in
              </Link>
            </span>
          </>
        ) : isRegister ? (
          <>
            <span>
              Already have an account?{" "}
              <Link href="/login" className="text-gold-deep hover:underline">
                Sign in
              </Link>
            </span>
            <span>
              Registered with us in chat?{" "}
              <Link href="/register/link" className="text-gold-deep hover:underline">
                Set up web login
              </Link>
            </span>
          </>
        ) : (
          <>
            <span>
              New here?{" "}
              <Link href="/register" className="text-gold-deep hover:underline">
                Create an account
              </Link>
            </span>
            <span>
              Registered with us in chat?{" "}
              <Link href="/register/link" className="text-gold-deep hover:underline">
                Set up web login
              </Link>
            </span>
          </>
        )}
      </div>
    </form>
  );
}
