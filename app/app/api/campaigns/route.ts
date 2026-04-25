import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { leads: true } } },
    });
    return NextResponse.json({ data: campaigns, error: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        bankName: body.bank_name ?? null,
        totalLeads: body.total_leads ?? 0,
        status: "draft",
      },
    });
    return NextResponse.json({ data: campaign, error: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to create campaign" }, { status: 500 });
  }
}
