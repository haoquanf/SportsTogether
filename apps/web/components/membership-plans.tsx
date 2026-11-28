"use client";

import { useState } from "react";
import { FREE_ANALYSES_PER_MONTH, PREMIUM_ANALYSES_PER_MONTH } from "@sportsapp/shared";
import { cancelPlanRequest, requestPlan } from "@/app/(app)/profile/actions";

export type PlanRequest = { plan: "free" | "premium"; billing: "monthly" | "yearly" | null; created_at: string } | null;

const FREE = ["Groups, sessions and free lessons", `${FREE_ANALYSES_PER_MONTH} AI coach analyses a month`, "Score and tips for every clip"];
const PREMIUM = ["Everything in Free", `${PREMIUM_ANALYSES_PER_MONTH} AI coach analyses a month`, "Side-by-side compare with the coach", "Full progress history", "All premium lessons"];

export function MembershipPlans({ plan, request, requestedOn }: { plan: string; request: PlanRequest; requestedOn: string | null }) {
  const [yearly, setYearly] = useState(request?.billing !== "monthly");
  const premium = plan === "premium";

  return (
    <section className="card" id="membership">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Choose your plan</h2>
          <p className="text-sm text-slate-600">You&apos;re on the <strong>{premium ? "Premium" : "Free"}</strong> plan.</p>
        </div>
        <div className="flex rounded-full bg-slate-100 p-1 text-sm font-medium" role="group" aria-label="Billing">
          {([["Monthly", false], ["Yearly · save 34%", true]] as const).map(([l, v]) => (
            <button key={l} type="button" aria-pressed={yearly === v} onClick={() => setYearly(v)} className={`rounded-full px-3 py-1 transition ${yearly === v ? "bg-white shadow" : "text-slate-600"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {request && (
        <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p>
            {request.plan === "premium"
              ? <>You asked to upgrade to <strong>Premium ({request.billing ?? "monthly"})</strong> on {requestedOn}. Card payments open soon, and we&apos;ll email you to finish the upgrade.</>
              : <>You asked to switch to the <strong>Free</strong> plan on {requestedOn}. We&apos;ll make the change and confirm by email.</>}
          </p>
          <form action={cancelPlanRequest}>
            <button className="font-medium text-amber-900 underline hover:no-underline">Cancel request</button>
          </form>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className={`rounded-2xl border p-5 ${!premium ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-200"}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Free</h3>
            {!premium && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Current plan</span>}
          </div>
          <p className="mt-1"><span className="text-2xl font-bold">$0</span> <span className="text-sm text-slate-500">forever</span></p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-700">{FREE.map((f) => <li key={f}>✓ {f}</li>)}</ul>
          {premium && request?.plan !== "free" && (
            <form action={requestPlan} className="mt-4">
              <input type="hidden" name="plan" value="free" />
              <button className="btn-secondary w-full" data-track="Membership: Switch to Free">Switch to Free</button>
            </form>
          )}
        </div>

        <div className={`rounded-2xl p-5 ${premium ? "bg-ink text-white ring-2 ring-amber-400" : "bg-ink text-white"}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Premium</h3>
            {premium
              ? <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-ink">Current plan</span>
              : <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold">Most popular</span>}
          </div>
          <p className="mt-1">
            <span className="text-2xl font-bold">{yearly ? "$6.58" : "$9.99"}</span> <span className="text-sm text-slate-400">/ month</span>
          </p>
          <p className="text-xs text-slate-400">{yearly ? "$79 billed once a year" : "Billed monthly, cancel anytime"}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-200">{PREMIUM.map((f) => <li key={f}><span className="text-brand-400">✓</span> {f}</li>)}</ul>
          {!premium && request?.plan !== "premium" && (
            <form action={requestPlan} className="mt-4">
              <input type="hidden" name="plan" value="premium" />
              <input type="hidden" name="billing" value={yearly ? "yearly" : "monthly"} />
              <button className="btn w-full bg-brand-500 text-white hover:bg-brand-600" data-track={`Membership: Upgrade to Premium (${yearly ? "yearly" : "monthly"})`}>
                Upgrade to Premium
              </button>
            </form>
          )}
          {!premium && request?.plan === "premium" && request.billing !== (yearly ? "yearly" : "monthly") && (
            <form action={requestPlan} className="mt-4">
              <input type="hidden" name="plan" value="premium" />
              <input type="hidden" name="billing" value={yearly ? "yearly" : "monthly"} />
              <button className="btn w-full border border-white/30 text-white hover:bg-white/10">Change request to {yearly ? "yearly" : "monthly"}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
