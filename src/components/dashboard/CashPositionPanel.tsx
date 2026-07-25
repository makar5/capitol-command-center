import { formatCurrency, formatDate } from "@/lib/format";
import {
  averageDaysSubmittedToPaid,
  payAppAmountCents,
  type ProgressPayApp,
} from "@/lib/progress";
import { PayApplicationStatus } from "@/lib/constants";
import { StatusChip } from "@/components/ui/StatusChip";

type CashPayApp = {
  id: string;
  number: number;
  status: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  submittedAt?: Date | string | null;
  approvedAt?: Date | string | null;
  paidAt?: Date | string | null;
  lines: ProgressPayApp["lines"];
};

function asDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

export function CashPositionPanel({
  payApplications,
}: {
  payApplications: CashPayApp[];
}) {
  const normalized: ProgressPayApp[] = payApplications.map((app) => ({
    ...app,
    periodStart: asDate(app.periodStart),
    periodEnd: asDate(app.periodEnd),
    submittedAt: app.submittedAt ? asDate(app.submittedAt) : null,
    approvedAt: app.approvedAt ? asDate(app.approvedAt) : null,
    paidAt: app.paidAt ? asDate(app.paidAt) : null,
  }));
  const sorted = [...normalized].sort((a, b) => a.number - b.number);
  const avgDays = averageDaysSubmittedToPaid(sorted);
  const draft = sorted.find((a) => a.status === PayApplicationStatus.DRAFT);
  const draftAmount = draft ? payAppAmountCents(draft) : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Cash position</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Pay application cycle and draft amount
        </p>
      </div>

      <div className="border-b border-slate-100 bg-sky-callout/50 px-4 py-4">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">
          Average days submitted → paid
        </div>
        <div className="num mt-1 text-3xl font-semibold text-ink">
          {avgDays != null ? avgDays : "—"}
          {avgDays != null ? (
            <span className="ml-1 text-base font-medium text-slate-500">days</span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Evidence completeness drives this number.
        </p>
      </div>

      {draft ? (
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="text-xs text-slate-500">
            Current draft · App #{draft.number}
          </div>
          <div className="num mt-0.5 text-lg font-semibold text-ink">
            {formatCurrency(draftAmount)}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-table">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Period</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Submitted</th>
              <th className="px-4 py-2 font-medium">Approved</th>
              <th className="px-4 py-2 font-medium">Paid</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((app) => (
              <tr key={app.id} className="border-t border-slate-100">
                <td className="num px-4 py-2">{app.number}</td>
                <td className="num px-4 py-2 text-slate-600">
                  {formatDate(app.periodStart)} – {formatDate(app.periodEnd)}
                </td>
                <td className="num px-4 py-2 text-right">
                  {formatCurrency(payAppAmountCents(app))}
                </td>
                <td className="px-4 py-2">
                  <StatusChip tone={app.status}>
                    {app.status.toLowerCase()}
                  </StatusChip>
                </td>
                <td className="num px-4 py-2 text-slate-600">
                  {app.submittedAt ? formatDate(app.submittedAt) : "—"}
                </td>
                <td className="num px-4 py-2 text-slate-600">
                  {app.approvedAt ? formatDate(app.approvedAt) : "—"}
                </td>
                <td className="num px-4 py-2 text-slate-600">
                  {app.paidAt ? formatDate(app.paidAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
