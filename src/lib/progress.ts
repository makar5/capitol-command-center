import { ChangeOrderStatus, PayApplicationStatus, WorkOrderStatus } from "@/lib/constants";

export type ProgressSovLine = {
  id: string;
  code: string;
  description: string;
  scheduledValueCents: number;
  unit?: string | null;
  qtyScheduled?: number | null;
  sortOrder: number;
};

export type ProgressWorkOrder = {
  id: string;
  number: string;
  title: string;
  sovLineId: string;
  status: string;
  qtyClaimed?: number | null;
  qtyVerified?: number | null;
};

export type ProgressPayAppLine = {
  sovLineId: string;
  previousCents: number;
  thisPeriodCents: number;
  storedMaterialsCents: number;
  retainageCents: number;
};

export type ProgressPayApp = {
  id: string;
  number: number;
  status: string;
  periodStart: Date;
  periodEnd: Date;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  paidAt?: Date | null;
  lines: ProgressPayAppLine[];
};

export type ProgressChangeOrder = {
  amountCents: number;
  status: string;
};

export type SovProgressRow = {
  sovLineId: string;
  code: string;
  description: string;
  sortOrder: number;
  scheduledValueCents: number;
  billedToDateCents: number;
  billedPct: number;
  verifiedProgressPct: number;
  verifiedValueCents: number;
  variancePts: number;
  overEvidence: boolean;
  unbilledVerifiedCents: number;
};

const NON_DRAFT_PAY_STATUSES = new Set<string>([
  PayApplicationStatus.SUBMITTED,
  PayApplicationStatus.APPROVED,
  PayApplicationStatus.PAID,
]);

export function revisedContractValueCents(
  originalContractValueCents: number,
  changeOrders: ProgressChangeOrder[],
): number {
  const approved = changeOrders
    .filter((co) => co.status === ChangeOrderStatus.APPROVED)
    .reduce((sum, co) => sum + co.amountCents, 0);
  return originalContractValueCents + approved;
}

/** Billed-to-date for one SOV line: sum of this-period amounts on non-draft pay apps. */
export function billedToDateCentsForLine(
  sovLineId: string,
  payApplications: ProgressPayApp[],
): number {
  let total = 0;
  for (const app of payApplications) {
    if (!NON_DRAFT_PAY_STATUSES.has(app.status)) continue;
    for (const line of app.lines) {
      if (line.sovLineId === sovLineId) {
        total += line.thisPeriodCents;
      }
    }
  }
  return total;
}

export function retainageHeldCents(payApplications: ProgressPayApp[]): number {
  let total = 0;
  for (const app of payApplications) {
    if (!NON_DRAFT_PAY_STATUSES.has(app.status)) continue;
    for (const line of app.lines) {
      total += line.retainageCents;
    }
  }
  return total;
}

export function paidToDateCents(payApplications: ProgressPayApp[]): number {
  let total = 0;
  for (const app of payApplications) {
    if (app.status !== PayApplicationStatus.PAID) continue;
    for (const line of app.lines) {
      total += line.thisPeriodCents + line.storedMaterialsCents - line.retainageCents;
    }
  }
  return total;
}

export function payAppAmountCents(app: ProgressPayApp): number {
  return app.lines.reduce(
    (sum, line) =>
      sum + line.thisPeriodCents + line.storedMaterialsCents - line.retainageCents,
    0,
  );
}

/**
 * Verified-progress % for an SOV line.
 * Uses Σ qtyVerified / qtyScheduled when the SOV has a scheduled quantity > 1 and
 * verified quantities are large enough to be SOV units (not per-WO claim counts);
 * otherwise VERIFIED count ÷ work orders on the line (excluding DRAFT).
 */
export function verifiedProgressPctForLine(
  sov: ProgressSovLine,
  workOrders: ProgressWorkOrder[],
): number {
  const onLine = workOrders.filter(
    (w) => w.sovLineId === sov.id && w.status !== WorkOrderStatus.DRAFT,
  );
  if (onLine.length === 0) return 0;

  const verified = onLine.filter((w) => w.status === WorkOrderStatus.VERIFIED);
  const qtyScheduled = sov.qtyScheduled;
  const sumQty = verified.reduce((sum, w) => sum + (w.qtyVerified ?? 0), 0);
  const quantitiesLookLikeSovUnits =
    qtyScheduled != null &&
    qtyScheduled > 1 &&
    verified.some((w) => w.qtyVerified != null) &&
    sumQty >= qtyScheduled * 0.05;

  if (quantitiesLookLikeSovUnits && qtyScheduled != null) {
    return clampPct((sumQty / qtyScheduled) * 100);
  }

  return clampPct((verified.length / onLine.length) * 100);
}

export function verifiedValueCentsForLine(
  sov: ProgressSovLine,
  workOrders: ProgressWorkOrder[],
): number {
  const pct = verifiedProgressPctForLine(sov, workOrders);
  return Math.round((pct / 100) * sov.scheduledValueCents);
}

export function computeSovProgressRows(
  sovLines: ProgressSovLine[],
  workOrders: ProgressWorkOrder[],
  payApplications: ProgressPayApp[],
): SovProgressRow[] {
  return [...sovLines]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((sov) => {
      const billedToDateCents = billedToDateCentsForLine(sov.id, payApplications);
      const billedPct =
        sov.scheduledValueCents > 0
          ? clampPct((billedToDateCents / sov.scheduledValueCents) * 100)
          : 0;
      const verifiedProgressPct = verifiedProgressPctForLine(sov, workOrders);
      const verifiedValueCents = Math.round(
        (verifiedProgressPct / 100) * sov.scheduledValueCents,
      );
      const variancePts = billedPct - verifiedProgressPct;
      const overEvidence = variancePts > 10;
      const unbilledVerifiedCents = Math.max(0, verifiedValueCents - billedToDateCents);

      return {
        sovLineId: sov.id,
        code: sov.code,
        description: sov.description,
        sortOrder: sov.sortOrder,
        scheduledValueCents: sov.scheduledValueCents,
        billedToDateCents,
        billedPct,
        verifiedProgressPct,
        verifiedValueCents,
        variancePts,
        overEvidence,
        unbilledVerifiedCents,
      };
    });
}

export function projectVerifiedCompletePct(rows: SovProgressRow[]): number {
  const scheduled = rows.reduce((s, r) => s + r.scheduledValueCents, 0);
  if (scheduled <= 0) return 0;
  const verified = rows.reduce((s, r) => s + r.verifiedValueCents, 0);
  return clampPct((verified / scheduled) * 100);
}

export function projectBilledToDateCents(rows: SovProgressRow[]): number {
  return rows.reduce((s, r) => s + r.billedToDateCents, 0);
}

export function timeElapsedPct(
  startDate: Date,
  endDate: Date,
  today: Date,
): number {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const now = today.getTime();
  if (end <= start) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;
  return clampPct(((now - start) / (end - start)) * 100);
}

export function averageDaysSubmittedToPaid(payApplications: ProgressPayApp[]): number | null {
  const durations: number[] = [];
  for (const app of payApplications) {
    if (app.status !== PayApplicationStatus.PAID) continue;
    if (!app.submittedAt || !app.paidAt) continue;
    const days = Math.round(
      (app.paidAt.getTime() - app.submittedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days >= 0) durations.push(days);
  }
  if (durations.length === 0) return null;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
