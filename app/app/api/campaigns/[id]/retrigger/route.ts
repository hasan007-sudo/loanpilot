import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { triggerBolnaCalls } from "@/lib/bolna";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignId = Number(id);

  try {
    const [campaign, leads] = await Promise.all([
      prisma.campaign.findUnique({ where: { id: campaignId }, select: { bankName: true } }),
      prisma.lead.findMany({
        where: { campaignId },
        select: { phone: true, name: true },
        orderBy: { id: "asc" },
      }),
    ]);

    if (!leads.length) {
      return NextResponse.json({ data: null, error: "No leads found for this campaign" }, { status: 400 });
    }

    const { apiKey, agentId, fromNumber } = config.bolna;
    if (!apiKey || !agentId) {
      return NextResponse.json({
        data: {
          campaign_id: campaignId,
          leads_retriggered: leads.length,
          bolna_batch_id: null,
          demo_call_id: null,
          message: "Set BOLNA_API_KEY and BOLNA_AGENT_ID to trigger calls.",
        },
        error: null,
      });
    }

    const result = await triggerBolnaCalls({
      apiKey,
      agentId,
      fromNumber,
      contacts: leads,
      bankName: campaign?.bankName,
    });

    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error }, { status: 502 });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "running",
        calledCount: leads.length,
        ...(result.batchId ? { bolnaBatchId: result.batchId } : {}),
      },
    });

    return NextResponse.json({
      data: {
        campaign_id: campaignId,
        leads_retriggered: leads.length,
        bolna_batch_id: result.batchId,
        demo_call_id: result.demoCallId,
        message: result.message,
      },
      error: null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to re-trigger campaign" }, { status: 500 });
  }
}
