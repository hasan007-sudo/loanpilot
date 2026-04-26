import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getLead } from "@/lib/data";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const lead = await getLead(Number(id));
    if (!lead) return NextResponse.json({ data: null, error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: lead, error: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to fetch lead" }, { status: 500 });
  }
}

// PATCH /api/leads/:id — update status (manager action)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    const hasField = (key: string) => Object.prototype.hasOwnProperty.call(body, key);

    if (hasField("status")) data.status = body.status;
    if (hasField("eligibility")) data.eligibility = body.eligibility;
    if (hasField("name")) data.name = body.name;
    if (hasField("phone")) data.phone = body.phone;
    if (hasField("loanType")) data.loanType = body.loanType;
    if (hasField("employmentType")) data.employmentType = body.employmentType;

    if (hasField("loanAmount")) {
      if (body.loanAmount === null || body.loanAmount === "") {
        data.loanAmount = null;
      } else {
        const parsed = Number(body.loanAmount);
        if (!Number.isFinite(parsed)) {
          return NextResponse.json({ data: null, error: "Invalid loanAmount" }, { status: 400 });
        }
        data.loanAmount = parsed;
      }
    }

    if (hasField("monthlyIncome")) {
      if (body.monthlyIncome === null || body.monthlyIncome === "") {
        data.monthlyIncome = null;
      } else {
        const parsed = Number(body.monthlyIncome);
        if (!Number.isFinite(parsed)) {
          return NextResponse.json({ data: null, error: "Invalid monthlyIncome" }, { status: 400 });
        }
        data.monthlyIncome = parsed;
      }
    }

    const lead = await prisma.lead.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json({ data: lead, error: null });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ data: null, error: "Phone number already exists" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to update lead" }, { status: 500 });
  }
}
