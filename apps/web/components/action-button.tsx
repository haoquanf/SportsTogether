"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(app)/auth/actions";

/** A one-click button that runs a server action and shows its message. */
export function ActionButton({
  action,
  label,
  pendingLabel = "Please wait…",
  className = "btn-primary",
}: {
  action: () => Promise<FormState | void>;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [state, run, pending] = useActionState(async () => (await action()) ?? {}, {} as FormState);
  return (
    <form action={run} className="inline-flex flex-col gap-1">
      <button className={className} disabled={pending}>{pending ? pendingLabel : label}</button>
      {state.error && <span role="alert" className="text-sm text-red-600">{state.error}</span>}
      {state.message && <span role="status" className="text-sm text-brand-700">{state.message}</span>}
    </form>
  );
}
