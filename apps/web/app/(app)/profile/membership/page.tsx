import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPlanRequest } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured, syncSubscription } from "@/lib/stripe";
import { LAUNCH_TZ } from "@/lib/time";
import { MembershipPlans, type SubscriptionInfo } from "@/components/membership-plans";

export const metadata = { title: "Update membership plan · ZeniSports" };

const NOTICES: Record<string, string> = {
  plan: "Plan change requested.",
  plan_cancelled: "Plan change request cancelled.",
  plan_error: "We couldn't save your plan request. Please try again later.",
  upgraded: "Payment received. Welcome to Premium! 🎉",
  activating: "Payment received. Your Premium plan will switch on in a few seconds; refresh this page if it hasn't.",
  cancelled_checkout: "Checkout cancelled. You haven't been charged.",
  payment_error: "We couldn't reach the payment system. Please try again in a minute.",
  payments_off: "Card payments aren't switched on yet.",
};

export default async function MembershipPage({ searchParams }: { searchParams: Promise<{ updated?: string; checkout?: string; session_id?: string }> }) {
  const { user, profile } = await requireUser();
  if (!profile?.onboarded) redirect("/onboarding");
  const { updated, checkout, session_id } = await searchParams;

  // Back from Stripe checkout: confirm the payment straight away instead of waiting for the webhook.
  if (checkout === "success" && session_id && isStripeConfigured) {
    let ok = false;
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id, { expand: ["subscription"] });
      if (session.client_reference_id === user.id && session.subscription && typeof session.subscription !== "string") {
        await syncSubscription(session.subscription, user.id);
        ok = true;
      }
    } catch (e) {
      console.error("Confirming checkout failed", e);
    }
    redirect(`/profile/membership?updated=${ok ? "upgraded" : "activating"}`);
  }
  if (checkout === "cancelled") redirect("/profile/membership?updated=cancelled_checkout");

  const notice = updated ? NOTICES[updated] : null;
  const isError = updated?.endsWith("error") || updated === "payments_off";

  const { request, requestedOn } = await getPlanRequest(user.id);
  let subscription: SubscriptionInfo = null;
  if (isStripeConfigured) {
    const { data } = await (await createClient())
      .from("subscriptions")
      .select("status, billing, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.status) {
      subscription = {
        status: data.status,
        billing: data.billing,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        periodEnd: data.current_period_end
          ? new Date(data.current_period_end).toLocaleDateString("en-US", { dateStyle: "long", timeZone: LAUNCH_TZ })
          : null,
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/profile" className="text-sm text-slate-600 hover:text-brand-700">← Back to profile</Link>
      <h1 className="text-3xl font-bold">Update membership plan</h1>
      {notice && (
        <p role="status" className={`rounded-lg p-3 font-medium ${isError ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-700"}`}>
          {isError ? "" : "✓ "}{notice}
        </p>
      )}
      <MembershipPlans plan={profile.plan} request={request} requestedOn={requestedOn} payments={isStripeConfigured} subscription={subscription} />
      {isStripeConfigured && (
        <p className="text-center text-xs text-slate-500">
          🔒 Payments are handled securely by Stripe. ZeniSports never sees or stores your card number. Cancel anytime from Manage billing.
        </p>
      )}
    </div>
  );
}
