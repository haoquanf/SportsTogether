import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPlanRequest } from "@/lib/plan";
import { MembershipPlans } from "@/components/membership-plans";

export const metadata = { title: "Update membership plan · ZeniSports" };

const NOTICES: Record<string, string> = {
  plan: "Plan change requested.",
  plan_cancelled: "Plan change request cancelled.",
  plan_error: "We couldn't save your plan request. Please try again later.",
};

export default async function MembershipPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const { user, profile } = await requireUser();
  if (!profile?.onboarded) redirect("/onboarding");
  const { updated } = await searchParams;
  const { request, requestedOn } = await getPlanRequest(user.id);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/profile" className="text-sm text-slate-600 hover:text-brand-700">← Back to profile</Link>
      <h1 className="text-3xl font-bold">Update membership plan</h1>
      {updated && NOTICES[updated] && (
        <p role="status" className={`rounded-lg p-3 font-medium ${updated.endsWith("error") ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-700"}`}>
          {updated.endsWith("error") ? "" : "✓ "}{NOTICES[updated]}
        </p>
      )}
      <MembershipPlans plan={profile.plan} request={request} requestedOn={requestedOn} />
    </div>
  );
}
