"use server";

// Storefront auth server actions. They call the SAME src/shop service functions
// the rest of the app reuses (verifyWebCredential / registerWebAccount), set or
// clear the session cookie, then redirect. No parallel auth logic, no raw DB.
import { redirect } from "next/navigation";

import {
  linkWebCredentialToExistingCustomer,
  registerWebAccount,
  verifyWebCredential,
} from "@shop/service.js";

import { clearSession, setSession } from "./session";

export interface AuthFormState {
  error?: string;
}

// useActionState signature: (prevState, formData) => nextState. On success we
// redirect (which throws NEXT_REDIRECT and never returns); on failure we return
// an error to render inline.
export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await verifyWebCredential(username, password);
  if (!result.ok) {
    return { error: result.error ?? "Could not sign you in." };
  }
  await setSession(result.data!.externalUserId);
  redirect("/");
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const displayName = String(formData.get("displayName") ?? "");
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await registerWebAccount(username, password, displayName);
  if (!result.ok) {
    return { error: result.error ?? "Could not create your account." };
  }
  await setSession(result.data!.externalUserId);
  redirect("/");
}

// Set up a web login for an account that already exists (e.g. one registered over
// WhatsApp), gated by the account's verification code. Attaches the credential to
// the EXISTING customer, so the session lands on the same cart/orders.
export async function linkExistingAccount(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const accountCode = String(formData.get("accountCode") ?? "");

  const result = await linkWebCredentialToExistingCustomer(username, password, accountCode);
  if (!result.ok) {
    return { error: result.error ?? "Could not set up your web login." };
  }
  await setSession(result.data!.externalUserId);
  redirect("/");
}

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/");
}
