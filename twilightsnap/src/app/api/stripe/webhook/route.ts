import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { CREDIT_PACKS } from "@/lib/stripe/config";
import type Stripe from "stripe";

async function fulfillCredits(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const packId = session.metadata?.packId;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (!userId || !packId) {
    console.error("[Webhook] Missing metadata on session:", session.id);
    return;
  }

  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  const creditAmount = pack?.credits ?? parseInt(session.metadata?.credits ?? "0", 10);

  if (creditAmount <= 0) {
    console.error("[Webhook] Invalid credit amount for session:", session.id);
    return;
  }

  const admin = createAdminClient();

  // Idempotency check: see if this payment was already processed
  if (paymentIntentId) {
    const { data: existing } = await admin
      .from("transactions")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("[Webhook] Payment already processed:", paymentIntentId);
      return;
    }
  }

  // Get current credits
  const { data: credits } = await admin
    .from("credits")
    .select("balance, lifetime_purchased")
    .eq("user_id", userId)
    .single();

  const typedCredits = credits as { balance: number; lifetime_purchased: number } | null;
  if (!typedCredits) {
    console.error("[Webhook] No credits record for user:", userId);
    return;
  }

  // Update credits
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("credits") as any)
    .update({
      balance: typedCredits.balance + creditAmount,
      lifetime_purchased: typedCredits.lifetime_purchased + creditAmount,
    })
    .eq("user_id", userId);

  // Insert transaction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("transactions") as any).insert({
    user_id: userId,
    type: "purchase",
    amount: creditAmount,
    description: `Purchased ${pack?.name ?? `${creditAmount} Credits`}`,
    stripe_payment_intent_id: paymentIntentId,
  });

  console.log(
    `[Webhook] Fulfilled ${creditAmount} credits for user ${userId}`
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Signature verification failed";
      console.error("[Webhook] Signature verification failed:", message);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else {
    // Local dev: skip signature verification
    console.warn(
      "[Webhook] No STRIPE_WEBHOOK_SECRET set — skipping signature verification"
    );
    event = JSON.parse(body) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillCredits(session);
  }

  return NextResponse.json({ received: true });
}
