"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchCampaigns, createCampaign, startCampaignBatch, retriggerCampaign } from "@/lib/api";
import type { Campaign } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Upload, Play, CheckCircle2, RotateCcw } from "lucide-react";

// ── Campaign Card ──────────────────────────────────────────────────────────────
function CampaignCard({
  campaign,
  onRunBatch,
  onRetrigger,
  retriggering,
}: {
  campaign: Campaign;
  onRunBatch: (id: number) => void;
  onRetrigger: (id: number) => void;
  retriggering: boolean;
}) {
  const pct = campaign.totalLeads > 0
    ? Math.round((campaign.calledCount / campaign.totalLeads) * 100)
    : 0;

  return (
    <Card className="glass-panel border-white/80 bg-white/72 py-0 transition-transform duration-200 hover:-translate-y-0.5">
      <Link href={`/campaigns/${campaign.id}`} className="block cursor-pointer rounded-t-[inherit] focus-visible:outline-none">
        <CardHeader className="border-b border-black/5 px-5 pb-4 pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="page-kicker">Outbound Campaign</p>
              <CardTitle className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">{campaign.name}</CardTitle>
              {campaign.bankName && <p className="mt-2 text-sm text-muted-foreground">{campaign.bankName}</p>}
            </div>
            <StatusBadge value={campaign.status} />
          </div>
        </CardHeader>
        <CardContent className="px-5 py-5">
          <div className="mb-5">
            <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>{campaign.calledCount} called</span>
              <span>{campaign.totalLeads} total</span>
            </div>
            <div className="h-3 w-full rounded-full bg-black/5">
              <div className="h-3 rounded-full bg-gradient-to-r from-[#255561] to-[#66a7a1] transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="font-heading text-4xl leading-none font-medium text-foreground">{campaign.calledCount}</p>
              <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Called</p>
            </div>
            <div>
              <p className="font-heading text-4xl leading-none font-medium text-[#9a5928]">{campaign.interestedCount}</p>
              <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Interested</p>
            </div>
            <div>
              <p className="font-heading text-4xl leading-none font-medium text-[#1f5b48]">{campaign.qualifiedCount}</p>
              <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Qualified</p>
            </div>
          </div>

          <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Created {new Date(campaign.createdAt).toLocaleDateString("en-IN")}
          </p>
        </CardContent>
      </Link>

      <CardContent className="space-y-2 px-5 pb-5 pt-0">
          {campaign.status === "draft" && (
            <Button
              size="sm"
              className="h-11 w-full rounded-full bg-[#255561] text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#1f4954]"
              onClick={() => onRunBatch(campaign.id)}
            >
              <Play className="mr-1 h-3 w-3" /> Upload & Run Batch
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="h-11 w-full rounded-full border-black/10 bg-white/85 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-[#f4f7f6]"
            onClick={() => onRetrigger(campaign.id)}
            disabled={retriggering}
          >
            <RotateCcw className={`mr-1 h-3.5 w-3.5 ${retriggering ? "animate-spin" : ""}`} />
            {retriggering ? "Re-triggering..." : "Re-trigger Calls"}
          </Button>
      </CardContent>
    </Card>
  );
}

// ── New Campaign Dialog ────────────────────────────────────────────────────────
function NewCampaignDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", bank_name: "", total_leads: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createCampaign({
        name: form.name,
        bank_name: form.bank_name || undefined,
        total_leads: form.total_leads ? Number(form.total_leads) : undefined,
      });
      setOpen(false);
      setForm({ name: "", bank_name: "", total_leads: "" });
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="h-11 rounded-full bg-[#255561] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#1f4954]">
          <Plus className="mr-1 h-4 w-4" /> New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="page-kicker">Campaign Setup</span>
          <DialogTitle className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">Create Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-foreground">Campaign Name *</label>
            <input required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Q2 Home Loan Drive"
              className="mt-2 h-12 w-full rounded-[18px] border border-black/10 bg-[#f4f7f6] px-4 text-sm outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Bank Name</label>
            <input value={form.bank_name}
              onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
              placeholder="Apex Bank"
              className="mt-2 h-12 w-full rounded-[18px] border border-black/10 bg-[#f4f7f6] px-4 text-sm outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="rounded-full border-black/10 bg-white/80 px-4" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-full bg-[#255561] px-4 text-white hover:bg-[#1f4954]">
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Batch Upload Dialog ────────────────────────────────────────────────────────
function BatchUploadDialog({
  campaignId,
  open,
  onClose,
  onDone,
}: {
  campaignId: number;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [contacts, setContacts] = useState<{ phone: string; name?: string }[]>([]);
  const [result, setResult] = useState<{ leads_created: number; bolna_batch_id: string | null; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setStep("upload");
    setContacts([]);
    setResult(null);
    setError(null);
  }

  function parseCSV(text: string) {
    const lines = text.trim().split("\n").filter(Boolean);
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("contact_number") || header.includes("phone");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const cols = line.split(",").map(s => s.trim().replace(/^['"]|['"]$/g, ""));
      return {
        phone: cols[0],
        name: cols[1] ?? undefined,
      };
    }).filter(c => c.phone);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (!parsed.length) { setError("No valid contacts found in CSV"); return; }
      setContacts(parsed);
      setStep("preview");
      setError(null);
    };
    reader.readAsText(file);
  }

  // Manual entry fallback
  const [manual, setManual] = useState("");
  function handleManualParse() {
    const lines = manual.trim().split("\n").filter(Boolean);
    const parsed = lines.map(l => {
      const [phone, name] = l.split(",").map(s => s.trim());
      return { phone, name };
    }).filter(c => c.phone);
    if (!parsed.length) { setError("No valid entries"); return; }
    setContacts(parsed);
    setStep("preview");
    setError(null);
  }

  async function handleRunBatch() {
    setLoading(true);
    try {
      const res = await startCampaignBatch(campaignId, contacts);
      setResult(res);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetState(); onClose(); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <span className="page-kicker">Batch Loader</span>
          <DialogTitle>
            {step === "upload" && "Upload Contacts"}
            {step === "preview" && `Preview — ${contacts.length} contacts`}
            {step === "done" && "Batch Started"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 — UPLOAD */}
        {step === "upload" && (
          <div className="space-y-4 mt-2">
            <div
              className="cursor-pointer rounded-[22px] border-2 border-dashed border-black/10 bg-[#f4f7f6] p-8 text-center transition-colors hover:border-[#4f8487]"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Click to upload CSV</p>
              <p className="mt-1 text-xs text-muted-foreground">Format: <code className="rounded bg-white px-1 py-0.5">contact_number,first_name</code></p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative text-center"><span className="bg-white px-2 text-xs text-gray-400">or paste manually</span></div>
            </div>

            <div>
              <textarea
                value={manual}
                onChange={e => setManual(e.target.value)}
                placeholder={"+919876543210,Rahul Sharma\n+918765432109,Priya Mehta"}
                rows={5}
                className="w-full rounded-[18px] border border-black/10 bg-[#f4f7f6] px-4 py-3 font-mono text-xs outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]"
              />
              <Button size="sm" variant="outline" className="mt-2 rounded-full border-black/10 bg-white/80 px-4" onClick={handleManualParse}>Parse</Button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}

        {/* STEP 2 — PREVIEW */}
        {step === "preview" && (
          <div className="space-y-4 mt-2">
            <div className="max-h-64 overflow-y-auto rounded-[18px] border border-black/10 bg-[#f7f9f8]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white/90">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Phone</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, 50).map((c, i) => (
                    <tr key={i} className="border-t border-black/5">
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{c.phone}</td>
                      <td className="px-3 py-1.5 text-xs text-foreground">{c.name ?? "—"}</td>
                    </tr>
                  ))}
                  {contacts.length > 50 && (
                    <tr className="border-t border-black/5">
                      <td colSpan={3} className="px-3 py-2 text-center text-xs text-muted-foreground">
                        +{contacts.length - 50} more contacts
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="rounded-full border-black/10 bg-white/80 px-4" onClick={() => { setStep("upload"); setContacts([]); }}>Back</Button>
              <Button
                disabled={loading}
                className="rounded-full bg-[#255561] px-4 text-white hover:bg-[#1f4954]"
                onClick={handleRunBatch}
              >
                <Play className="mr-1 h-4 w-4" />
                {loading ? "Starting..." : `Run Batch (${contacts.length} calls)`}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — DONE */}
        {step === "done" && result && (
          <div className="space-y-4 mt-2 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#1f5b48]" />
            <div>
              <p className="font-semibold text-foreground">{result.leads_created} leads added</p>
              {result.bolna_batch_id && (
                <p className="mt-1 text-xs text-muted-foreground">Bolna Batch ID: <code className="rounded bg-[#f4f7f6] px-1 py-0.5">{result.bolna_batch_id}</code></p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
            </div>
            <Button className="rounded-full bg-[#255561] px-4 text-white hover:bg-[#1f4954]" onClick={() => { resetState(); onClose(); onDone(); }}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchCampaignId, setBatchCampaignId] = useState<number | null>(null);
  const [retriggeringCampaignId, setRetriggeringCampaignId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchCampaigns();
      setCampaigns(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRetriggerCampaign = useCallback(async (campaignId: number) => {
    setActionError(null);
    setActionNotice(null);
    setRetriggeringCampaignId(campaignId);

    try {
      const result = await retriggerCampaign(campaignId);
      setActionNotice(result.message);
      await load();
    } catch (e) {
      setActionNotice(null);
      setActionError(e instanceof Error ? e.message : "Failed to re-trigger campaign");
    } finally {
      setRetriggeringCampaignId(null);
    }
  }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="page-kicker">Outreach Programs</span>
          <h1 className="page-title pt-3">Campaigns</h1>
          <p className="page-copy mt-3">Create outbound programs, stage uploads, and monitor the path from calls to qualified leads.</p>
        </div>
        <NewCampaignDialog onCreated={load} />
      </div>

      {actionError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      {actionNotice && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionNotice}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="glass-panel h-64 animate-pulse" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-panel py-20 text-center text-muted-foreground">
          <Users className="mx-auto mb-4 h-10 w-10 opacity-30" />
          <p className="text-sm">No campaigns yet. Create one to start calling leads.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onRunBatch={setBatchCampaignId}
              onRetrigger={handleRetriggerCampaign}
              retriggering={retriggeringCampaignId === c.id}
            />
          ))}
        </div>
      )}

      {batchCampaignId && (
        <BatchUploadDialog
          campaignId={batchCampaignId}
          open={true}
          onClose={() => setBatchCampaignId(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
