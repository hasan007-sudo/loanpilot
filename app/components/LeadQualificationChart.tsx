"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Phone } from "lucide-react";
import type { Lead } from "@/lib/api";
import { LEAD_STATUSES } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";

const CATEGORY_STYLES = [
  {
    bar: "from-[#336f78] to-[#5aa4a3]",
    tint: "bg-[#d9ece8]",
    text: "text-[#234f58]",
    border: "border-[#bedfd7]",
  },
  {
    bar: "from-[#b36d34] to-[#dca34e]",
    tint: "bg-[#f7e2c4]",
    text: "text-[#955825]",
    border: "border-[#efcf9c]",
  },
  {
    bar: "from-[#b24f46] to-[#df7d73]",
    tint: "bg-[#f6d8d4]",
    text: "text-[#903a34]",
    border: "border-[#e8b5ae]",
  },
  {
    bar: "from-[#5e4d8c] to-[#8670c2]",
    tint: "bg-[#e8dff8]",
    text: "text-[#54417f]",
    border: "border-[#d1c2ee]",
  },
  {
    bar: "from-[#5d7265] to-[#89a38c]",
    tint: "bg-[#dde8dd]",
    text: "text-[#4f6256]",
    border: "border-[#cadacb]",
  },
  {
    bar: "from-[#395b83] to-[#6594c7]",
    tint: "bg-[#dbe7f5]",
    text: "text-[#325173]",
    border: "border-[#bed0e9]",
  },
];

function formatLoanType(loanType: string | null) {
  if (!loanType) return "Loan type unavailable";
  return `${loanType.charAt(0).toUpperCase()}${loanType.slice(1)} loan`;
}

export function LeadQualificationChart({ leads }: { leads: Lead[] }) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();

    leads.forEach((lead) => {
      counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
    });

    const knownStatuses = LEAD_STATUSES.map((status, index) => ({
      ...status,
      count: counts.get(status.value) ?? 0,
      styles: CATEGORY_STYLES[index % CATEGORY_STYLES.length],
    }));

    const knownValues = new Set(LEAD_STATUSES.map((status) => status.value));
    const unknownStatuses = Array.from(counts.entries())
      .filter(([value]) => !knownValues.has(value))
      .map(([value, count], index) => ({
        value,
        label: value.replaceAll("_", " "),
        count,
        styles: CATEGORY_STYLES[(knownStatuses.length + index) % CATEGORY_STYLES.length],
      }));

    return [...knownStatuses, ...unknownStatuses];
  }, [leads]);

  const initialStatus = categories.find((category) => category.count > 0)?.value ?? "called";
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const selectedCategory =
    categories.find((category) => category.value === selectedStatus) ?? categories[0];
  const selectedLeads = leads.filter((lead) => lead.status === selectedCategory?.value);
  const maxCount = Math.max(...categories.map((category) => category.count), 1);

  return (
    <Card className="glass-panel mb-8 border-white/75 bg-white/72 py-0">
      <CardHeader className="border-b border-black/5 px-5 pb-4 pt-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="page-kicker">Qualification Map</span>
            <CardTitle className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">
              Lead Qualification Categories
            </CardTitle>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Use category volume to inspect lead groups and move quickly into the right customer records.
            </p>
          </div>
          <div className="eyebrow-chip w-fit">
            {leads.length} total leads
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-5">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <div className="space-y-3">
            {categories.map((category) => {
              const active = category.value === selectedCategory?.value;
              const width = `${Math.max((category.count / maxCount) * 100, category.count ? 8 : 0)}%`;

              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedStatus(category.value)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
                    active
                      ? `${category.styles.tint} ${category.styles.border} shadow-[0_18px_40px_-30px_rgba(19,34,39,0.45)]`
                      : "border-black/5 bg-white/55 hover:bg-white/72"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-base font-medium capitalize text-foreground">
                      {category.label}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        active ? category.styles.text : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {category.count}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${category.styles.bar}`}
                        style={{ width }}
                      />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {Math.round((category.count / maxCount) * 100) || 0}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(246,248,247,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <div className="flex items-start justify-between gap-3 border-b border-black/5 p-5">
              <div>
                <p className="page-kicker">Inspection Queue</p>
                <h3 className="pt-2 font-heading text-3xl leading-none font-medium text-foreground">
                  {selectedCategory?.label ?? "Leads"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedLeads.length} matching {selectedLeads.length === 1 ? "lead" : "leads"}
                </p>
              </div>
              {selectedCategory && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${selectedCategory.styles.tint} ${selectedCategory.styles.text}`}>
                  {selectedCategory.count}
                </span>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
              {selectedLeads.length === 0 ? (
                <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  No leads in this category yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex items-center justify-between gap-3 rounded-[18px] border border-transparent bg-white/65 p-4 transition-all hover:border-black/5 hover:bg-white"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-base font-medium text-foreground">
                            {lead.name ?? "Unnamed lead"}
                          </p>
                          <StatusBadge value={lead.eligibility} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                          <span>{formatLoanType(lead.loanType)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
