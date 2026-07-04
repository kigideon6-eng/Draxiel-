import Anthropic from '@anthropic-ai/sdk';

export async function POST(req) {
  const { messages, state, lga } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not set on the server. See the README.' },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are an agronomist advising a farmer in ${lga}, ${state}, Nigeria.
Give practical, locally relevant advice on crops, planting timing, pests, disease, and soil,
accounting for the typical climate and growing conditions of that state. Keep answers concise
and actionable. If you are not certain about a hyper-local detail, say so rather than guessing.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    return Response.json({ reply });
  } catch (err) {
    return Response.json({ error: 'The AI agronomist could not respond right now.' }, { status: 500 });
  }
}
