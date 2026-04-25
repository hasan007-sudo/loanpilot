import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeBolnaError, shouldFallbackToDemoCall, triggerBolnaDemoCall } from "@/lib/bolna";

// POST /api/campaigns/:id/retrigger
// Re-triggers Bolna for all leads already mapped to the campaign.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignId = Number(id);

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { bankName: true },
    });

    const leads = await prisma.lead.findMany({
      where: { campaignId },
      select: { phone: true, name: true },
      orderBy: { id: "asc" },
    });

    if (!leads.length) {
      return NextResponse.json({ data: null, error: "No leads found for this campaign" }, { status: 400 });
    }

    const bolnaApiKey = process.env.BOLNA_API_KEY;
    const bolnaAgentId = process.env.BOLNA_AGENT_ID;
    const fromNumber = process.env.BOLNA_FROM_NUMBER?.trim();
    let bolnaBatchId: string | null = null;
    let demoCallId: string | null = null;
    let message = "Set BOLNA_API_KEY and BOLNA_AGENT_ID to trigger calls.";

    if (!bolnaApiKey || !bolnaAgentId) {
      return NextResponse.json({
        data: {
          campaign_id: campaignId,
          leads_retriggered: leads.length,
          bolna_batch_id: null,
          demo_call_id: null,
          message,
        },
        error: null,
      });
    }

    const csvRows = ["contact_number,first_name,customer_name,bank_name"];
    for (const lead of leads) {
      const customerName = lead.name?.trim() || "there";
      const firstName = customerName.split(" ")[0] || "there";
      const bankName = campaign?.bankName?.trim() || "Apex Bank";
      csvRows.push(`${lead.phone},${firstName},${customerName},${bankName}`);
    }

    const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const formData = new FormData();
    formData.append("agent_id", bolnaAgentId);
    formData.append("file", csvBlob, "contacts.csv");
    if (fromNumber) {
      formData.append("from_phone_numbers", JSON.stringify([fromNumber]));
    }

    if (fromNumber) {
      const bolnaRes = await fetch("https://api.bolna.ai/batches", {
        method: "POST",
        headers: { Authorization: `Bearer ${bolnaApiKey}` },
        body: formData,
      });

      if (!bolnaRes.ok) {
        const bolnaError = normalizeBolnaError(await bolnaRes.text());
        console.error("Bolna batch re-trigger failed:", bolnaError);

        if (shouldFallbackToDemoCall(bolnaError)) {
          const demoCall = await triggerBolnaDemoCall({
            apiKey: bolnaApiKey,
            agentId: bolnaAgentId,
            lead: leads[0],
            bankName: campaign?.bankName,
          });

          if (!demoCall.ok) {
            return NextResponse.json(
              { data: null, error: `Bolna batch re-trigger failed: ${bolnaError}. Demo call fallback failed: ${demoCall.error}` },
              { status: 502 }
            );
          }

          demoCallId = demoCall.executionId;
          message = `Demo mode active. First lead call queued successfully for ${leads[0].phone}${demoCallId ? ` (${demoCallId})` : ""}.`;
        } else {
          return NextResponse.json(
            { data: null, error: `Bolna batch re-trigger failed: ${bolnaError}` },
            { status: 502 }
          );
        }
      } else {
        const bolnaData = await bolnaRes.json();
        bolnaBatchId = bolnaData.batch_id ?? null;
        message = bolnaBatchId
          ? `Campaign re-triggered — Bolna batch ${bolnaBatchId} started`
          : "Campaign re-triggered.";
      }
    } else {
      const demoCall = await triggerBolnaDemoCall({
        apiKey: bolnaApiKey,
        agentId: bolnaAgentId,
        lead: leads[0],
        bankName: campaign?.bankName,
      });

      if (!demoCall.ok) {
        return NextResponse.json(
          { data: null, error: `Demo call fallback failed: ${demoCall.error}` },
          { status: 502 }
        );
      }

      demoCallId = demoCall.executionId;
      message = `Demo mode active. First lead call queued successfully for ${leads[0].phone}${demoCallId ? ` (${demoCallId})` : ""}.`;
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "running",
        calledCount: leads.length,
        ...(bolnaBatchId ? { bolnaBatchId } : {}),
      },
    });

    return NextResponse.json({
      data: {
        campaign_id: campaignId,
        leads_retriggered: leads.length,
        bolna_batch_id: bolnaBatchId,
        demo_call_id: demoCallId,
        message,
      },
      error: null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to re-trigger campaign" }, { status: 500 });
  }
}
