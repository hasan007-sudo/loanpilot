/**
 * Server-side data access layer.
 * Used by Server Components to query the DB directly (no HTTP round-trip).
 * Do NOT import this in client components — use lib/api.ts instead.
 */
import { prisma } from "@/lib/db";
import type { Campaign, Lead, LeadDetail, DashboardStats } from "@/lib/api";

// Prisma returns Date objects; our shared types use ISO strings (matching JSON API).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeDates<T>(obj: any): T {
  if (!obj) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v])
  ) as T;
}

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
  const rows = await prisma.lead.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.loan_type && { loanType: filters.loan_type }),
      ...(filters?.campaign_id && { campaignId: filters.campaign_id }),
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(r => serializeDates<Lead>(r));
}

export async function getLead(id: number): Promise<LeadDetail | null> {
  const row = await prisma.lead.findUnique({ where: { id } });
  if (!row) return null;
  return serializeDates<LeadDetail>(row);
}

export async function getCampaign(id: number): Promise<Campaign | null> {
  const row = await prisma.campaign.findUnique({ where: { id } });
  if (!row) return null;
  return serializeDates<Campaign>(row);
}
