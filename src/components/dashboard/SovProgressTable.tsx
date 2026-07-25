import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { SovProgressRow } from "@/lib/progress";

export function SovProgressTable({
  projectId,
  rows,
}: {
  projectId: string;
  rows: SovProgressRow[];
}) {
  const totals = rows.reduce(
    (acc, r) => ({
      scheduled: acc.scheduled + r.scheduledValueCents,
      billed: acc.billed + r.billedToDateCents,
      verified: acc.verified + r.verifiedValueCents,
    }),
    { scheduled: 0, billed: 0, verified: 0 },
  );
  const billedPct =
    totals.scheduled > 0 ? (totals.billed / totals.scheduled) * 100 : 0;
  const verifiedPct =
    totals.scheduled > 0 ? (totals.verified / totals.scheduled) * 100 : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">SOV progress</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Billed vs verified evidence by schedule-of-values line
        </p>
      </div>
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full text-table">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2.5 font-medium">Code</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 text-right font-medium">Scheduled</th>
              <th className="px-4 py-2.5 text-right font-medium">Billed to date</th>
              <th className="px-4 py-2.5 text-right font-medium">Billed %</th>
              <th className="px-4 py-2.5 text-right font-medium">Verified %</th>
              <th className="px-4 py-2.5 font-medium">Variance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sovLineId} className="border-t border-slate-100 hover:bg-sky-callout/40">
                <td className="num px-4 py-2.5 text-slate-600">
                  <Link
                    href={`/projects/${projectId}/work-orders?sovLine=${row.code}`}
                    className="text-sky hover:underline"
                  >
                    {row.code}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/projects/${projectId}/work-orders?sovLine=${row.code}`}
                    className="text-ink hover:underline"
                  >
                    {row.description}
                  </Link>
                </td>
                <td className="num px-4 py-2.5 text-right">
                  {formatCurrency(row.scheduledValueCents)}
                </td>
                <td className="num px-4 py-2.5 text-right">
                  {formatCurrency(row.billedToDateCents)}
                </td>
                <td className="num px-4 py-2.5 text-right">
                  {formatPercent(row.billedPct)}
                </td>
                <td className="num px-4 py-2.5 text-right">
                  {formatPercent(row.verifiedProgressPct)}
                </td>
                <td className="px-4 py-2.5">
                  {row.overEvidence ? (
                    <span className="inline-flex rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-status-atrisk ring-1 ring-inset ring-amber-200">
                      +{Math.round(row.variancePts)} pts over evidence
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 border-t-2 border-slate-200 bg-slate-50 font-medium">
            <tr>
              <td className="px-4 py-2.5" colSpan={2}>
                Totals
              </td>
              <td className="num px-4 py-2.5 text-right">
                {formatCurrency(totals.scheduled)}
              </td>
              <td className="num px-4 py-2.5 text-right">
                {formatCurrency(totals.billed)}
              </td>
              <td className="num px-4 py-2.5 text-right">
                {formatPercent(billedPct)}
              </td>
              <td className="num px-4 py-2.5 text-right">
                {formatPercent(verifiedPct)}
              </td>
              <td className="px-4 py-2.5" />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
