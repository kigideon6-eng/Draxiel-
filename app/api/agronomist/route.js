import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  const { messages, state, lga } = await req.json();

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

  const systemPrompt = `You are an agronomist advising a farmer in ${lga}, ${state}, Nigeria.
Give practical, locally relevant advice on crops, planting timing, pests, disease, and soil,
accounting for the typical climate and growing conditions of that state. Keep answers concise
and actionable. If you are not certain about a hyper-local detail, say so rather than guessing.

Here is real, current data from this platform's marketplace, which you should factor into
planting or selling advice when relevant (e.g. warn if a crop already has heavy supply nearby,
which could mean lower prices at harvest):

${supplySummary}

Only mention this data when it's actually relevant to what the farmer is asking. Do not mention
it if the farmer's question is unrelated to planting or selling decisions.`;

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
