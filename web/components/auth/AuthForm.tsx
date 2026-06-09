"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "@/lib/auth/actions";

type AuthAction = (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;

// Shared login/register form. Uses useActionState so a failed action renders its
// error inline; a successful action redirects server-side (never returns here).
export function AuthForm({ mode, action }: { mode: "login" | "register"; action: AuthAction }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, {});
  const isRegister = mode === "register";

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
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
        />
        {isRegister && <p className="font-sans text-xs text-ink-muted">At least 8 characters.</p>}
      </div>

      {state.error && (
        <p role="alert" className="font-sans text-sm text-stock-out-fg">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending
          ? isRegister
            ? "Creating…"
            : "Signing in…"
          : isRegister
            ? "Create account"
            : "Sign in"}
      </Button>

      <p className="text-center font-sans text-sm text-ink-muted">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-gold-deep hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/register" className="text-gold-deep hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
