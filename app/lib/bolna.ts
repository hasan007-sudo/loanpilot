function stripWrappingQuotes(value: string) {
  return value.replace(/^"+|"+$/g, "");
}

export async function triggerBolnaDemoCall(args: {
  agentId: string;
  apiKey: string;
  lead: { phone: string; name?: string | null };
  bankName?: string | null;
}) {
  const customerName = args.lead.name?.trim() || "there";
  const firstName = customerName.split(" ")[0] || "there";
  const bankName = args.bankName?.trim() || "Apex Bank";

  const response = await fetch("https://api.bolna.ai/call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: args.agentId,
      recipient_phone_number: args.lead.phone,
      user_data: {
        first_name: firstName,
        customer_name: customerName,
        bank_name: bankName,
      },
    }),
  });

  const rawText = await response.text();
  let parsed: Record<string, unknown> | null = null;

  try {
    parsed = rawText ? JSON.parse(rawText) as Record<string, unknown> : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message =
      typeof parsed?.message === "string"
        ? parsed.message
        : rawText || "Failed to start Bolna demo call";

    return {
      ok: false as const,
      error: message,
    };
  }

  const executionId =
    typeof parsed?.execution_id === "string"
      ? parsed.execution_id
      : null;

  return {
    ok: true as const,
    executionId,
  };
}

export function shouldFallbackToDemoCall(bolnaError: string) {
  const normalized = bolnaError.toLowerCase();

  return normalized.includes("from_number doesn't exist")
    || normalized.includes("from_phone_number")
    || normalized.includes("phone number doesn't exist");
}

export function normalizeBolnaError(raw: string) {
  return stripWrappingQuotes(raw.trim());
}
