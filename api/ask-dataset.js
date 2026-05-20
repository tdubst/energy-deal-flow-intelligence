const MAX_QUESTION_LENGTH = 500;

const json = (response, status, payload) => {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

const trimContext = (context) => ({
  selectedCorridor: context?.selectedCorridor,
  thesis: context?.thesis,
  reportSummary: context?.reportSummary,
  topParcels: (context?.topParcels ?? []).slice(0, 8),
  diligenceQueue: (context?.diligenceQueue ?? []).slice(0, 8),
  risks: context?.risks ?? [],
  sourceMetadata: context?.sourceMetadata,
  topOpportunities: (context?.topOpportunities ?? []).slice(0, 4),
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return json(response, 405, { error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(response, 503, {
      mode: "disabled",
      error: "Ask the Dataset is in demo mode until OPENAI_API_KEY is configured in Vercel.",
    });
  }

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
    const question = String(body.question ?? "").slice(0, MAX_QUESTION_LENGTH).trim();
    const context = trimContext(body.context ?? {});

    if (!question) {
      return json(response, 400, { error: "Question is required." });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        temperature: 0.2,
        max_output_tokens: 650,
        input: [
          {
            role: "system",
            content:
              "You are an AI diligence assistant for Energy Deal Flow Intelligence. Answer only from the provided compact dataset context. Distinguish facts from inference. Do not fabricate values, parcels, owners, or sources. Do not provide investment advice; frame responses as diligence support. If data is missing, say what is missing. Reinforce this workflow when useful: Signal -> Corridor -> Parcel -> Ownership -> Action.",
          },
          {
            role: "user",
            content: JSON.stringify({ question, context }),
          },
        ],
      }),
    });

    const payload = await openaiResponse.json();
    if (!openaiResponse.ok) {
      return json(response, openaiResponse.status, {
        error: payload?.error?.message || "OpenAI request failed.",
      });
    }

    const answer =
      payload.output_text ||
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .map((item) => item.text ?? "")
        .join("\n")
        .trim();

    return json(response, 200, {
      mode: "live",
      answer: answer || "No answer was returned.",
    });
  } catch (error) {
    return json(response, 500, {
      error: error instanceof Error ? error.message : "Ask the Dataset failed.",
    });
  }
}
