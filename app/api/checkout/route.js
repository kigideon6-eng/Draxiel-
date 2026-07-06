import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { orderId, amount, email } = await request.json();

    // 1. Calculate the 3% FairHarvest escrow platform fee (0.03)
    const platformFee = amount * 0.03;
    const totalWithFee = amount + platformFee;

    // 2. Call Paystack API to initialize the transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(totalWithFee * 100), // Paystack expects amount in kobo (kobo = NGN * 100)
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fairharvest.vercel.app'}/orders/${orderId}`,
        metadata: { orderId, platformFee },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return NextResponse.json({ error: paystackData.message }, { status: 400 });
    }

    // 3. Update the Supabase order with the payment intent details
    await supabase
      .from('orders')
      .update({
        payment_intent_id: paystackData.data.reference,
        platform_fee_amount: platformFee,
        total_amount_paid: totalWithFee
      })
      .eq('id', orderId);

    // Send back the authorization URL for the user to pay
    return NextResponse.json({ url: paystackData.data.authorization_url });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
