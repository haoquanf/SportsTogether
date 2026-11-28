import type Stripe from "stripe";
import { getStripe, isStripeConfigured, syncSubscription } from "@/lib/stripe";

// Stripe calls this address after payments, renewals, failed payments and cancellations.
// The signature check proves the message really came from Stripe.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured || !secret) return Response.json({ error: "Payments are not set up" }, { status: 503 });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const stripe = getStripe();
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          await syncSubscription(await stripe.subscriptions.retrieve(id), session.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await syncSubscription(event.data.object);
        break;
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | { id: string } | null };
        const ref = invoice.parent?.subscription_details?.subscription ?? invoice.subscription ?? null;
        const id = typeof ref === "string" ? ref : ref?.id;
        if (id) await syncSubscription(await stripe.subscriptions.retrieve(id));
        break;
      }
    }
  } catch (e) {
    console.error("Stripe webhook failed", event.type, e);
    // A 500 makes Stripe retry later.
    return Response.json({ error: "Could not process event" }, { status: 500 });
  }
  return Response.json({ received: true });
}
