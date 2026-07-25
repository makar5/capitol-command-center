import { differenceInCalendarDays, eachDayOfInterval, isWeekend, subDays, startOfDay } from "date-fns";
import {
  DailyReportStatus,
  MilestoneStatus,
  VerificationResult,
  WorkOrderStatus,
} from "@/lib/constants";
import {
  billedToDateCentsForLine,
  computeSovProgressRows,
  type ProgressChangeOrder,
  type ProgressPayApp,
  type ProgressSovLine,
  type ProgressWorkOrder,
  verifiedValueCentsForLine,
} from "@/lib/progress";

export type ExceptionSeverity = "INFO" | "WARNING" | "CRITICAL";

export type ExceptionCandidate = {
  type: string;
  severity: ExceptionSeverity;
  message: string;
  entityType?: string;
  entityId?: string;
};

export type SnapshotVerification = {
  id: string;
  result: string;
  date: Date;
};

export type SnapshotWorkOrder = ProgressWorkOrder & {
  dueDate?: Date | null;
  completedAt?: Date | null;
  verifiedAt?: Date | null;
  fieldVerifications: SnapshotVerification[];
  photoCount: number;
};

export type SnapshotDailyReport = {
  id: string;
  date: Date;
  status: string;
};

export type SnapshotMilestone = {
  id: string;
  name: string;
  plannedDate: Date;
  forecastDate?: Date | null;
  actualDate?: Date | null;
  status: string;
};

export type ProjectSnapshot = {
  projectId: string;
  today: Date;
  sovLines: ProgressSovLine[];
  workOrders: SnapshotWorkOrder[];
  dailyReports: SnapshotDailyReport[];
  milestones: SnapshotMilestone[];
  payApplications: ProgressPayApp[];
  changeOrders?: ProgressChangeOrder[];
};

export function exceptionMatchKey(c: {
  type: string;
  entityType?: string | null;
  entityId?: string | null;
}): string {
  return `${c.type}::${c.entityType ?? ""}::${c.entityId ?? ""}`;
}

function remediationTitle(originalTitle: string): string {
  return `Remediate: ${originalTitle}`;
}

