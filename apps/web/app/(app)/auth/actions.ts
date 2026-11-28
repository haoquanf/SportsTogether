"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type FormState = {
  error?: string;
  message?: string;
  values?: Record<string, string | string[]>;
  /** Optional link shown with an error, e.g. to the password reset page. */
  link?: { href: string; label: string };
  /** Set after sign-up: the address the confirmation email was sent to. */
  sentTo?: string;
};

const NOT_CONFIGURED: FormState = { error: "Sign-in isn't switched on yet in this preview." };

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const values = { name, email };
  if (!name) return { error: "Please enter your name.", values };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address.", values };
  if (password.length < 8) return { error: "Use a password of at least 8 characters.", values };
  if (password !== confirm) return { error: "The two passwords don't match. Please type them again.", values };

  const alreadyRegistered: FormState = {
    error: `${email} is already registered. Would you like to reset your password instead?`,
    link: { href: `/forgot-password?email=${encodeURIComponent(email)}`, label: "Yes, help me get my password back" },
    values,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name }, emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding` },
  });
  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) return alreadyRegistered;
    if (error.code === "over_email_send_rate_limit") return { error: "Too many emails were sent just now. Please wait a minute and try again.", values };
    return { error: error.message, values };
  }
  // With email confirmation on, Supabase answers a sign-up for an existing account with an
  // empty list of identities instead of an error.
  if (data.user && data.user.identities?.length === 0) return alreadyRegistered;
  if (!data.session) return { sentTo: email, message: "We sent a confirmation link to" };
  redirect("/onboarding");
}

export async function resendConfirmation(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding` },
  });
  if (error) {
    return { error: error.code === "over_email_send_rate_limit" ? "Please wait a minute before asking again." : "We couldn't send it just now. Please try again in a minute." };
  }
  return { message: "Sent again. Check your inbox." };
}

export async function logIn(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Please confirm your email first. Check your inbox for the link." };
    return { error: "That email and password don't match." };
  }
  redirect("/home");
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) redirect("/login?error=not-configured");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteUrl()}/auth/callback?next=/home` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(String(formData.get("email") ?? "").trim(), {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  });
  // Same answer whether or not the email exists, so accounts can't be guessed.
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (password !== String(formData.get("confirm") ?? "")) return { error: "The two passwords don't match. Please type them again." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/profile?updated=password");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
