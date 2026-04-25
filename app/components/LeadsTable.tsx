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
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-600">Name / Phone</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Loan Type</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Amount</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Income/mo</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Employment</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Eligibility</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                  No leads found. Run a campaign to start calling customers.
                </TableCell>
              </TableRow>
            )}
            {slice.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium text-sm text-gray-900">{lead.name ?? "—"}</div>
                  <div className="text-xs text-gray-400">{lead.phone}</div>
                </TableCell>
                <TableCell>
                  {lead.loanType ? (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${LOAN_COLORS[lead.loanType] ?? "bg-gray-100 text-gray-600"}`}>
                      {lead.loanType.charAt(0).toUpperCase() + lead.loanType.slice(1)}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-700">{formatINR(lead.loanAmount)}</TableCell>
                <TableCell className="text-sm text-gray-700">
                  {lead.monthlyIncome ? `₹${lead.monthlyIncome.toLocaleString("en-IN")}` : "—"}
                </TableCell>
                <TableCell className="text-xs text-gray-600 capitalize">
                  {lead.employmentType?.replace("_", " ") ?? "—"}
                </TableCell>
                <TableCell><StatusBadge value={lead.status} /></TableCell>
                <TableCell><StatusBadge value={lead.eligibility} /></TableCell>
                <TableCell className="text-xs text-gray-400">
                  {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                </TableCell>
                <TableCell>
                  <Link href={`/leads/${lead.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
