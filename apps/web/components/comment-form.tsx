"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/app/auth/actions";

export function CommentForm({ action }: { action: (s: FormState, f: FormData) => Promise<FormState> }) {
  const [state, run, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.message === "posted") ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={run} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <label htmlFor="comment-body" className="sr-only">Write a comment</label>
      <input id="comment-body" name="body" placeholder="Write a comment…" maxLength={1000} className="input" autoComplete="off" />
      <button className="btn-primary" disabled={pending}>Post</button>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
