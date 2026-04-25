import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/campaigns/:id/batch
// Accepts a JSON array of { phone, name? } and creates leads + triggers Bolna batch
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignId = Number(id);

  try {
    const body = await req.json();
    const contacts: { phone: string; name?: string }[] = body.contacts ?? [];

    if (!contacts.length) {
      return NextResponse.json({ data: null, error: "No contacts provided" }, { status: 400 });
    }

    // Upsert leads for each contact
    await Promise.all(
      contacts.map((c) =>
        prisma.lead.upsert({
          where: { phone: c.phone },
          create: { phone: c.phone, name: c.name, campaignId, status: "called" },
          update: { campaignId, name: c.name ?? undefined },
        })
      )
    );

    // Update campaign counts
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        totalLeads: contacts.length,
        calledCount: contacts.length,
        status: "running",
      },
    });

    // Trigger Bolna batch API
    const bolnaApiKey = process.env.BOLNA_API_KEY;
    const bolnaAgentId = process.env.BOLNA_AGENT_ID;
    const fromNumber = process.env.BOLNA_FROM_NUMBER;

    let bolnaBatchId: string | null = null;

    if (bolnaApiKey && bolnaAgentId && fromNumber) {
      // Build CSV content
      const csvRows = ["contact_number,first_name"];
      for (const c of contacts) {
        const firstName = c.name?.split(" ")[0] ?? "";
        csvRows.push(`${c.phone},${firstName}`);
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

      if (bolnaRes.ok) {
        const bolnaData = await bolnaRes.json();
        bolnaBatchId = bolnaData.batch_id ?? null;
        if (bolnaBatchId) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { bolnaBatchId },
          });
        }
      } else {
        console.error("Bolna batch creation failed:", await bolnaRes.text());
      }
    } else {
      console.warn("BOLNA_API_KEY / BOLNA_AGENT_ID / BOLNA_FROM_NUMBER not set — skipping Bolna batch");
    }

    return NextResponse.json({
      data: {
        leads_created: contacts.length,
        bolna_batch_id: bolnaBatchId,
        message: bolnaBatchId
          ? `Campaign running — Bolna batch ${bolnaBatchId} started`
          : "Leads saved. Set BOLNA_API_KEY, BOLNA_AGENT_ID, BOLNA_FROM_NUMBER to auto-trigger calls.",
      },
      error: null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to start campaign batch" }, { status: 500 });
  }
}
