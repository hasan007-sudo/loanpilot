import { Suspense } from "react";
import { fetchLeads, fetchDashboardStats } from "@/lib/api";
import { StatsCards } from "@/components/StatsCards";
import { FunnelChart } from "@/components/FunnelChart";
import { LeadsTable } from "@/components/LeadsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{ status?: string; loan_type?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [stats, leads] = await Promise.all([
    fetchDashboardStats(),
    fetchLeads({ status: params.status, loan_type: params.loan_type }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time loan pre-qualification results</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Leads</CardTitle>
            <p className="text-xs text-gray-400">{leads.length} total records</p>
          </CardHeader>
          <CardContent className="p-0">
            <Suspense fallback={<Skeleton className="h-64 m-4" />}>
              <LeadsTable leads={leads} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart stats={stats} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
