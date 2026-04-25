// API routes are now Next.js built-in — no separate backend needed
const BASE = "";

export interface Lead {
  id: number;
  phone: string;
  name: string | null;
  loanType: string | null;
  loanAmount: number | null;
  monthlyIncome: number | null;
  employmentType: string | null;
  status: string;
  eligibility: string;
  summary: string | null;
  campaignId: number | null;
  createdAt: string;
}

export interface LeadDetail extends Lead {
  callTranscript: string | null;
  bolnaCallId: string | null;
  updatedAt: string;
}

export interface Campaign {
  id: number;
  name: string;
  bankName: string | null;
  totalLeads: number;
  calledCount: number;
  interestedCount: number;
  qualifiedCount: number;
  status: string;
  createdAt: string;
}

export interface CampaignCreate {
  name: string;
  bank_name?: string;
  total_leads?: number;
}

export interface DashboardStats {
  total_called: number;
  interested: number;
  qualified: number;
  conversion_rate: number;
  not_interested: number;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error ?? "API error");
  return json.data as T;
}

export async function fetchLeads(filters?: {
  status?: string;
  loan_type?: string;
  campaign_id?: number;
}): Promise<Lead[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.loan_type) params.set("loan_type", filters.loan_type);
  if (filters?.campaign_id) params.set("campaign_id", String(filters.campaign_id));
  const qs = params.toString();
  return apiFetch<Lead[]>(`/api/leads${qs ? `?${qs}` : ""}`);
}

export async function fetchLead(id: number): Promise<LeadDetail> {
  return apiFetch<LeadDetail>(`/api/leads/${id}`);
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  return apiFetch<Campaign[]>("/api/campaigns");
}

export async function createCampaign(data: CampaignCreate): Promise<Campaign> {
  return apiFetch<Campaign>("/api/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/api/dashboard/stats");
}

export async function updateLeadStatus(id: number, status: string): Promise<Lead> {
  return apiFetch<Lead>(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface LeadDetailsUpdate {
  name?: string | null;
  phone?: string;
  loanType?: string | null;
  loanAmount?: number | null;
  monthlyIncome?: number | null;
  employmentType?: string | null;
}

export async function updateLeadDetails(id: number, payload: LeadDetailsUpdate): Promise<Lead> {
  return apiFetch<Lead>(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function startCampaignBatch(
  campaignId: number,
  contacts: { phone: string; name?: string }[]
): Promise<{ leads_created: number; bolna_batch_id: string | null; message: string }> {
  return apiFetch(`/api/campaigns/${campaignId}/batch`, {
    method: "POST",
    body: JSON.stringify({ contacts }),
  });
}

export async function retriggerCampaign(
  campaignId: number
): Promise<{ campaign_id: number; leads_retriggered: number; bolna_batch_id: string | null; message: string }> {
  return apiFetch(`/api/campaigns/${campaignId}/retrigger`, {
    method: "POST",
  });
}

// All possible lead statuses (Bolna-set + manager-set)
export const LEAD_STATUSES = [
  { value: "called",            label: "Called" },
  { value: "not_interested",    label: "Not Interested" },
  { value: "interested",        label: "Showed Interest" },
  { value: "pre_qualified",     label: "Pre-Qualified" },
  { value: "processing_loan",   label: "Processing Loan" },
  { value: "approval_pending",  label: "Approval Pending" },
  { value: "passed_to_rm",      label: "Passed to RM" },
  { value: "loan_approved",     label: "Loan Approved" },
  { value: "loan_rejected",     label: "Loan Rejected" },
];
