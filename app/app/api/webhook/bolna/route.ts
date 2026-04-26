import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { checkEligibility } from "@/lib/services/eligibility";
import { generateSummary } from "@/lib/services/summary";

const STATUS_FROM_ELIGIBILITY: Record<string, string> = {
  eligible: "pre_qualified",
  ineligible: "not_interested",
  review_needed: "interested",
  pending: "called",
};

function ok(data: unknown) {
  return NextResponse.json({ data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

type ToolWebhookBody = {
  tool_name: string;
  call_id?: string;
  parameters?: Record<string, unknown>;
};

type ExecutionWebhookBody = {
  id?: string;
  status?: string;
  transcript?: string | null;
  extracted_data?: Record<string, unknown> | null;
  telephony_data?: {
    to_number?: string | null;
    from_number?: string | null;
    provider_call_id?: string | null;
  } | null;
  context_details?: Record<string, unknown> | null;
};

type ExecutionLookup = {
  transcript?: string | null;
  telephony_data?: {
    to_number?: string | null;
  } | null;
};

function isToolWebhookBody(body: unknown): body is ToolWebhookBody {
  return typeof body === "object" && body !== null && "tool_name" in body;
}

function isExecutionWebhookBody(body: unknown): body is ExecutionWebhookBody {
  return typeof body === "object" && body !== null && "status" in body && "id" in body;
}

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function fetchExecutionDetails(executionId: string): Promise<ExecutionLookup | null> {
  if (!config.bolna.apiKey) return null;

  try {
    const response = await fetch(`${config.bolna.apiBase}/executions/${executionId}`, {
      headers: {
        Authorization: `Bearer ${config.bolna.apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[webhook] failed to fetch execution details", executionId, response.status);
      return null;
    }

    const json = (await response.json()) as ExecutionLookup;
    return json;
  } catch (error) {
    console.error("[webhook] execution lookup failed", executionId, error);
    return null;
  }
}

async function resolvePhone(callId: string | undefined, params: Record<string, unknown>, execution?: ExecutionWebhookBody) {
  const directPhone =
    toOptionalString(params.phone) ??
    toOptionalString(execution?.telephony_data?.to_number) ??
    toOptionalString(execution?.context_details?.phone) ??
    toOptionalString(execution?.context_details?.user_number);

  if (directPhone) return { phone: directPhone, transcript: execution?.transcript ?? null };
  if (!callId) return { phone: null, transcript: execution?.transcript ?? null };

  const details = await fetchExecutionDetails(callId);
  return {
    phone: toOptionalString(details?.telephony_data?.to_number),
    transcript: details?.transcript ?? execution?.transcript ?? null,
  };
}

async function handleExecutionWebhook(body: ExecutionWebhookBody) {
  const callId = toOptionalString(body.id);
  const { phone, transcript } = await resolvePhone(callId ?? undefined, {}, body);

  if (!phone) {
    return ok({
      ignored: true,
      reason: "No destination phone number in execution payload",
      call_id: callId,
      status: body.status ?? null,
    });
  }

  const summaryText = transcript ? await generateSummary(transcript) : null;

  const lead = await prisma.lead.upsert({
    where: { phone },
    create: {
      phone,
      status: "called",
      eligibility: "pending",
      ...(transcript ? { callTranscript: transcript } : {}),
      ...(summaryText ? { summary: summaryText } : {}),
      ...(callId ? { bolnaCallId: callId } : {}),
    },
    update: {
      ...(transcript ? { callTranscript: transcript } : {}),
      ...(summaryText ? { summary: summaryText } : {}),
      ...(callId ? { bolnaCallId: callId } : {}),
    },
  });

  return ok({
    lead_id: lead.id,
    call_id: callId,
    status: body.status ?? null,
    summary: lead.summary ?? null,
  });
}

export async function POST(req: NextRequest) {
  let body: ToolWebhookBody | ExecutionWebhookBody;

  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body");
  }

  try {
    if (isExecutionWebhookBody(body) && !isToolWebhookBody(body)) {
      console.log(`[webhook] execution id=${body.id} status=${body.status}`);
      return handleExecutionWebhook(body);
    }

    if (!isToolWebhookBody(body)) {
      return err("Unsupported webhook payload");
    }

    const { tool_name, call_id, parameters: params = {} } = body;
    console.log(`[webhook] tool=${tool_name} call_id=${call_id}`);

    // ── fetch_customer_profile ──────────────────────────────────────────
    if (tool_name === "fetch_customer_profile") {
      const phone = toOptionalString(params.phone);
      if (!phone) return err("phone is required");

      const lead = await prisma.lead.findUnique({ where: { phone } });
      return ok({
        name: lead?.name ?? "Valued Customer",
        existing_loans: lead?.loanType ? 1 : 0,
        relationship: lead ? "existing_customer" : "prospect",
      });
    }

    // ── check_eligibility ───────────────────────────────────────────────
    if (tool_name === "check_eligibility") {
      const result = checkEligibility(
        toOptionalString(params.loan_type),
        toOptionalNumber(params.loan_amount),
        toOptionalNumber(params.monthly_income),
        toOptionalString(params.employment_type)
      );
      return ok({ eligible: result.eligible, reason: result.reason, max_amount: result.maxAmount });
    }

    // ── log_lead ────────────────────────────────────────────────────────
    if (tool_name === "log_lead") {
      const { phone, transcript: fetchedTranscript } = await resolvePhone(call_id, params);
      if (!phone) return err("phone is required");

      const transcript = toOptionalString(params.call_transcript) ?? fetchedTranscript ?? undefined;
      const summaryText = transcript ? await generateSummary(transcript) : null;

      const eligResult = checkEligibility(
        toOptionalString(params.loan_type),
        toOptionalNumber(params.loan_amount),
        toOptionalNumber(params.monthly_income),
        toOptionalString(params.employment_type)
      );

      const suppliedStatus = toOptionalString(params.status) ?? undefined;
      const finalStatus = suppliedStatus || STATUS_FROM_ELIGIBILITY[eligResult.status] || "called";

      const lead = await prisma.lead.upsert({
        where: { phone },
        create: {
          phone,
          name: toOptionalString(params.name) ?? undefined,
          loanType: toOptionalString(params.loan_type) ?? undefined,
          loanAmount: toOptionalNumber(params.loan_amount) ?? undefined,
          monthlyIncome: toOptionalNumber(params.monthly_income) ?? undefined,
          employmentType: toOptionalString(params.employment_type) ?? undefined,
          status: finalStatus,
          eligibility: eligResult.status,
          callTranscript: transcript,
          summary: summaryText,
          bolnaCallId: call_id,
        },
        update: {
          name: toOptionalString(params.name) ?? undefined,
          loanType: toOptionalString(params.loan_type) ?? undefined,
          loanAmount: toOptionalNumber(params.loan_amount) ?? undefined,
          monthlyIncome: toOptionalNumber(params.monthly_income) ?? undefined,
          employmentType: toOptionalString(params.employment_type) ?? undefined,
          status: finalStatus,
          eligibility: eligResult.status,
          ...(transcript && { callTranscript: transcript }),
          ...(summaryText && { summary: summaryText }),
          ...(call_id && { bolnaCallId: call_id }),
        },
      });

      return ok({ lead_id: lead.id, summary: lead.summary ?? "Lead logged." });
    }

    return err(`Unknown tool_name: ${tool_name}`);
  } catch (e) {
    console.error("[webhook] error:", e);
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 });
  }
}
