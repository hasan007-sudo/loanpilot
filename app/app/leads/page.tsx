import { Suspense } from "react";
import { getLeads } from "@/lib/data";
import { LeadFilters } from "@/components/LeadFilters";
import { LeadsTable } from "@/components/LeadsTable";
import { LEAD_STATUSES } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{ status?: string; loan_type?: string }>;
}

const LOAN_TYPES = [
  { value: "home", label: "Home" },
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
  { value: "auto", label: "Auto" },
];

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const leads = await getLeads({ status: params.status, loan_type: params.loan_type });

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="page-kicker">Lead Registry</span>
          <h1 className="page-title pt-3">Leads</h1>
          <p className="page-copy mt-3">
            Browse qualified contacts, narrow by loan intent, and move directly into the full customer record.
          </p>
        </div>

        <div className="glass-panel flex items-center gap-3 px-3.5 py-3">
          <div>
            <p className="field-label">Visible Leads</p>
            <p className="mt-1.5 font-heading text-[2rem] leading-none text-foreground">{leads.length}</p>
          </div>
          {(params.status || params.loan_type) && (
            <>
              <div className="h-12 w-px bg-black/6" />
              <div className="max-w-52">
                <p className="field-label">Filters</p>
                <p className="mt-1.5 text-[0.82rem] font-medium text-foreground">
                  {[params.status, params.loan_type].filter(Boolean).join(" · ")}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <Card className="glass-panel border-white/75 bg-white/72 py-0">
        <CardHeader className="gap-5 border-b border-black/5 px-5 pb-5 pt-5 md:flex md:flex-row md:items-end md:justify-between">
          <div>
            <span className="page-kicker">Filter Console</span>
            <CardTitle className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">Lead List</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{leads.length} total records</p>
          </div>

          <LeadFilters
            status={params.status ?? ""}
            loanType={params.loan_type ?? ""}
            statuses={LEAD_STATUSES}
            loanTypes={LOAN_TYPES}
          />
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-5">
          <Suspense fallback={<Skeleton className="h-64 m-4" />}>
            <LeadsTable leads={leads} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
