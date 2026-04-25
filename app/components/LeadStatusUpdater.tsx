"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStatus, LEAD_STATUSES } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";

export function LeadStatusUpdater({ leadId, currentStatus }: { leadId: number; currentStatus: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  async function handleSelect(newStatus: string) {
    if (newStatus === status) { setOpen(false); return; }
    setLoading(true);
    try {
      await updateLeadStatus(leadId, newStatus);
      setStatus(newStatus);
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-2 rounded-full border-black/10 bg-white/75 px-3 hover:bg-white"
      >
        <StatusBadge value={status} />
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-[18px] border border-black/5 bg-white/95 py-2 shadow-[0_24px_50px_-28px_rgba(18,33,40,0.4)] backdrop-blur">
          <p className="px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Update Status</p>
          {LEAD_STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-black/3"
            >
              <span>{label}</span>
              {value === status && <Check className="h-3.5 w-3.5 text-[#24616d]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
