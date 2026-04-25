import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

export async function POST(req: NextRequest) {
  let body: { tool_name: string; call_id?: string; parameters?: Record<string, unknown> };

  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body");
  }

  const { tool_name, call_id, parameters: params = {} } = body;

  console.log(`[webhook] tool=${tool_name} call_id=${call_id}`);

  try {
    // ── fetch_customer_profile ──────────────────────────────────────────
    if (tool_name === "fetch_customer_profile") {
      const phone = params.phone as string;
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
        params.loan_type as string,
        params.loan_amount as number,
        params.monthly_income as number,
        params.employment_type as string
      );
      return ok({ eligible: result.eligible, reason: result.reason, max_amount: result.maxAmount });
    }

    // ── log_lead ────────────────────────────────────────────────────────
    if (tool_name === "log_lead") {
      const phone = params.phone as string;
      if (!phone) return err("phone is required");

      const transcript = params.call_transcript as string | undefined;
      const summaryText = transcript ? await generateSummary(transcript) : null;

      const eligResult = checkEligibility(
        params.loan_type as string,
        params.loan_amount as number,
        params.monthly_income as number,
        params.employment_type as string
      );

      const suppliedStatus = params.status as string | undefined;
      const finalStatus = suppliedStatus || STATUS_FROM_ELIGIBILITY[eligResult.status] || "called";

      const lead = await prisma.lead.upsert({
        where: { phone },
        create: {
          phone,
          name: params.name as string | undefined,
          loanType: params.loan_type as string | undefined,
          loanAmount: params.loan_amount as number | undefined,
          monthlyIncome: params.monthly_income as number | undefined,
          employmentType: params.employment_type as string | undefined,
          status: finalStatus,
          eligibility: eligResult.status,
          callTranscript: transcript,
          summary: summaryText,
          bolnaCallId: call_id,
        },
        update: {
          name: params.name as string | undefined,
          loanType: params.loan_type as string | undefined,
          loanAmount: params.loan_amount as number | undefined,
          monthlyIncome: params.monthly_income as number | undefined,
          employmentType: params.employment_type as string | undefined,
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
