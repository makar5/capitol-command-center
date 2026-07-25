import { formatCurrency, formatPercent } from "@/lib/format";

export function HeaderBand({
  contractValueCents,
  billedToDateCents,
  paidToDateCents,
  retainageHeldCents,
  verifiedCompletePct,
  timeElapsedPct,
}: {
  contractValueCents: number;
  billedToDateCents: number;
  paidToDateCents: number;
  retainageHeldCents: number;
  verifiedCompletePct: number;
  timeElapsedPct: number;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 lg:grid-cols-6 lg:divide-y-0">
        <Stat label="Contract value" value={formatCurrency(contractValueCents)} />
        <Stat label="Billed to date" value={formatCurrency(billedToDateCents)} />
        <Stat label="Paid to date" value={formatCurrency(paidToDateCents)} />
        <Stat label="Retainage held" value={formatCurrency(retainageHeldCents)} />
        <Stat
          label="% complete (verified)"
          value={formatPercent(verifiedCompletePct)}
        />
        <Stat label="% time elapsed" value={formatPercent(timeElapsedPct)} />
      </div>
      <div className="border-t border-slate-200 px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>Schedule vs verified progress</span>
          <span className="num">
            time {formatPercent(timeElapsedPct, 0)} · verified{" "}
            {formatPercent(verifiedCompletePct, 0)}
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-slate-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-slate-300"
            style={{ width: `${Math.min(100, timeElapsedPct)}%` }}
            title="Time elapsed"
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-sky"
            style={{ width: `${Math.min(100, verifiedCompletePct)}%` }}
            title="Verified complete"
          />
        </div>
        <div className="mt-1.5 flex gap-4 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Time
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky" /> Verified
          </span>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="num mt-1 text-base font-semibold text-ink">{value}</div>
    </div>
  );
}
