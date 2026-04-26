import { config } from "@/lib/config";

type Contact = { phone: string; name?: string | null };

type DemoResult =
  | { ok: true; executionId: string | null }
  | { ok: false; error: string };

type BatchResult =
  | { ok: true; batchId: string | null; demoCallId: string | null; message: string }
  | { ok: false; error: string };

function namesFor(contact: Contact, bankName?: string | null) {
  const customerName = contact.name?.trim() || "there";
  const firstName = customerName.split(" ")[0] || "there";
  return {
    customerName,
    firstName,
    bankName: bankName?.trim() || "Apex Bank",
  };
}

function normalizeBolnaError(raw: string) {
  return raw.trim().replace(/^"+|"+$/g, "");
}

function shouldFallbackToDemoCall(bolnaError: string) {
  const normalized = bolnaError.toLowerCase();
  return (
    normalized.includes("from_number doesn't exist") ||
    normalized.includes("from_phone_number") ||
    normalized.includes("phone number doesn't exist")
  );
}

async function triggerBolnaDemoCall(args: {
  agentId: string;
  apiKey: string;
  contact: Contact;
  bankName?: string | null;
}): Promise<DemoResult> {
  const { customerName, firstName, bankName } = namesFor(args.contact, args.bankName);

  const response = await fetch(`${config.bolna.apiBase}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: args.agentId,
      recipient_phone_number: args.contact.phone,
      user_data: { first_name: firstName, customer_name: customerName, bank_name: bankName },
    }),
  });

  const rawText = await response.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message =
      typeof parsed?.message === "string" ? parsed.message : rawText || "Failed to start Bolna demo call";
    return { ok: false, error: message };
  }

  const executionId = typeof parsed?.execution_id === "string" ? parsed.execution_id : null;
  return { ok: true, executionId };
}

function demoMessage(contact: Contact, executionId: string | null) {
  return `Demo mode active. First lead call queued successfully for ${contact.phone}${executionId ? ` (${executionId})` : ""}.`;
}

async function postBolnaBatch(args: {
  apiKey: string;
  agentId: string;
  fromNumber: string;
  contacts: Contact[];
  bankName?: string | null;
}) {
  const csvRows = ["contact_number,first_name,customer_name,bank_name"];
  for (const c of args.contacts) {
    const { firstName, customerName, bankName } = namesFor(c, args.bankName);
    csvRows.push(`${c.phone},${firstName},${customerName},${bankName}`);
  }

  const formData = new FormData();
  formData.append("agent_id", args.agentId);
  formData.append("file", new Blob([csvRows.join("\n")], { type: "text/csv" }), "contacts.csv");
  formData.append("from_phone_numbers", JSON.stringify([args.fromNumber]));

  return fetch(`${config.bolna.apiBase}/batches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.apiKey}` },
    body: formData,
  });
}

export async function triggerBolnaCalls(args: {
  apiKey: string;
  agentId: string;
  fromNumber?: string;
  contacts: Contact[];
  bankName?: string | null;
}): Promise<BatchResult> {
  const firstContact = args.contacts[0];
  if (!firstContact) return { ok: false, error: "No contacts provided" };

  const fallbackToDemo = async (): Promise<BatchResult> => {
    const demo = await triggerBolnaDemoCall({
      apiKey: args.apiKey,
      agentId: args.agentId,
      contact: firstContact,
      bankName: args.bankName,
    });
    if (!demo.ok) return { ok: false, error: `Demo call fallback failed: ${demo.error}` };
    return {
      ok: true,
      batchId: null,
      demoCallId: demo.executionId,
      message: demoMessage(firstContact, demo.executionId),
    };
  };

  if (!args.fromNumber) return fallbackToDemo();

  const res = await postBolnaBatch({
    apiKey: args.apiKey,
    agentId: args.agentId,
    fromNumber: args.fromNumber,
    contacts: args.contacts,
    bankName: args.bankName,
  });

  if (res.ok) {
    const data = await res.json();
    const batchId: string | null = data.batch_id ?? null;
    return {
      ok: true,
      batchId,
      demoCallId: null,
      message: batchId ? `Bolna batch ${batchId} started` : "Campaign started.",
    };
  }

  const error = normalizeBolnaError(await res.text());
  console.error("Bolna batch failed:", error);

  if (!shouldFallbackToDemoCall(error)) {
    return { ok: false, error: `Bolna batch failed: ${error}` };
  }

  const demo = await fallbackToDemo();
  if (!demo.ok) return { ok: false, error: `Bolna batch failed: ${error}. ${demo.error}` };
  return demo;
}
