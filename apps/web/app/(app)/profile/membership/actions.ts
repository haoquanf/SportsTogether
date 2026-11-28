"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured, PREMIUM_STATUSES, priceFor, type Billing } from "@/lib/stripe";

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Find the member's Stripe customer, creating one the first time. */
async function customerFor(userId: string, email: string | undefined) {
  const db = createAdminClient();
  const { data } = await db.from("subscriptions").select("stripe_customer_id, status").eq("user_id", userId).maybeSingle();
  if (data?.stripe_customer_id) return { customerId: data.stripe_customer_id as string, status: data.status as string | null };
  const customer = await getStripe().customers.create({ email, metadata: { user_id: userId } });
  const { error } = await db.from("subscriptions").insert({ user_id: userId, stripe_customer_id: customer.id });
  if (error) throw new Error(`Saving customer failed: ${error.message}`);
  return { customerId: customer.id, status: null };
}

/** Upgrade: send the member to Stripe's secure checkout page. */
export async function startCheckout(formData: FormData) {
  const { user } = await requireUser();
  if (!isStripeConfigured) redirect("/profile/membership?updated=payments_off");
  const billing: Billing = formData.get("billing") === "monthly" ? "monthly" : "yearly";
  const origin = await siteOrigin();
  let url: string | null = null;
  try {
    const { customerId, status } = await customerFor(user.id, user.email);
    if (status && PREMIUM_STATUSES.has(status)) {
      // Already paying: changes happen in the billing portal instead.
      const portal = await getStripe().billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/profile/membership` });
      url = portal.url;
    } else {
      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: priceFor(billing), quantity: 1 }],
        subscription_data: { metadata: { user_id: user.id } },
        allow_promotion_codes: true,
        success_url: `${origin}/profile/membership?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/profile/membership?checkout=cancelled`,
      });
      url = session.url;
    }
  } catch (e) {
    console.error("startCheckout failed", e);
  }
  redirect(url ?? "/profile/membership?updated=payment_error");
}

/** Manage billing: card details, monthly/yearly, invoices and cancelling, on Stripe's own page. */
export async function openBillingPortal() {
  const { user } = await requireUser();
  if (!isStripeConfigured) redirect("/profile/membership?updated=payments_off");
  const origin = await siteOrigin();
  let url: string | null = null;
  try {
    const { data } = await createAdminClient().from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (data?.stripe_customer_id) {
      const portal = await getStripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${origin}/profile/membership` });
      url = portal.url;
    }
  } catch (e) {
    console.error("openBillingPortal failed", e);
  }
  redirect(url ?? "/profile/membership?updated=payment_error");
}
