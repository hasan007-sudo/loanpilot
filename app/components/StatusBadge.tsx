import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Bolna-set statuses
  called:           { label: "Called",            className: "bg-gray-100 text-gray-700 border-gray-200" },
  not_interested:   { label: "Not Interested",    className: "bg-red-100 text-red-800 border-red-200" },
  interested:       { label: "Showed Interest",   className: "bg-blue-100 text-blue-800 border-blue-200" },
  pre_qualified:    { label: "Pre-Qualified",     className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  // Manager-set statuses
  processing_loan:  { label: "Processing Loan",   className: "bg-amber-100 text-amber-800 border-amber-200" },
  approval_pending: { label: "Approval Pending",  className: "bg-orange-100 text-orange-800 border-orange-200" },
  passed_to_rm:     { label: "Passed to RM",      className: "bg-purple-100 text-purple-800 border-purple-200" },
  loan_approved:    { label: "Loan Approved",     className: "bg-green-100 text-green-800 border-green-200" },
  loan_rejected:    { label: "Loan Rejected",     className: "bg-red-100 text-red-800 border-red-200" },
  // Eligibility
  eligible:         { label: "Eligible",          className: "bg-green-100 text-green-800 border-green-200" },
  ineligible:       { label: "Ineligible",        className: "bg-red-100 text-red-800 border-red-200" },
  review_needed:    { label: "Review Needed",     className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  pending:          { label: "Pending",           className: "bg-gray-100 text-gray-700 border-gray-200" },
  // Campaign
  running:          { label: "Running",           className: "bg-blue-100 text-blue-800 border-blue-200" },
  completed:        { label: "Completed",         className: "bg-green-100 text-green-800 border-green-200" },
  draft:            { label: "Draft",             className: "bg-gray-100 text-gray-700 border-gray-200" },
};

export function StatusBadge({ value }: { value: string }) {
  const config = STATUS_CONFIG[value] ?? { label: value, className: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
