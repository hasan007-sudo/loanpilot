import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { triggerBolnaCalls } from "@/lib/bolna";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignId = Number(id);

  try {
    const body = await req.json();
    const contacts: { phone: string; name?: string }[] = body.contacts ?? [];
    if (!contacts.length) {
      return NextResponse.json({ data: null, error: "No contacts provided" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { bankName: true },
    });

    await Promise.all(
      contacts.map((c) =>
        prisma.lead.upsert({
          where: { phone: c.phone },
          create: { phone: c.phone, name: c.name, campaignId, status: "called" },
          update: { campaignId, name: c.name ?? undefined },
        })
      )
    );

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalLeads: contacts.length, calledCount: contacts.length, status: "running" },
    });

    const { apiKey, agentId, fromNumber } = config.bolna;
    if (!apiKey || !agentId) {
      return NextResponse.json({
        data: {
          leads_created: contacts.length,
          bolna_batch_id: null,
          demo_call_id: null,
          message: "Leads saved. Set BOLNA_API_KEY and BOLNA_AGENT_ID to trigger calls.",
        },
        error: null,
      });
    }

    const result = await triggerBolnaCalls({
      apiKey,
      agentId,
      fromNumber,
      contacts,
      bankName: campaign?.bankName,
    });

    if (!result.ok) {
      return NextResponse.json({ data: null, error: result.error }, { status: 502 });
    }

    if (result.batchId) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { bolnaBatchId: result.batchId },
      });
    }

    return NextResponse.json({
      data: {
        leads_created: contacts.length,
        bolna_batch_id: result.batchId,
        demo_call_id: result.demoCallId,
        message: result.message,
      },
      error: null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to start campaign batch" }, { status: 500 });
  }
}
