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
        className="flex items-center gap-2"
      >
        <StatusBadge value={status} />
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <p className="text-xs text-gray-400 px-3 py-1.5 font-medium uppercase tracking-wide">Update Status</p>
          {LEAD_STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{label}</span>
              {value === status && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
