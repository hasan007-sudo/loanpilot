import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pre_qualified: { label: "Pre-Qualified", className: "bg-green-100 text-green-800 border-green-200" },
  interested: { label: "Interested", className: "bg-blue-100 text-blue-800 border-blue-200" },
  called: { label: "Called", className: "bg-gray-100 text-gray-700 border-gray-200" },
  not_interested: { label: "Not Interested", className: "bg-red-100 text-red-800 border-red-200" },
  passed_to_rm: { label: "Passed to RM", className: "bg-purple-100 text-purple-800 border-purple-200" },
  eligible: { label: "Eligible", className: "bg-green-100 text-green-800 border-green-200" },
  ineligible: { label: "Ineligible", className: "bg-red-100 text-red-800 border-red-200" },
  review_needed: { label: "Review Needed", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  pending: { label: "Pending", className: "bg-gray-100 text-gray-700 border-gray-200" },
  running: { label: "Running", className: "bg-blue-100 text-blue-800 border-blue-200" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800 border-green-200" },
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

export function StatusBadge({ value }: { value: string }) {
  const config = STATUS_CONFIG[value] ?? { label: value, className: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
