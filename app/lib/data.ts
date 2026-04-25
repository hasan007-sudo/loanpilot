/**
 * Server-side data access layer.
 * Used by Server Components to query the DB directly (no HTTP round-trip).
 * Do NOT import this in client components — use lib/api.ts instead.
 */
import { prisma } from "@/lib/db";
import type { DashboardStats, Lead, LeadDetail } from "@/lib/api";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [total, interested, qualified, notInterested] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "interested" } }),
    prisma.lead.count({ where: { status: "pre_qualified" } }),
    prisma.lead.count({ where: { status: "not_interested" } }),
  ]);
  const conversionRate = total > 0 ? (qualified / total) * 100 : 0;
  return {
    total_called: total,
    interested,
    qualified,
    not_interested: notInterested,
    conversion_rate: Math.round(conversionRate * 10) / 10,
  };
}

export async function getLeads(filters?: {
  status?: string;
  loan_type?: string;
  campaign_id?: number;
}): Promise<Lead[]> {
  return prisma.lead.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.loan_type && { loanType: filters.loan_type }),
      ...(filters?.campaign_id && { campaignId: filters.campaign_id }),
    },
    orderBy: { createdAt: "desc" },
  }) as Promise<Lead[]>;
}

export async function getLead(id: number): Promise<LeadDetail | null> {
  return prisma.lead.findUnique({ where: { id } }) as Promise<LeadDetail | null>;
}
