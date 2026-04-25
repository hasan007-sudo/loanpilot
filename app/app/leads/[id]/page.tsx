import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { ConversationSummary } from "@/components/ConversationSummary";
import { LeadStatusUpdater } from "@/components/LeadStatusUpdater";
import { LeadDetailsEditor } from "@/components/LeadDetailsEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone, CircleDollarSign, BriefcaseBusiness, CalendarClock } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatINR(amount: number | null) {
  if (!amount) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const lead = await getLead(Number(id));
  if (!lead) notFound();

  const fields = [
    { label: "Phone", value: lead.phone, icon: Phone },
    { label: "Loan Amount", value: formatINR(lead.loanAmount), icon: CircleDollarSign },
    { label: "Monthly Income", value: lead.monthlyIncome ? `₹${lead.monthlyIncome.toLocaleString("en-IN")}` : "—", icon: CircleDollarSign },
    { label: "Employment", value: lead.employmentType?.replace("_", " ") ?? "—", icon: BriefcaseBusiness },
    { label: "Bolna Call ID", value: lead.bolnaCallId ?? "—", icon: Phone },
    { label: "Created", value: new Date(lead.createdAt).toLocaleString("en-IN"), icon: CalendarClock },
  ];

  return (
    <div className="max-w-6xl">
      <Link href="/leads">
        <Button variant="ghost" size="sm" className="mb-5 rounded-full bg-white/55 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-white/75 hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Leads
        </Button>
      </Link>

      <div className="glass-panel mb-6 px-6 py-6">
        <div className="page-header mb-0">
          <div>
            <span className="page-kicker">Lead Dossier</span>
            <h1 className="page-title pt-3">{lead.name ?? lead.phone}</h1>
            <p className="page-copy mt-3">
              {lead.loanType ? `${lead.loanType.charAt(0).toUpperCase()}${lead.loanType.slice(1)} loan inquiry` : "Loan inquiry"}
              {" "}from {lead.phone}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge value={lead.eligibility} />
            <LeadStatusUpdater leadId={lead.id} currentStatus={lead.status} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-black/5 bg-white/60 px-4 py-4">
            <p className="field-label">Current Status</p>
            <div className="mt-3"><StatusBadge value={lead.status} /></div>
          </div>
          <div className="rounded-[18px] border border-black/5 bg-white/60 px-4 py-4">
            <p className="field-label">Loan Type</p>
            <p className="mt-3 text-lg font-medium text-foreground">
              {lead.loanType ? lead.loanType.charAt(0).toUpperCase() + lead.loanType.slice(1) : "—"}
            </p>
          </div>
          <div className="rounded-[18px] border border-black/5 bg-white/60 px-4 py-4">
            <p className="field-label">Campaign</p>
            <p className="mt-3 text-lg font-medium text-foreground">
              {lead.campaignId ? `Campaign #${lead.campaignId}` : "Direct / Unassigned"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="glass-panel border-white/80 bg-white/72 py-0">
          <CardHeader className="border-b border-black/5 px-5 pb-4 pt-5">
            <span className="page-kicker">Admin Controls</span>
            <CardTitle className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">Update Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-5">
            <LeadDetailsEditor lead={lead} />
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/80 bg-white/72 py-0">
          <CardHeader className="border-b border-black/5 px-5 pb-4 pt-5">
            <span className="page-kicker">Structured Profile</span>
            <CardTitle className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-5">
            <dl className="grid gap-3 md:grid-cols-2">
              {fields.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-[18px] border border-black/5 bg-white/55 px-4 py-4">
                  <dt className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </dt>
                  <dd className="mt-3 text-sm font-medium capitalize text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <ConversationSummary summary={lead.summary} />
      </div>

      {lead.callTranscript && (
        <Card className="glass-panel border-white/80 bg-white/72 py-0">
          <CardHeader className="border-b border-black/5 px-5 pb-4 pt-5">
            <span className="page-kicker">Conversation Archive</span>
            <CardTitle className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">Call Transcript</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-5">
            <details>
              <summary className="mb-3 cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-[#255561]">
                Show raw transcript
              </summary>
              <pre className="max-h-96 overflow-auto rounded-[18px] bg-[#eff3f2] p-4 font-mono text-xs leading-relaxed text-[#324851] whitespace-pre-wrap">
                {lead.callTranscript}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
