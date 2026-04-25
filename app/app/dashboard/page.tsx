import { getDashboardStats, getLeads } from "@/lib/data";
import { StatsCards } from "@/components/StatsCards";
import { LeadQualificationChart } from "@/components/LeadQualificationChart";

export default async function DashboardPage() {
  const [stats, leads] = await Promise.all([
    getDashboardStats(),
    getLeads(),
  ]);

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="page-kicker">Control Center</span>
          <h1 className="page-title pt-3">Dashboard</h1>
          <p className="page-copy mt-3">
            A live qualification view for bank outreach teams, combining call velocity with category-level lead inspection.
          </p>
        </div>

        <div className="glass-panel flex flex-wrap gap-3 px-3.5 py-3 text-sm text-foreground">
          <div>
            <p className="field-label">Portfolio</p>
            <p className="mt-1.5 font-heading text-[2rem] leading-none">{leads.length}</p>
          </div>
          <div className="h-12 w-px bg-black/6" />
          <div>
            <p className="field-label">Not Interested</p>
            <p className="mt-1.5 font-heading text-[2rem] leading-none">{stats.not_interested}</p>
          </div>
        </div>
      </div>

      <StatsCards stats={stats} />
      <LeadQualificationChart leads={leads} />
    </div>
  );
}
