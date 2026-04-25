"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface FilterOption {
  value: string;
  label: string;
}

interface LeadFiltersProps {
  loanType: string;
  loanTypes: FilterOption[];
  status: string;
  statuses: FilterOption[];
}

const ALL_STATUSES = "__all_statuses__";
const ALL_LOAN_TYPES = "__all_loan_types__";

export function LeadFilters({
  loanType,
  loanTypes,
  status,
  statuses,
}: LeadFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedLoanType, setSelectedLoanType] = useState(loanType);
  const selectedStatusLabel =
    statuses.find((item) => item.value === selectedStatus)?.label ?? "All statuses";
  const selectedLoanTypeLabel =
    loanTypes.find((item) => item.value === selectedLoanType)?.label ?? "All loan types";

  function handleApply() {
    const params = new URLSearchParams();

    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedLoanType) params.set("loan_type", selectedLoanType);

    const query = params.toString();

    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
        Status
        <Select
          value={selectedStatus || ALL_STATUSES}
          onValueChange={(value) => setSelectedStatus(!value || value === ALL_STATUSES ? "" : value)}
        >
          <SelectTrigger className="h-11 min-w-44 rounded-full border-black/10 bg-white/85 px-4 text-sm font-medium text-foreground">
            <span className="truncate">{selectedStatusLabel}</span>
          </SelectTrigger>
          <SelectContent sideOffset={10} align="start" className="rounded-[18px] border-black/10 bg-white/95 backdrop-blur">
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {statuses.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
        Loan Type
        <Select
          value={selectedLoanType || ALL_LOAN_TYPES}
          onValueChange={(value) => setSelectedLoanType(!value || value === ALL_LOAN_TYPES ? "" : value)}
        >
          <SelectTrigger className="h-11 min-w-44 rounded-full border-black/10 bg-white/85 px-4 text-sm font-medium text-foreground">
            <span className="truncate">{selectedLoanTypeLabel}</span>
          </SelectTrigger>
          <SelectContent sideOffset={10} align="start" className="rounded-[18px] border-black/10 bg-white/95 backdrop-blur">
            <SelectItem value={ALL_LOAN_TYPES}>All loan types</SelectItem>
            {loanTypes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={handleApply}
        className="h-11 rounded-full bg-[#255561] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-[#1f4954]"
      >
        {isPending ? "Applying" : "Apply"}
      </Button>

      {(selectedStatus || selectedLoanType) && (
        <Button
          variant="outline"
          size="sm"
          className="h-11 rounded-full border-black/10 bg-white/75 px-5 text-xs font-semibold uppercase tracking-[0.18em]"
          render={<Link href="/leads" />}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
