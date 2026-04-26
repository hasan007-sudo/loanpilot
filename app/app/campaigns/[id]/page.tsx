import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaign, getLeads } from "@/lib/data";
import { StatusBadge } from "@/components/StatusBadge";
import { CampaignRetriggerButton } from "@/components/CampaignRetriggerButton";
import { AddLeadButton } from "@/components/AddLeadButton";
import { LeadsTable } from "@/components/LeadsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, PhoneCall, BadgeCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const campaignId = Number(id);

  if (!Number.isFinite(campaignId)) notFound();

  const campaign = await getCampaign(campaignId);
  if (!campaign) notFound();

  const leads = await getLeads({ campaign_id: campaign.id });

  return (
    <div>
      <Link href="/campaigns">
        <Button
          variant="ghost"
          size="sm"
          className="mb-5 rounded-full bg-white/55 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-white/75 hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Campaigns
        </Button>
      </Link>

      <div className="glass-panel mb-6 px-6 py-6">
        <div className="page-header mb-0">
          <div>
            <span className="page-kicker">Campaign Detail</span>
            <h1 className="page-title pt-3">{campaign.name}</h1>
            <p className="page-copy mt-3">
              {campaign.bankName ?? "Bank campaign"} with {leads.length} lead{leads.length === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <StatusBadge value={campaign.status} />
            <div className="flex gap-2">
              {campaign.status !== "completed" && (
                <AddLeadButton campaignId={campaign.id} />
              )}
              <CampaignRetriggerButton campaignId={campaign.id} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-black/5 bg-white/60 px-4 py-4">
            <p className="field-label">Total Leads</p>
            <div className="mt-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-semibold text-foreground">{leads.length}</p>
            </div>
          </div>
          <div className="rounded-[18px] border border-black/5 bg-white/60 px-4 py-4">
            <p className="field-label">Called</p>
            <div className="mt-3 flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-semibold text-foreground">{campaign.calledCount}</p>
            </div>
          </div>
          <div className="rounded-[18px] border border-black/5 bg-white/60 px-4 py-4">
            <p className="field-label">Qualified</p>
            <div className="mt-3 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-semibold text-foreground">{campaign.qualifiedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="glass-panel border-white/75 bg-white/72 py-0">
        <CardHeader className="gap-3 border-b border-black/5 px-5 pb-5 pt-5">
          <span className="page-kicker">Campaign Leads</span>
          <CardTitle className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">
            Lead List
          </CardTitle>
          <p className="text-sm text-muted-foreground">{leads.length} records in this campaign</p>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-5">
          <LeadsTable leads={leads} />
        </CardContent>
      </Card>
    </div>
  );
}
