import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/data";

export async function GET() {
  try {
    const data = await getDashboardStats();
    return NextResponse.json({ data, error: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ data: null, error: "Failed to fetch stats" }, { status: 500 });
  }
}
