"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLead } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";

const LOAN_TYPES = [
  { value: "home_loan", label: "Home Loan" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "car_loan", label: "Car Loan" },
  { value: "business_loan", label: "Business Loan" },
];

const EMPLOYMENT_TYPES = [
  { value: "salaried", label: "Salaried" },
  { value: "self_employed", label: "Self Employed" },
  { value: "business", label: "Business" },
];

const emptyForm = {
  phone: "",
  name: "",
  loanType: "",
  employmentType: "",
  loanAmount: "",
  monthlyIncome: "",
};

export function AddLeadButton({ campaignId }: { campaignId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  function set(field: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createLead({
        phone: form.phone.trim(),
        name: form.name.trim() || undefined,
        campaignId,
        loanType: form.loanType || undefined,
        employmentType: form.employmentType || undefined,
        loanAmount: form.loanAmount ? Number(form.loanAmount) : null,
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : null,
      });
      setOpen(false);
      setForm(emptyForm);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add lead");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 h-12 w-full rounded-[18px] border border-black/10 bg-[#f4f7f6] px-4 text-sm outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]";
  const labelClass = "text-sm font-medium text-foreground";

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setError(null); } }}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full bg-[#255561] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#1f4954]">
          <UserPlus className="mr-1 h-4 w-4" /> Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="page-kicker">Add Lead</span>
          <DialogTitle className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">
            New Lead
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div>
            <label className={labelClass}>Phone *</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Name</label>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="Priya Sharma"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Loan Type</label>
              <select value={form.loanType} onChange={set("loanType")} className={inputClass}>
                <option value="">— Select —</option>
                {LOAN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Employment</label>
              <select value={form.employmentType} onChange={set("employmentType")} className={inputClass}>
                <option value="">— Select —</option>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Loan Amount</label>
              <input
                type="number"
                min={0}
                value={form.loanAmount}
                onChange={set("loanAmount")}
                placeholder="2500000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Monthly Income</label>
              <input
                type="number"
                min={0}
                value={form.monthlyIncome}
                onChange={set("monthlyIncome")}
                placeholder="80000"
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-black/10 bg-white/80 px-4"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#255561] px-4 text-white hover:bg-[#1f4954]"
            >
              {loading ? "Adding..." : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
