"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retriggerCampaign } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function CampaignRetriggerButton({ campaignId }: { campaignId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  async function handleRetrigger() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const res = await retriggerCampaign(campaignId);
      setNotice(res.message);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to re-trigger campaign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleRetrigger}
        disabled={loading}
        className="h-11 rounded-full bg-[#255561] px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#1f4954]"
      >
        <RotateCcw className={`mr-1 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Re-triggering..." : "Re-trigger Calls"}
      </Button>

      {error && (
        <p className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p>
      )}
      {notice && (
        <p className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">{notice}</p>
      )}
    </div>
  );
}
