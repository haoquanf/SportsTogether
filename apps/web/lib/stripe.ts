import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export type Billing = "monthly" | "yearly";

const PRICES: Record<Billing, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};

/** True once the Stripe keys, both prices and the Supabase secret key are set in Vercel. */
export const isStripeConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY &&
    PRICES.monthly &&
    PRICES.yearly &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
);

let client: Stripe | null = null;
export function getStripe() {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  return client;
}

export const priceFor = (billing: Billing) => PRICES[billing]!;

export function billingForPrice(priceId: string | undefined | null): Billing | null {
  if (!priceId) return null;
  if (priceId === PRICES.yearly) return "yearly";
  if (priceId === PRICES.monthly) return "monthly";
  return null;
}

/** Stripe statuses that keep Premium switched on. past_due gives a grace period while Stripe retries the card. */
export const PREMIUM_STATUSES = new Set(["active", "trialing", "past_due"]);

export type SubscriptionRow = {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  billing: Billing | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

/** Turn a Stripe subscription into the row we store (pure, so it can be tested). */
export function subscriptionToRow(sub: Stripe.Subscription, userId: string): SubscriptionRow {
  const item = sub.items?.data?.[0];
  const end = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end ?? null;
  const cancelAt = sub.cancel_at ?? null;
  return {
    user_id: userId,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    status: sub.status,
    billing: billingForPrice(item?.price?.id),
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end || cancelAt),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Save a subscription and switch the member's plan to match. Called by the webhook and
 * after checkout. Returns the member's id, or null if we can't tell whose it is.
 */
export async function syncSubscription(sub: Stripe.Subscription, knownUserId?: string | null) {
  const db = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let userId = knownUserId || sub.metadata?.user_id || null;
  if (!userId) {
    const { data } = await db.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) return null;

  const row = subscriptionToRow(sub, userId);
  // A member keeps one row; a newer subscription replaces an old cancelled one.
  const { data: existing } = await db.from("subscriptions").select("stripe_subscription_id, status").eq("user_id", userId).maybeSingle();
  if (existing?.stripe_subscription_id && existing.stripe_subscription_id !== sub.id &&
      PREMIUM_STATUSES.has(existing.status ?? "") && !PREMIUM_STATUSES.has(sub.status)) {
    return userId; // an old subscription ending must not cancel a newer active one
  }
  const { error } = await db.from("subscriptions").upsert(row, { onConflict: "user_id" });
  if (error) throw new Error(`Saving subscription failed: ${error.message}`);

  const plan = PREMIUM_STATUSES.has(sub.status) ? "premium" : "free";
  const { error: planError } = await db.from("profiles").update({ plan }).eq("id", userId);
  if (planError) throw new Error(`Updating plan failed: ${planError.message}`);
  if (plan === "premium") await db.from("plan_requests").delete().eq("user_id", userId);
  return userId;
}
