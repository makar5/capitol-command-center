import type { ReactNode } from "react";

const styles: Record<string, string> = {
  verified: "bg-emerald-50 text-status-verified ring-emerald-200",
  paid: "bg-emerald-50 text-status-paid ring-emerald-200",
  approved: "bg-emerald-50 text-status-verified ring-emerald-200",
  pass: "bg-emerald-50 text-status-verified ring-emerald-200",
  complete: "bg-emerald-50 text-status-verified ring-emerald-200",
  "at-risk": "bg-amber-50 text-status-atrisk ring-amber-200",
  atrisk: "bg-amber-50 text-status-atrisk ring-amber-200",
  warning: "bg-amber-50 text-status-atrisk ring-amber-200",
  submitted: "bg-sky-callout text-navy-header ring-sky-200",
  "in-progress": "bg-sky-callout text-navy-header ring-sky-200",
  issued: "bg-sky-callout text-navy-header ring-sky-200",
  proposed: "bg-slate-100 text-status-draft ring-slate-200",
  draft: "bg-slate-100 text-status-draft ring-slate-200",
  pending: "bg-slate-100 text-status-draft ring-slate-200",
  deficient: "bg-red-50 text-status-deficient ring-red-200",
  overdue: "bg-red-50 text-status-overdue ring-red-200",
  rejected: "bg-red-50 text-status-deficient ring-red-200",
  fail: "bg-red-50 text-status-deficient ring-red-200",
  critical: "bg-red-50 text-status-deficient ring-red-200",
  info: "bg-slate-100 text-slate-700 ring-slate-200",
  active: "bg-emerald-50 text-status-verified ring-emerald-200",
};

function normalize(tone: string): string {
  return tone.toLowerCase().replace(/_/g, "-");
}

export function StatusChip({
  tone,
  children,
}: {
  tone: string;
  children: ReactNode;
}) {
  const key = normalize(tone);
  const cls = styles[key] ?? styles.draft!;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {children}
    </span>
  );
}
