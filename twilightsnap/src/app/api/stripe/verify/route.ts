import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { CREDIT_PACKS } from "@/lib/stripe/config";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session.status !== "complete" ||
      session.payment_status !== "paid"
    ) {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Verify this session belongs to the requesting user
    if (session.client_reference_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const admin = createAdminClient();

    // Check if already fulfilled
    if (paymentIntentId) {
      const { data: existing } = await admin
        .from("transactions")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .limit(1);

      if (!existing || existing.length === 0) {
        // Webhook hasn't processed yet — fulfill now
        const packId = session.metadata?.packId;
        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        const creditAmount =
          pack?.credits ??
          parseInt(session.metadata?.credits ?? "0", 10);

        if (creditAmount > 0) {
          const { data: credits } = await admin
            .from("credits")
            .select("balance, lifetime_purchased")
            .eq("user_id", user.id)
            .single();

          const typedCredits = credits as { balance: number; lifetime_purchased: number } | null;
          if (typedCredits) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (admin.from("credits") as any)
              .update({
                balance: typedCredits.balance + creditAmount,
                lifetime_purchased:
                  typedCredits.lifetime_purchased + creditAmount,
              })
              .eq("user_id", user.id);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (admin.from("transactions") as any).insert({
              user_id: user.id,
              type: "purchase",
              amount: creditAmount,
              description: `Purchased ${pack?.name ?? `${creditAmount} Credits`}`,
              stripe_payment_intent_id: paymentIntentId,
            });
          }
        }
      }
    }

    // Return updated balance
    const { data: updatedCredits } = await admin
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      credits: (updatedCredits as { balance: number } | null)?.balance ?? 0,
    });
  } catch (error: unknown) {
    console.error("[Stripe Verify] Error:", error);
    const message =
      error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
