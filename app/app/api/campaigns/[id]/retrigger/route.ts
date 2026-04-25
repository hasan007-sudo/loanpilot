import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/campaigns/:id/retrigger
// Re-triggers Bolna for all leads already mapped to the campaign.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignId = Number(id);

  try {
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

    if (!bolnaApiKey || !bolnaAgentId || !fromNumber) {
      return NextResponse.json({
        data: {
          campaign_id: campaignId,
          leads_retriggered: leads.length,
          bolna_batch_id: null,
          message: "Set BOLNA_API_KEY, BOLNA_AGENT_ID, BOLNA_FROM_NUMBER to trigger calls.",
        },
        error: null,
      });
    }

    const csvRows = ["contact_number,first_name"];
    for (const lead of leads) {
      const firstName = lead.name?.split(" ")[0] ?? "";
      csvRows.push(`${lead.phone},${firstName}`);
    }

    const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const formData = new FormData();
    formData.append("agent_id", bolnaAgentId);
    formData.append("file", csvBlob, "contacts.csv");
    formData.append("from_phone_numbers", JSON.stringify([fromNumber]));

    const bolnaRes = await fetch("https://api.bolna.ai/batches", {
      method: "POST",
      headers: { Authorization: `Bearer ${bolnaApiKey}` },
      body: formData,
    });

    if (!bolnaRes.ok) {
      const bolnaError = await bolnaRes.text();
      console.error("Bolna batch re-trigger failed:", bolnaError);
      return NextResponse.json(
        { data: null, error: `Bolna batch re-trigger failed: ${bolnaError}` },
        { status: 502 }
      );
    }

    const bolnaData = await bolnaRes.json();
    const bolnaBatchId = bolnaData.batch_id ?? null;

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
        message: bolnaBatchId
          ? `Campaign re-triggered — Bolna batch ${bolnaBatchId} started`
          : "Campaign re-triggered.",
      },
      error: null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to re-trigger campaign" }, { status: 500 });
  }
}
