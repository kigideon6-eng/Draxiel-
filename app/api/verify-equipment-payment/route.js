export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');
  const bookingId = searchParams.get('bookingId');

  if (!reference || !bookingId) {
    return Response.json({ error: 'Missing reference or bookingId.' }, { status: 400 });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return Response.json({ error: 'PAYSTACK_SECRET_KEY is not set.' }, { status: 500 });
  }

  try {
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      return Response.json(
        { success: false, message: 'Payment was not successful.' },
        { status: 200 }
      );
    }

    const platformFee = verifyData.data.metadata?.platformFee || 0;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    await supabase
      .from('equipment_bookings')
      .update({
        escrow_status: 'paid',
        platform_fee: platformFee,
        paystack_reference: reference,
      })
      .eq('id', bookingId);

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
    }
