const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Lead {
  id: number;
  phone: string;
  name: string | null;
  loan_type: string | null;
  loan_amount: number | null;
  monthly_income: number | null;
  employment_type: string | null;
  status: string;
  eligibility: string;
  summary: string | null;
  campaign_id: number | null;
  created_at: string;
}

export interface LeadDetail extends Lead {
  call_transcript: string | null;
  bolna_call_id: string | null;
  updated_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  bank_name: string | null;
  total_leads: number;
  called_count: number;
  interested_count: number;
  qualified_count: number;
  status: string;
  created_at: string;
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
