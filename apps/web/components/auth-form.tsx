"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(app)/auth/actions";

type Field = { name: string; label: string; type?: string; autoComplete?: string };

export function AuthForm({
  action,
  fields,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="label">{f.label}</label>
          <input id={f.name} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required className="input" />
        </div>
      ))}
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-brand-700">{state.message}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Please wait…" : submitLabel}</button>
    </form>
  );
}
