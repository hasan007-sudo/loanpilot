"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchCampaigns, createCampaign, startCampaignBatch } from "@/lib/api";
import type { Campaign } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Upload, Play, CheckCircle2 } from "lucide-react";

// ── Campaign Card ──────────────────────────────────────────────────────────────
function CampaignCard({ campaign, onRunBatch }: { campaign: Campaign; onRunBatch: (id: number) => void }) {
  const pct = campaign.totalLeads > 0
    ? Math.round((campaign.calledCount / campaign.totalLeads) * 100)
    : 0;

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">{campaign.name}</CardTitle>
            {campaign.bankName && <p className="text-xs text-gray-400 mt-0.5">{campaign.bankName}</p>}
          </div>
          <StatusBadge value={campaign.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{campaign.calledCount} called</span>
            <span>{campaign.totalLeads} total</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div>
            <p className="text-lg font-bold text-gray-900">{campaign.calledCount}</p>
            <p className="text-xs text-gray-400">Called</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{campaign.interestedCount}</p>
            <p className="text-xs text-gray-400">Interested</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{campaign.qualifiedCount}</p>
            <p className="text-xs text-gray-400">Qualified</p>
          </div>
        </div>

        {campaign.status === "draft" && (
          <Button
            size="sm"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            onClick={() => onRunBatch(campaign.id)}
          >
            <Play className="w-3 h-3 mr-1" /> Upload & Run Batch
          </Button>
        )}

        <p className="text-xs text-gray-400 mt-2">
          Created {new Date(campaign.createdAt).toLocaleDateString("en-IN")}
        </p>
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
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-1" /> New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Campaign Name *</label>
            <input required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Q2 Home Loan Drive"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Bank Name</label>
            <input value={form.bank_name}
              onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
              placeholder="Apex Bank"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Click to upload CSV</p>
              <p className="text-xs text-gray-400 mt-1">Format: <code className="bg-gray-100 px-1 rounded">contact_number,first_name</code></p>
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
                className="w-full text-xs font-mono border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button size="sm" variant="outline" className="mt-2" onClick={handleManualParse}>Parse</Button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}

        {/* STEP 2 — PREVIEW */}
        {step === "preview" && (
          <div className="space-y-4 mt-2">
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">#</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Phone</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, 50).map((c, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-1.5 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-3 py-1.5 text-xs font-mono">{c.phone}</td>
                      <td className="px-3 py-1.5 text-xs text-gray-600">{c.name ?? "—"}</td>
                    </tr>
                  ))}
                  {contacts.length > 50 && (
                    <tr className="border-t border-gray-100">
                      <td colSpan={3} className="px-3 py-2 text-xs text-gray-400 text-center">
                        +{contacts.length - 50} more contacts
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setStep("upload"); setContacts([]); }}>Back</Button>
              <Button
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleRunBatch}
              >
                <Play className="w-4 h-4 mr-1" />
                {loading ? "Starting..." : `Run Batch (${contacts.length} calls)`}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — DONE */}
        {step === "done" && result && (
          <div className="space-y-4 mt-2 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <p className="font-semibold text-gray-900">{result.leads_created} leads added</p>
              {result.bolna_batch_id && (
                <p className="text-xs text-gray-500 mt-1">Bolna Batch ID: <code className="bg-gray-100 px-1 rounded">{result.bolna_batch_id}</code></p>
              )}
              <p className="text-sm text-gray-600 mt-2">{result.message}</p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => { resetState(); onClose(); onDone(); }}>
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

  const load = useCallback(async () => {
    try {
      const data = await fetchCampaigns();
      setCampaigns(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Create outbound campaigns and trigger Bolna batch calls</p>
        </div>
        <NewCampaignDialog onCreated={load} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No campaigns yet. Create one to start calling leads.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c} onRunBatch={setBatchCampaignId} />
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
