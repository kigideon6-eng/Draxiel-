export async function POST(req) {
  const { imageBase64, mimeType } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: 'GEMINI_API_KEY is not set.' }, { status: 500 });
  }

  const prompt = `You are reading a photo or screenshot of a receipt, invoice, or payment
confirmation for a Nigerian farmer's farm expense. Look carefully at all text and numbers
in the image, including screenshots of bank transfers or mobile money payment 
Respond with only this exact JSON shape, nothing else:

{
  "description": "short description of what was bought, sold, or paid for",
  "amount": (a number, the total amount in Naira, no currency symbol, no commas),
  "category": (one of: "seeds", "fertilizer", "equipment", "labor", "transport", "sales", "other"),
  "entry_type": ("credit" if this looks like money received/a sale/income, "debit" if this looks like money spent/a purchase/payment made)
}

If you can see a numeric amount anywhere in the image, use it, even if you are unsure what
it was for (in that case use "Payment" as the description). Only use amount 0 if there is
truly no readable number anywhere in the image.`;

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
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: `Gemini error: ${JSON.stringify(data)}` }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json({ error: `Could not parse AI response: ${text}` }, { status: 500 });
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: `Request failed: ${err.message}` }, { status: 500 });
  }
}
