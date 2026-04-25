"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLeadDetails, type LeadDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

function toNumberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function LeadDetailsEditor({ lead }: { lead: LeadDetail }) {
  const [name, setName] = useState(lead.name ?? "");
  const [phone, setPhone] = useState(lead.phone);
  const [loanType, setLoanType] = useState(lead.loanType ?? "");
  const [loanAmount, setLoanAmount] = useState(lead.loanAmount?.toString() ?? "");
  const [monthlyIncome, setMonthlyIncome] = useState(lead.monthlyIncome?.toString() ?? "");
  const [employmentType, setEmploymentType] = useState(lead.employmentType ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const payload = {
      name: name.trim() || null,
      phone: phone.trim(),
      loanType: loanType.trim() || null,
      employmentType: employmentType.trim() || null,
      loanAmount: toNumberOrNull(loanAmount),
      monthlyIncome: toNumberOrNull(monthlyIncome),
    };

    if (!payload.phone) {
      setLoading(false);
      setError("Phone number is required");
      return;
    }

    try {
      await updateLeadDetails(lead.id, payload);
      setNotice("Lead details updated");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update details");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-[14px] border border-black/10 bg-white/80 px-3 text-sm text-foreground outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Phone Number
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11 rounded-[14px] border border-black/10 bg-white/80 px-3 text-sm text-foreground outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]"
            required
          />
        </label>

        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Loan Type
          <input
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className="h-11 rounded-[14px] border border-black/10 bg-white/80 px-3 text-sm text-foreground outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Employment Type
          <input
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="h-11 rounded-[14px] border border-black/10 bg-white/80 px-3 text-sm text-foreground outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Loan Amount
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="h-11 rounded-[14px] border border-black/10 bg-white/80 px-3 text-sm text-foreground outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Monthly Income
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            className="h-11 rounded-[14px] border border-black/10 bg-white/80 px-3 text-sm text-foreground outline-none focus:border-[#4f8487] focus:ring-2 focus:ring-[#d3e8e7]"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs">
          {error && <p className="text-red-700">{error}</p>}
          {notice && <p className="text-emerald-700">{notice}</p>}
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-10 rounded-full bg-[#255561] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#1f4954]"
        >
          <Save className="mr-1 h-3.5 w-3.5" />
          {loading ? "Saving..." : "Save Details"}
        </Button>
      </div>
    </form>
  );
}
