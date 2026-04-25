import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchLead } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { ConversationSummary } from "@/components/ConversationSummary";
import { LeadStatusUpdater } from "@/components/LeadStatusUpdater";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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
  let lead;
  try {
    lead = await fetchLead(Number(id));
  } catch {
    notFound();
  }

  const fields = [
    { label: "Phone", value: lead.phone },
    { label: "Name", value: lead.name ?? "—" },
    { label: "Loan Type", value: lead.loanType ? lead.loanType.charAt(0).toUpperCase() + lead.loanType.slice(1) : "—" },
    { label: "Loan Amount", value: formatINR(lead.loanAmount) },
    { label: "Monthly Income", value: lead.monthlyIncome ? `₹${lead.monthlyIncome.toLocaleString("en-IN")}` : "—" },
    { label: "Employment", value: lead.employmentType?.replace("_", " ") ?? "—" },
    { label: "Bolna Call ID", value: lead.bolnaCallId ?? "—" },
    { label: "Created", value: new Date(lead.createdAt).toLocaleString("en-IN") },
  ];

  return (
    <div className="max-w-4xl">
      <Link href="/leads">
        <Button variant="ghost" size="sm" className="mb-4 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Leads
        </Button>
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lead.name ?? lead.phone}</h1>
          <p className="text-sm text-gray-500">{lead.phone}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusBadge value={lead.eligibility} />
          <LeadStatusUpdater leadId={lead.id} currentStatus={lead.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Lead Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {fields.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt>
                  <dd className="text-sm text-gray-800 font-medium capitalize mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <ConversationSummary summary={lead.summary} />
      </div>

      {lead.callTranscript && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Call Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <details>
              <summary className="text-xs text-indigo-600 cursor-pointer mb-2 font-medium">
                Show raw transcript
              </summary>
              <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-80">
                {lead.callTranscript}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
