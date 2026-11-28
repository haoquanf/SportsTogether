"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/(app)/auth/actions";

type Field = { name: string; label: string; type?: string; autoComplete?: string; matches?: string };

export function AuthForm({
  action,
  fields,
  submitLabel,
  defaults = {},
  resend,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
  defaults?: Record<string, string>;
  /** Shown after sign-up so people can ask for the confirmation email again. */
  resend?: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  // What has been typed since the last submit (the form clears password fields after each submit).
  const [typedFor, setTypedFor] = useState<{ state: FormState; values: Record<string, string> }>({ state, values: {} });
  const typed = typedFor.state === state ? typedFor.values : {};
  const setTyped = (update: (t: Record<string, string>) => Record<string, string>) => setTypedFor({ state, values: update(typed) });
  const mismatch = fields.some((f) => f.matches && typed[f.name] && typed[f.matches] !== undefined && typed[f.name] !== typed[f.matches]);

  if (state.sentTo) {
    return <CheckInbox email={state.sentTo} message={state.message} resend={resend} />;
  }

  return (
    <form action={formAction} className="space-y-4" noValidate={false}>
      {fields.map((f) => {
        const isMismatch = f.matches && typed[f.name] && typed[f.name] !== typed[f.matches];
        const isMatch = f.matches && typed[f.name] && typed[f.name] === typed[f.matches];
        const value = state.values?.[f.name];
        return (
          <div key={f.name}>
            <label htmlFor={f.name} className="label">{f.label}</label>
            <input
              id={f.name}
              name={f.name}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              required
              minLength={f.type === "password" ? 8 : undefined}
              defaultValue={f.type === "password" ? undefined : (typeof value === "string" ? value : defaults[f.name])}
              onChange={(e) => setTyped((t) => ({ ...t, [f.name]: e.target.value }))}
              aria-invalid={isMismatch ? true : undefined}
              aria-describedby={f.matches ? `${f.name}-hint` : undefined}
              className={`input ${isMismatch ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`}
            />
            {f.matches && (
              <p id={`${f.name}-hint`} className={`mt-1 text-xs ${isMismatch ? "text-red-600" : "text-brand-700"}`} aria-live="polite">
                {isMismatch ? "The passwords don't match yet." : isMatch ? "✓ Passwords match" : ""}
              </p>
            )}
          </div>
        );
      })}
      {state.error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <p>{state.error}</p>
          {state.link && (
            <Link href={state.link.href} className="mt-2 inline-block font-semibold text-red-800 underline hover:no-underline">{state.link.label} →</Link>
          )}
        </div>
      )}
      {state.message && <p role="status" className="text-sm text-brand-700">{state.message}</p>}
      <button className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50" disabled={pending || mismatch}>{pending ? "Please wait…" : submitLabel}</button>
    </form>
  );
}

function CheckInbox({ email, message, resend }: { email: string; message?: string; resend?: (s: FormState, f: FormData) => Promise<FormState> }) {
  return (
    <div className="space-y-4 text-center" role="status">
      <p className="text-5xl" aria-hidden>📬</p>
      <h2 className="text-xl font-semibold">Check your email</h2>
      <p className="text-slate-600">
        {message ?? "We sent a confirmation link to"} <strong className="break-all text-ink">{email}</strong>. Click the link in that email to finish creating your account.
      </p>
      <p className="text-sm text-slate-500">It can take a minute. If you can&apos;t find it, check your spam or promotions folder.</p>
      {resend && <ResendForm email={email} resend={resend} />}
    </div>
  );
}

function ResendForm({ email, resend }: { email: string; resend: (s: FormState, f: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(resend, {});
  return (
    <form action={formAction}>
      <input type="hidden" name="email" value={email} />
      <button className="text-sm font-medium text-brand-700 hover:underline disabled:opacity-50" disabled={pending}>
        {pending ? "Sending…" : "Send the email again"}
      </button>
      {state.message && <p className="mt-1 text-sm text-brand-700">{state.message}</p>}
      {state.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
