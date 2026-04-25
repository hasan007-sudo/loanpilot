"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import type { Lead } from "@/lib/api";

const LOAN_COLORS: Record<string, string> = {
  home: "bg-blue-100 text-blue-700",
  personal: "bg-purple-100 text-purple-700",
  business: "bg-orange-100 text-orange-700",
  auto: "bg-teal-100 text-teal-700",
};

function formatINR(amount: number | null) {
  if (!amount) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

const PAGE_SIZE = 20;

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [page, setPage] = useState(0);
  const total = leads.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const slice = leads.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white/72 shadow-[0_20px_50px_-36px_rgba(18,33,40,0.35)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[rgba(34,85,96,0.06)]">
              <TableHead className="h-14 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Name / Phone</TableHead>
              <TableHead className="h-14 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Loan Type</TableHead>
              <TableHead className="h-14 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Amount</TableHead>
              <TableHead className="h-14 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Income/mo</TableHead>
              <TableHead className="h-14 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Employment</TableHead>
              <TableHead className="h-14 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</TableHead>
              <TableHead className="h-14 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Eligibility</TableHead>
              <TableHead className="h-14 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No leads found. Run a campaign to start calling customers.
                </TableCell>
              </TableRow>
            )}
            {slice.map((lead) => (
              <TableRow key={lead.id} className="border-black/5 hover:bg-white/60">
                <TableCell className="px-4 py-4">
                  <div className="font-medium text-[0.98rem] text-foreground">{lead.name ?? "—"}</div>
                  <div className="mt-1 text-xs font-medium tracking-[0.05em] text-muted-foreground">{lead.phone}</div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  {lead.loanType ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${LOAN_COLORS[lead.loanType] ?? "bg-gray-100 text-gray-600"}`}>
                      {lead.loanType.charAt(0).toUpperCase() + lead.loanType.slice(1)}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm font-medium text-foreground">{formatINR(lead.loanAmount)}</TableCell>
                <TableCell className="px-4 py-4 text-sm text-foreground">
                  {lead.monthlyIncome ? `₹${lead.monthlyIncome.toLocaleString("en-IN")}` : "—"}
                </TableCell>
                <TableCell className="px-4 py-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {lead.employmentType?.replace("_", " ") ?? "—"}
                </TableCell>
                <TableCell className="px-4 py-4"><StatusBadge value={lead.status} /></TableCell>
                <TableCell className="px-4 py-4"><StatusBadge value={lead.eligibility} /></TableCell>
                <TableCell className="px-4 py-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Link href={`/leads/${lead.id}`} className="inline-flex">
                    <Button variant="outline" size="sm" className="rounded-full border-black/10 bg-white/80 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground hover:bg-white">
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full border-black/10 bg-white/65 px-4" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" className="rounded-full border-black/10 bg-white/65 px-4" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
