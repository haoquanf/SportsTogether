"use client";

import Link from "next/link";
import { useState } from "react";

const FREE = ["Join groups and RSVP to sessions", "All free lessons", "3 AI coach analyses a month", "Score and tips for every clip"];
const PREMIUM = ["Everything in Free", "30 AI coach analyses a month", "Side-by-side compare with the coach", "Full progress history", "All premium lessons"];

export function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <div>
      <div className="mx-auto flex w-fit rounded-full bg-slate-200 p-1 text-sm font-medium">
        {[["Monthly", false], ["Yearly · save 34%", true]].map(([label, value]) => (
          <button key={String(label)} onClick={() => setAnnual(value as boolean)} className={`rounded-full px-4 py-1.5 transition ${annual === value ? "bg-white shadow" : "text-slate-600"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <h3 className="text-lg font-semibold">Free</h3>
          <p className="mt-2"><span className="text-4xl font-bold">$0</span> <span className="text-slate-500">forever</span></p>
          <p className="mt-2 text-slate-600">Everything you need to find games and try the AI coach.</p>
          <Link href="/signup" data-track="Pricing: Start free (Free plan)" className="btn-secondary mt-6 w-full">Start free</Link>
          <ul className="mt-6 space-y-3 text-sm">{FREE.map((f) => <li key={f} className="flex gap-2"><span className="text-brand-600">✓</span>{f}</li>)}</ul>
        </div>
        <div className="relative rounded-3xl bg-ink p-8 text-white">
          <span className="absolute right-6 top-6 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold">Most popular</span>
          <h3 className="text-lg font-semibold">Premium</h3>
          <p className="mt-2">
            <span className="text-4xl font-bold">{annual ? "$6.58" : "$9.99"}</span> <span className="text-slate-400">/ month</span>
          </p>
          <p className="mt-1 text-sm text-slate-400">{annual ? "$79 billed once a year" : "Billed monthly, cancel anytime"}</p>
          <p className="mt-2 text-slate-300">For players serious about improving.</p>
          <Link href="/signup" data-track="Pricing: Premium" className="btn mt-6 w-full bg-brand-500 text-white hover:bg-brand-600">Start free, upgrade anytime</Link>
          <ul className="mt-6 space-y-3 text-sm">{PREMIUM.map((f) => <li key={f} className="flex gap-2"><span className="text-brand-400">✓</span>{f}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