export function computeExceptions(input: ProjectSnapshot): ExceptionCandidate[] {
  const today = startOfDay(input.today);
  const candidates: ExceptionCandidate[] = [];

  const sovById = new Map(input.sovLines.map((s) => [s.id, s]));
  const progressRows = computeSovProgressRows(
    input.sovLines,
    input.workOrders,
    input.payApplications,
  );
  const progressBySov = new Map(progressRows.map((r) => [r.sovLineId, r]));

  // CRITICAL — EVIDENCE_GAP
  for (const wo of input.workOrders) {
    if (wo.status !== WorkOrderStatus.COMPLETED || !wo.completedAt) continue;
    if (wo.fieldVerifications.length > 0) continue;
    const days = differenceInCalendarDays(today, startOfDay(wo.completedAt));
    if (days > 5) {
      candidates.push({
        type: "EVIDENCE_GAP",
        severity: "CRITICAL",
        message: `${wo.number} '${wo.title}' completed ${days} days ago with no field verification`,
        entityType: "WorkOrder",
        entityId: wo.id,
      });
    }
  }

  // CRITICAL — DEFICIENT_OPEN
  for (const wo of input.workOrders) {
    if (wo.status !== WorkOrderStatus.DEFICIENT) continue;
    const fail = [...wo.fieldVerifications]
      .filter((v) => v.result === VerificationResult.FAIL)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    const failDate = fail?.date ?? wo.verifiedAt;
    if (!failDate) continue;
    const daysOpen = differenceInCalendarDays(today, startOfDay(failDate));
    if (daysOpen <= 10) continue;

    const remediation = input.workOrders.find(
      (other) =>
        other.id !== wo.id &&
        other.title === remediationTitle(wo.title) &&
        other.status === WorkOrderStatus.VERIFIED &&
        other.verifiedAt != null &&
        differenceInCalendarDays(startOfDay(other.verifiedAt), startOfDay(failDate)) <= 10,
    );
    if (remediation) continue;

    candidates.push({
      type: "DEFICIENT_OPEN",
      severity: "CRITICAL",
      message: `${wo.number} '${wo.title}' remains deficient ${daysOpen} days after failed verification with no verified remediation`,
      entityType: "WorkOrder",
      entityId: wo.id,
    });
  }

  // WARNING — BURN_VS_PROGRESS
  for (const row of progressRows) {
    if (!row.overEvidence) continue;
    const pts = Math.round(row.variancePts);
    candidates.push({
      type: "BURN_VS_PROGRESS",
      severity: "WARNING",
      message: `SOV ${row.code} '${row.description}' billed ${row.billedPct.toFixed(1)}% vs ${row.verifiedProgressPct.toFixed(1)}% verified (+${pts} pts over evidence)`,
      entityType: "SovLine",
      entityId: row.sovLineId,
    });
  }

  // WARNING — WORK_ORDER_OVERDUE
  for (const wo of input.workOrders) {
    if (!wo.dueDate) continue;
    if (
      wo.status === WorkOrderStatus.COMPLETED ||
      wo.status === WorkOrderStatus.VERIFIED
    ) {
      continue;
    }
    if (startOfDay(wo.dueDate) >= today) continue;
    const days = differenceInCalendarDays(today, startOfDay(wo.dueDate));
    candidates.push({
      type: "WORK_ORDER_OVERDUE",
      severity: "WARNING",
      message: `${wo.number} '${wo.title}' is ${days} days past due (status ${wo.status.toLowerCase().replace(/_/g, " ")})`,
      entityType: "WorkOrder",
      entityId: wo.id,
    });
  }

  // WARNING — REPORTING_GAP
  const windowStart = subDays(today, 6);
  const weekdays = eachDayOfInterval({ start: windowStart, end: today }).filter(
    (d) => !isWeekend(d),
  );
  const submittedDates = new Set(
    input.dailyReports
      .filter((r) => r.status === DailyReportStatus.SUBMITTED)
      .map((r) => startOfDay(r.date).toISOString()),
  );
  for (const day of weekdays) {
    if (submittedDates.has(day.toISOString())) continue;
    candidates.push({
      type: "REPORTING_GAP",
      severity: "WARNING",
      message: `No submitted daily report on ${day.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
      entityType: "DailyReport",
      entityId: day.toISOString().slice(0, 10),
    });
  }

  // WARNING — MILESTONE_AT_RISK
  for (const m of input.milestones) {
    if (m.status === MilestoneStatus.COMPLETE) continue;
    if (!m.forecastDate) continue;
    if (startOfDay(m.forecastDate) <= startOfDay(m.plannedDate)) continue;
    const slip = differenceInCalendarDays(
      startOfDay(m.forecastDate),
      startOfDay(m.plannedDate),
    );
    candidates.push({
      type: "MILESTONE_AT_RISK",
      severity: "WARNING",
      message: `Milestone '${m.name}' forecast is ${slip} days after planned date`,
      entityType: "Milestone",
      entityId: m.id,
    });
  }

  // INFO — UNBILLED_VERIFIED
  for (const sov of input.sovLines) {
    const verifiedValue = verifiedValueCentsForLine(sov, input.workOrders);
    const billed = billedToDateCentsForLine(sov.id, input.payApplications);
    if (verifiedValue <= billed) continue;
    const gap = verifiedValue - billed;
    const row = progressBySov.get(sov.id);
    candidates.push({
      type: "UNBILLED_VERIFIED",
      severity: "INFO",
      message: `SOV ${sov.code} '${sov.description}' has $${(gap / 100).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} verified work not yet billed${
        row ? ` (${row.verifiedProgressPct.toFixed(1)}% verified vs ${row.billedPct.toFixed(1)}% billed)` : ""
      }`,
      entityType: "SovLine",
      entityId: sov.id,
    });
  }

  // INFO — PHOTO_GAP
  for (const wo of input.workOrders) {
    if (wo.status !== WorkOrderStatus.VERIFIED) continue;
    if (wo.photoCount >= 2) continue;
    candidates.push({
      type: "PHOTO_GAP",
      severity: "INFO",
      message: `${wo.number} '${wo.title}' is verified with only ${wo.photoCount} photo${wo.photoCount === 1 ? "" : "s"} (need 2+)`,
      entityType: "WorkOrder",
      entityId: wo.id,
    });
  }

  void sovById;
  return candidates;
}
