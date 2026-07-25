export const OrganizationType = {
  PRIME: "PRIME",
  SUBCONTRACTOR: "SUBCONTRACTOR",
  OWNER_AGENCY: "OWNER_AGENCY",
} as const;

export const UserRole = {
  EXECUTIVE: "EXECUTIVE",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  FIELD_INSPECTOR: "FIELD_INSPECTOR",
} as const;

export const ProjectStatus = {
  ACTIVE: "ACTIVE",
  ON_HOLD: "ON_HOLD",
  COMPLETE: "COMPLETE",
} as const;

export const MilestoneStatus = {
  PENDING: "PENDING",
  AT_RISK: "AT_RISK",
  COMPLETE: "COMPLETE",
} as const;

export const WorkOrderStatus = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  VERIFIED: "VERIFIED",
  DEFICIENT: "DEFICIENT",
} as const;

export const VerificationResult = {
  PASS: "PASS",
  FAIL: "FAIL",
  PARTIAL: "PARTIAL",
} as const;

export const PhotoKind = {
  BEFORE: "BEFORE",
  PROGRESS: "PROGRESS",
  AFTER: "AFTER",
  DEFECT: "DEFECT",
} as const;

export const DailyReportStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
} as const;

export const ChangeOrderStatus = {
  PROPOSED: "PROPOSED",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const PayApplicationStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  PAID: "PAID",
} as const;

export const ExceptionSeverity = {
  INFO: "INFO",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
} as const;

export const DocumentCategory = {
  CONTRACT: "CONTRACT",
  SUBMITTAL: "SUBMITTAL",
  RFI: "RFI",
  PERMIT: "PERMIT",
  INSURANCE: "INSURANCE",
  PAYROLL: "PAYROLL",
  OTHER: "OTHER",
} as const;

export type WorkOrderStatusValue =
  (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];
export type PhotoKindValue = (typeof PhotoKind)[keyof typeof PhotoKind];
export type VerificationResultValue =
  (typeof VerificationResult)[keyof typeof VerificationResult];

export function parseJsonField<T>(value: string): T {
  return JSON.parse(value) as T;
}

export function toJsonField(value: unknown): string {
  return JSON.stringify(value);
}
