import { NextRequest, NextResponse } from "next/server";
import { getLeads } from "@/lib/data";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const campaignId = searchParams.get("campaign_id");

  try {
    const data = await getLeads({
      status: searchParams.get("status") ?? undefined,
      loan_type: searchParams.get("loan_type") ?? undefined,
      campaign_id: campaignId ? Number(campaignId) : undefined,
    });
    return NextResponse.json({ data, error: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to fetch leads" }, { status: 500 });
  }
}
