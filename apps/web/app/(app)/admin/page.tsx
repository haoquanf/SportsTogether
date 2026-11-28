import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LAUNCH_TZ } from "@/lib/time";

export const metadata = { title: "Stats · ZeniSports", robots: { index: false } };

type Stats = {
  users_total: number;
  users_7d: number;
  users_period: number;
  profiles_completed: number;
  signups_by_day: { day: string; n: number }[];
  clicks_total: number;
  clicks_period: number;
  clicks_by_day: { day: string; n: number }[];
  top_clicks: { name: string; n: number }[];
  top_pages: { path: string; n: number }[];
  upgrade_requests?: number;
  upgrade_requests_yearly?: number;
  downgrade_requests?: number;
  premium_members?: number;
  paying_monthly?: number;
  paying_yearly?: number;
};

const DAYS = 30;

/** Last DAYS calendar days (Boston time), filling days with no activity with 0. */
function fillDays(rows: { day: string; n: number }[]) {
  const map = new Map(rows.map((r) => [r.day, r.n]));
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: LAUNCH_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const now = Date.now();
  return Array.from({ length: DAYS }, (_, i) => {
    const day = fmt.format(new Date(now - (DAYS - 1 - i) * 86_400_000));
    return { day, n: map.get(day) ?? 0 };
  });
}

function Bars({ rows, label }: { rows: { day: string; n: number }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={`${label} per day, last ${DAYS} days`}>
        {rows.map((r) => (
          <div key={r.day} className="group relative flex-1">
            <div className="rounded-t-[3px] bg-brand-500 group-hover:bg-brand-700" style={{ height: `${Math.max(r.n ? 4 : 1, (r.n / max) * 144)}px`, opacity: r.n ? 1 : 0.25 }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">
              {r.day.slice(5)}: {r.n}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{rows[0].day.slice(5)}</span>
        <span>today</span>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="card">
      <p className="text-3xl font-bold tabular-nums">{n.toLocaleString("en-US")}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

function Table({ rows, head }: { rows: [string, number][]; head: string }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No clicks yet.</p>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-left text-slate-500"><th className="pb-2 font-medium">{head}</th><th className="pb-2 text-right font-medium">Clicks</th></tr></thead>
      <tbody>
        {rows.map(([k, n]) => (
          <tr key={k} className="border-t border-slate-100"><td className="max-w-0 truncate py-2 pr-3">{k}</td><td className="py-2 text-right tabular-nums">{n}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdminPage() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats", { days: DAYS });

  if (error) {
    // Not an admin: behave as if the page doesn't exist.
    if (error.code === "42501" || /not allowed/i.test(error.message)) notFound();
    return (
      <div className="card max-w-2xl">
        <h1 className="text-2xl font-bold">Stats aren&apos;t set up yet</h1>
        <p className="mt-2 text-slate-600">Run the database update <code>0007_admin_stats.sql</code> in the Supabase SQL editor, then reload this page.</p>
        <p className="mt-2 text-xs text-slate-400">{error.message}</p>
      </div>
    );
  }

  const s = data as Stats;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Stats</h1>
        <p className="text-slate-600">Only you can see this page. Days are in Boston time.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Members</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat n={s.users_total} label="Registered in total" />
          <Stat n={s.users_7d} label="New in the last 7 days" />
          <Stat n={s.users_period} label={`New in the last ${DAYS} days`} />
          <Stat n={s.profiles_completed} label="Finished their profile" />
        </div>
        <div className="card">
          <h3 className="mb-3 font-medium">Sign-ups per day</h3>
          <Bars rows={fillDays(s.signups_by_day)} label="Sign-ups" />
        </div>
      </section>

      {s.upgrade_requests !== undefined && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Membership</h2>
          {s.premium_members !== undefined && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat n={s.premium_members} label="Premium members now" />
              <Stat n={s.paying_monthly ?? 0} label="Paying monthly ($9.99)" />
              <Stat n={s.paying_yearly ?? 0} label="Paying yearly ($79)" />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat n={s.upgrade_requests} label="Asked to upgrade to Premium" />
            <Stat n={s.upgrade_requests_yearly ?? 0} label="…of them chose yearly" />
            <Stat n={s.downgrade_requests ?? 0} label="Asked to switch to Free" />
          </div>
          <p className="text-sm text-slate-500">To see who asked, open Supabase → Table Editor → plan_requests. Payments, refunds and revenue are in your Stripe dashboard.</p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Clicks</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat n={s.clicks_total} label="Clicks in total" />
          <Stat n={s.clicks_period} label={`Clicks in the last ${DAYS} days`} />
        </div>
        <div className="card">
          <h3 className="mb-3 font-medium">Clicks per day</h3>
          <Bars rows={fillDays(s.clicks_by_day)} label="Clicks" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card"><h3 className="mb-3 font-medium">Most-clicked buttons and links</h3><Table head="Button or link" rows={s.top_clicks.map((r) => [r.name, r.n])} /></div>
          <div className="card"><h3 className="mb-3 font-medium">Pages with the most clicks</h3><Table head="Page" rows={s.top_pages.map((r) => [r.path, r.n])} /></div>
        </div>
      </section>

      <p className="text-sm text-slate-500">
        Visitors and page views (including people who never click anything) are in your Vercel dashboard: open the project and choose <strong>Analytics</strong>.
      </p>
    </div>
  );
}
