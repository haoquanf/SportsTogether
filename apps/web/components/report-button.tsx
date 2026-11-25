"use client";

import { useState, useTransition } from "react";

export function ReportButton({ action }: { action: () => Promise<void> }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <span className="text-brand-700">Reported. Thanks, an admin will review it.</span>;
  return (
    <button className="hover:text-red-600" disabled={pending} onClick={() => start(async () => { await action(); setDone(true); })}>
      Report
    </button>
  );
}
