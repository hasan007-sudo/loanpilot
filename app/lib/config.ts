export const config = {
  databaseUrl: process.env.DATABASE_URL,
  bolna: {
    apiKey: process.env.BOLNA_API_KEY,
    agentId: process.env.BOLNA_AGENT_ID,
    fromNumber: process.env.BOLNA_FROM_NUMBER?.trim() || undefined,
    apiBase: "https://api.bolna.ai",
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash-preview",
    baseUrl: "https://openrouter.ai/api/v1",
  },
};
