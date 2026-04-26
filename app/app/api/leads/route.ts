import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body.phone?.toString().trim();
    if (!phone) {
      return NextResponse.json({ data: null, error: "Phone is required" }, { status: 400 });
    }

    const loanAmount = body.loanAmount != null && body.loanAmount !== "" ? Number(body.loanAmount) : null;
    const monthlyIncome = body.monthlyIncome != null && body.monthlyIncome !== "" ? Number(body.monthlyIncome) : null;

    if (loanAmount !== null && !Number.isFinite(loanAmount)) {
      return NextResponse.json({ data: null, error: "Invalid loanAmount" }, { status: 400 });
    }
    if (monthlyIncome !== null && !Number.isFinite(monthlyIncome)) {
      return NextResponse.json({ data: null, error: "Invalid monthlyIncome" }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        phone,
        name: body.name?.toString().trim() || null,
        campaignId: body.campaignId ? Number(body.campaignId) : null,
        loanType: body.loanType?.toString().trim() || null,
        loanAmount,
        monthlyIncome,
        employmentType: body.employmentType?.toString().trim() || null,
      },
    });

    return NextResponse.json({ data: lead, error: null }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ data: null, error: "Phone number already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to create lead" }, { status: 500 });
  }
}
