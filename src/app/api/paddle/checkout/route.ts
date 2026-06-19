import { NextResponse } from "next/server";

interface PaddleCheckoutRequest {
  plan: "monthly" | "yearly";
  userId?: string;
}

const PADDLE_PRODUCTS = {
  monthly: { priceId: "pri_monthly_quitporn", amount: 4.99 },
  yearly: { priceId: "pri_yearly_quitporn", amount: 39.99 },
} as const;

export async function POST(request: Request) {
  try {
    const body: PaddleCheckoutRequest = await request.json();

    if (!body.plan || !PADDLE_PRODUCTS[body.plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Use 'monthly' or 'yearly'." },
        { status: 400 }
      );
    }

    const { priceId } = PADDLE_PRODUCTS[body.plan];

    const paddleToken = process.env.PADDLE_CLIENT_SIDE_TOKEN;
    if (!paddleToken) {
      return NextResponse.json(
        { error: "Paddle not configured" },
        { status: 501 }
      );
    }

    const checkoutUrl = `https://checkout.paddle.com/api/1.0/checkout?product_id=${priceId}&passthrough=${encodeURIComponent(JSON.stringify({ userId: body.userId }))}`;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      plan: body.plan,
      amount: PADDLE_PRODUCTS[body.plan].amount,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
