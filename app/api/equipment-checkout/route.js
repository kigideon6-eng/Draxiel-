export async function POST(request) {
  try {
    const { bookingId, amount, email } = await request.json();

    if (!bookingId || !amount || !email) {
      return Response.json({ error: 'Missing bookingId, amount, or email.' }, { status: 400 });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return Response.json({ error: 'PAYSTACK_SECRET_KEY is not set.' }, { status: 500 });
    }

    const platformFee = amount * 0.03;
    const totalWithFee = amount + platformFee;

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(totalWithFee * 100),
        callback_url: `https://draxiel-pi.vercel.app/equipment-payment-callback?bookingId=${bookingId}`,
        metadata: { bookingId, platformFee },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return Response.json({ error: paystackData.message }, { status: 400 });
    }

    return Response.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
                                         }
