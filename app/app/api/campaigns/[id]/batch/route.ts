import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeBolnaError, shouldFallbackToDemoCall, triggerBolnaDemoCall } from "@/lib/bolna";

// POST /api/campaigns/:id/batch
// Accepts a JSON array of { phone, name? } and creates leads + triggers Bolna batch
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaignId = Number(id);

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { bankName: true },
    });

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
    const fromNumber = process.env.BOLNA_FROM_NUMBER?.trim();

    let bolnaBatchId: string | null = null;
    let demoCallId: string | null = null;
    let message = "Leads saved. Set BOLNA_API_KEY, BOLNA_AGENT_ID, BOLNA_FROM_NUMBER to auto-trigger calls.";

    if (bolnaApiKey && bolnaAgentId && fromNumber) {
      // Build CSV content
      const csvRows = ["contact_number,first_name,customer_name,bank_name"];
      for (const c of contacts) {
        const customerName = c.name?.trim() || "there";
        const firstName = customerName.split(" ")[0] || "there";
        const bankName = campaign?.bankName?.trim() || "Apex Bank";
        csvRows.push(`${c.phone},${firstName},${customerName},${bankName}`);
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
        message = `Campaign running — Bolna batch ${bolnaBatchId} started`;
      } else {
        const bolnaError = normalizeBolnaError(await bolnaRes.text());
        console.error("Bolna batch creation failed:", bolnaError);

        if (shouldFallbackToDemoCall(bolnaError)) {
          const firstContact = contacts[0];
          const demoCall = await triggerBolnaDemoCall({
            apiKey: bolnaApiKey,
            agentId: bolnaAgentId,
            lead: firstContact,
            bankName: campaign?.bankName,
          });

          if (!demoCall.ok) {
            return NextResponse.json(
              { data: null, error: `Bolna batch creation failed: ${bolnaError}. Demo call fallback failed: ${demoCall.error}` },
              { status: 502 }
            );
          }

          demoCallId = demoCall.executionId;
          message = `Demo mode active. First lead call queued successfully for ${firstContact.phone}${demoCallId ? ` (${demoCallId})` : ""}.`;
        } else {
          return NextResponse.json(
            { data: null, error: `Bolna batch creation failed: ${bolnaError}` },
            { status: 502 }
          );
        }
      }
    } else if (bolnaApiKey && bolnaAgentId && contacts.length > 0) {
      const firstContact = contacts[0];
      const demoCall = await triggerBolnaDemoCall({
        apiKey: bolnaApiKey,
        agentId: bolnaAgentId,
        lead: firstContact,
        bankName: campaign?.bankName,
      });

      if (demoCall.ok) {
        demoCallId = demoCall.executionId;
        message = `Demo mode active. First lead call queued successfully for ${firstContact.phone}${demoCallId ? ` (${demoCallId})` : ""}.`;
      } else {
        return NextResponse.json(
          { data: null, error: `Demo call fallback failed: ${demoCall.error}` },
          { status: 502 }
        );
      }
    } else {
      console.warn("BOLNA_API_KEY / BOLNA_AGENT_ID / BOLNA_FROM_NUMBER not set — skipping Bolna batch");
    }

    return NextResponse.json({
      data: {
        leads_created: contacts.length,
        bolna_batch_id: bolnaBatchId,
        demo_call_id: demoCallId,
        message,
      },
      error: null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to start campaign batch" }, { status: 500 });
  }
}
