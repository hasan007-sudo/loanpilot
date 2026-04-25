import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const lead = await prisma.lead.findUnique({ where: { id: Number(id) } });
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
    const lead = await prisma.lead.update({
      where: { id: Number(id) },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.eligibility && { eligibility: body.eligibility }),
        ...(body.name && { name: body.name }),
      },
    });
    return NextResponse.json({ data: lead, error: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to update lead" }, { status: 500 });
  }
}
