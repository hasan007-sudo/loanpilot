import OpenAI from "openai";

// OpenRouter — swap model via OPENROUTER_MODEL env var
// e.g. google/gemini-2.5-flash-preview, openai/gpt-4o, anthropic/claude-sonnet-4-5
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash-preview";

function mockSummary(transcript: string): string {
  const snippet = transcript.trim().replace(/\n/g, " ").slice(0, 140);
  return `Customer expressed interest in a loan product and shared basic financial details. Their profile was assessed against pre-qualification rules. A Relationship Manager will follow up with next steps. [Mock — snippet: ${snippet}]`;
}

export async function generateSummary(transcript: string | null): Promise<string> {
  if (!transcript?.trim()) return "No transcript available for this call.";

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY not set — returning mock summary");
    return mockSummary(transcript);
  }

  try {
    const client = new OpenAI({ apiKey, baseURL: OPENROUTER_BASE_URL });

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content:
            `You are a bank loan officer assistant. Summarize this loan pre-qualification call in 3 sentences:\n` +
            `1) Customer interest and loan type\n` +
            `2) Financial profile (income, employment)\n` +
            `3) Eligibility outcome and next step.\n\nTranscript:\n${transcript}`,
        },
      ],
    });

    return response.choices[0].message.content?.trim() || mockSummary(transcript);
  } catch (err) {
    console.error("OpenRouter summary generation failed:", err);
    return mockSummary(transcript);
  }
}
