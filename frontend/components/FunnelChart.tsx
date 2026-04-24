import type { DashboardStats } from "@/lib/api";

interface FunnelStage {
  label: string;
  count: number;
  color: string;
  widthClass: string;
}

export function FunnelChart({ stats }: { stats: DashboardStats }) {
  const stages: FunnelStage[] = [
    { label: "Called", count: stats.total_called, color: "bg-gray-400", widthClass: "w-full" },
    { label: "Interested", count: stats.interested, color: "bg-blue-500", widthClass: "w-4/5" },
    { label: "Pre-Qualified", count: stats.qualified, color: "bg-green-500", widthClass: "w-3/5" },
    { label: "Not Interested", count: stats.not_interested, color: "bg-red-400", widthClass: "w-2/5" },
  ];

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const prev = i === 0 ? null : stages[i - 1].count;
        const pct = prev && prev > 0 ? ((stage.count / prev) * 100).toFixed(0) : null;
        return (
          <div key={stage.label} className="flex items-center gap-3">
            <div className="w-28 text-right text-xs text-gray-500 shrink-0">{stage.label}</div>
            <div className="flex-1">
              <div className={`${stage.widthClass} mx-auto`}>
                <div className={`${stage.color} rounded text-white text-xs font-medium px-3 py-1.5 flex justify-between items-center`}>
                  <span>{stage.count.toLocaleString()}</span>
                  {pct && <span className="opacity-80">{pct}% of prev</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
