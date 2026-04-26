import OpenAI from "openai";
import { config } from "@/lib/config";

function mockSummary(transcript: string): string {
  const snippet = transcript.trim().replace(/\n/g, " ").slice(0, 140);
  return `Customer expressed interest in a loan product and shared basic financial details. Their profile was assessed against pre-qualification rules. A Relationship Manager will follow up with next steps. [Mock — snippet: ${snippet}]`;
}

export async function generateSummary(transcript: string | null): Promise<string> {
  if (!transcript?.trim()) return "No transcript available for this call.";

  if (!config.openrouter.apiKey) {
    console.warn("OPENROUTER_API_KEY not set — returning mock summary");
    return mockSummary(transcript);
  }

  try {
    const client = new OpenAI({ apiKey: config.openrouter.apiKey, baseURL: config.openrouter.baseUrl });

    const response = await client.chat.completions.create({
      model: config.openrouter.model,
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
