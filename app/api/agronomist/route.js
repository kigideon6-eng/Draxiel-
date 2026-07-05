export async function POST(req) {
  const { messages, state, lga } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: 'GEMINI_API_KEY is not set on the server. See the README.' },
      { status: 500 }
    );
  }

  const systemPrompt = `You are an agronomist advising a farmer in ${lga}, ${state}, Nigeria.
Give practical, locally relevant advice on crops, planting timing, pests, disease, and soil,
accounting for the typical climate and growing conditions of that state. Keep answers concise
and actionable. If you are not certain about a hyper-local detail, say so rather than guessing.`;

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

    const reply =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') ||
      'Sorry, I could not generate a response.';

    return Response.json({ reply });
  } catch (err) {
    return Response.json({ error: 'The AI agronomist could not respond right now.' }, { status: 500 });
  }
      }
