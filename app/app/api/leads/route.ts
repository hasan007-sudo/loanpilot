import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const loanType = searchParams.get("loan_type") ?? undefined;
  const campaignId = searchParams.get("campaign_id");

  try {
    const leads = await prisma.lead.findMany({
      where: {
        ...(status && { status }),
        ...(loanType && { loanType }),
        ...(campaignId && { campaignId: Number(campaignId) }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: leads, error: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to fetch leads" }, { status: 500 });
  }
}
