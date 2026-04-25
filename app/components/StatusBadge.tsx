import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Bolna-set statuses
  called:           { label: "Called",            className: "bg-[#dce8ea] text-[#244a55] border-[#bdd3d8]" },
  not_interested:   { label: "Not Interested",    className: "bg-[#f6d8d4] text-[#8d3530] border-[#e9b7b2]" },
  interested:       { label: "Showed Interest",   className: "bg-[#f4e0c8] text-[#93511e] border-[#e7c89f]" },
  pre_qualified:    { label: "Pre-Qualified",     className: "bg-[#d7efe4] text-[#1f5b48] border-[#b8dccf]" },
  // Manager-set statuses
  processing_loan:  { label: "Processing Loan",   className: "bg-[#e7ddf8] text-[#55407f] border-[#d2c3ee]" },
  approval_pending: { label: "Approval Pending",  className: "bg-[#efe8da] text-[#746345] border-[#dfd0ae]" },
  passed_to_rm:     { label: "Passed to RM",      className: "bg-[#dae6f4] text-[#35536f] border-[#bfd0e6]" },
  loan_approved:    { label: "Loan Approved",     className: "bg-[#d7efe4] text-[#1f5b48] border-[#b8dccf]" },
  loan_rejected:    { label: "Loan Rejected",     className: "bg-[#f6d8d4] text-[#8d3530] border-[#e9b7b2]" },
  // Eligibility
  eligible:         { label: "Eligible",          className: "bg-[#d7efe4] text-[#1f5b48] border-[#b8dccf]" },
  ineligible:       { label: "Ineligible",        className: "bg-[#f6d8d4] text-[#8d3530] border-[#e9b7b2]" },
  review_needed:    { label: "Review Needed",     className: "bg-[#f6ebcf] text-[#8f6722] border-[#e5d5a9]" },
  pending:          { label: "Pending",           className: "bg-[#e9eeef] text-[#4b5d64] border-[#d1dadd]" },
  // Campaign
  running:          { label: "Running",           className: "bg-[#dae6f4] text-[#35536f] border-[#bfd0e6]" },
  completed:        { label: "Completed",         className: "bg-[#d7efe4] text-[#1f5b48] border-[#b8dccf]" },
  draft:            { label: "Draft",             className: "bg-[#e9eeef] text-[#4b5d64] border-[#d1dadd]" },
};

export function StatusBadge({ value }: { value: string }) {
  const config = STATUS_CONFIG[value] ?? { label: value, className: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${config.className}`}>
      {config.label}
    </Badge>
  );
}
