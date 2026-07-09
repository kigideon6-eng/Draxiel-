import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  const { messages, state, lga, role } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: 'GEMINI_API_KEY is not set on the server. See the README.' },
      { status: 500 }
    );
  }

  let supplySummary = 'No current listing data available.';
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: listings } = await supabase
      .from('market_listings')
      .select('item_name, quantity_available')
      .eq('state', state)
      .eq('status', 'active');

    if (listings && listings.length > 0) {
      const totals = {};
      for (const l of listings) {
        const key = l.item_name.trim().toLowerCase();
        totals[key] = (totals[key] || 0) + Number(l.quantity_available || 0);
      }
      const lines = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([item, qty]) => `- ${item}: ${qty} units currently listed for sale`);
      supplySummary = `Current active listings on this platform in ${state} state:\n${lines.join('\n')}`;
    } else {
      supplySummary = `There are currently no active listings on this platform in ${state} state.`;
    }
  } catch (err) {
    supplySummary = 'Current listing data could not be loaded.';
  }

  const appGuide = `
FAIRHARVEST APP GUIDE (use this to answer "how do I..." or "where is..." questions):

For farmers (sidebar tabs):
- "Listings": create and manage produce listings for sale on the marketplace
- "My farms": add/manage farm profiles
- "Farm records": log expenses and sales, including scanning a receipt photo to auto-fill an entry
- "Orders": view and manage orders from buyers, confirm delivery to release escrow payment
- "Contacts & messages": search a contact by phone number, message them directly
- "Equipment": browse equipment for hire nearby, list your own equipment for other farmers to rent, message the owner before booking, pay a 3% platform fee on top of the rental price, and view "My bookings" for rentals you've made
- "Help & advisor" (this chat): ask app questions or get planting/market advice

For buyers (sidebar tabs):
- Browse the marketplace to find and buy produce from farmers
- "Orders": track purchases, payment goes into escrow until the farmer confirms delivery
- "Contacts & messages": message farmers directly
- "Help & advisor" (this chat): ask app questions

Payments: FairHarvest uses Paystack. A 1% platform fee applies to regular produce orders, and a 3%
platform fee applies to equipment bookings. Payments are held in escrow until delivery/booking is
confirmed.
`;

  const systemPrompt = `You are the in-app assistant for FairHarvest, a Nigerian farmer-buyer
marketplace. The person asking is a ${role || 'user'} based in ${lga}, ${state}, Nigeria.

You have two jobs:
1. Answer questions about how to use the FairHarvest app — where to find a feature, how a flow
   works (like booking equipment, confirming delivery, or scanning a receipt). Use the app guide
   below for this.
2. If asked about farming — planting timing, pests, disease, soil, or whether it's a good time
   to sell or plant a particular crop — give practical, locally relevant advice for that state's
   climate, and factor in the real current marketplace data below (e.g. warn if a crop already
   has heavy supply nearby, which could mean lower prices at harvest).

Keep answers concise and actionable. Only bring up the marketplace supply data if the question is
actually about planting or selling decisions — don't mention it for app-navigation questions.

${appGuide}

Current real marketplace data for ${state} state:
${supplySummary}`;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: `Gemini error: ${JSON.stringify(data)}` }, { status: 500 });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') ||
      'Sorry, I could not generate a response.';

    return Response.json({ reply });
  } catch (err) {
    return Response.json({ error: `Request failed: ${err.message}` }, { status: 500 });
  }
  }
