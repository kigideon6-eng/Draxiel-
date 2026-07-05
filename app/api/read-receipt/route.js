export async function POST(req) {
  const { imageBase64, mimeType } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: 'GEMINI_API_KEY is not set.' }, { status: 500 });
  }

  const prompt = `You are reading a photo of a receipt or invoice for a Nigerian farmer's
farm expense. Extract the following as plain JSON only, no other text, no markdown formatting:
{
  "description": "short description of what was bought, e.g. 'Fertilizer' or 'Cutlass'",
  "amount": (a number, the total amount paid in Naira, no currency symbol or commas),
  "category": (one of: "seeds", "fertilizer", "equipment", "labor", "transport", "other")
}
If you cannot read the amount clearly, set amount to 0. If you cannot read anything useful,
set description to "Could not read receipt".`;

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
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: imageBase64 } },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: `Gemini error: ${JSON.stringify(data)}` }, { status: 500 });
    }

    let text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}';
    text = text.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { description: 'Could not read receipt', amount: 0, category: 'other' };
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: `Request failed: ${err.message}` }, { status: 500 });
  }
        }
