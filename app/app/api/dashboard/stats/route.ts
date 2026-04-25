import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [total, interested, qualified, notInterested] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "interested" } }),
      prisma.lead.count({ where: { status: "pre_qualified" } }),
      prisma.lead.count({ where: { status: "not_interested" } }),
    ]);

    const conversionRate = total > 0 ? (qualified / total) * 100 : 0;

    return NextResponse.json({
      data: {
        total_called: total,
        interested,
        qualified,
        not_interested: notInterested,
        conversion_rate: Math.round(conversionRate * 10) / 10,
      },
      error: null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to fetch stats" }, { status: 500 });
  }
}
