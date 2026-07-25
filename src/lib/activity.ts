import { ChangeOrderStatus, DailyReportStatus, PayApplicationStatus } from "@/lib/constants";

export type ActivityEvent = {
  id: string;
  at: Date;
  kind: string;
  description: string;
  href: string;
};

type ActivityInput = {
  projectId: string;
  dailyReports: Array<{ id: string; date: Date; status: string }>;
  verifications: Array<{
    id: string;
    date: Date;
    result: string;
    workOrder: { id: string; number: string; title: string };
  }>;
  workOrders: Array<{
    id: string;
    number: string;
    title: string;
    status: string;
    issuedAt?: Date | null;
    completedAt?: Date | null;
    verifiedAt?: Date | null;
  }>;
  changeOrders: Array<{
    id: string;
    number: string;
    title: string;
    status: string;
    submittedAt?: Date | null;
    decidedAt?: Date | null;
  }>;
  payApplications: Array<{
    id: string;
    number: number;
    status: string;
    submittedAt?: Date | null;
    approvedAt?: Date | null;
    paidAt?: Date | null;
  }>;
};

export function assembleActivityFeed(input: ActivityInput, limit = 15): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const base = `/projects/${input.projectId}`;

  for (const r of input.dailyReports) {
    if (r.status !== DailyReportStatus.SUBMITTED) continue;
    events.push({
      id: `dr-${r.id}`,
      at: r.date,
      kind: "daily_report",
      description: `Daily report submitted for ${r.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
      href: `${base}/daily-reports`,
    });
  }

  for (const v of input.verifications) {
    events.push({
      id: `fv-${v.id}`,
      at: v.date,
      kind: "verification",
      description: `Verification ${v.result.toLowerCase()} on ${v.workOrder.number} '${v.workOrder.title}'`,
      href: `${base}/work-orders/${v.workOrder.id}`,
    });
  }

  for (const wo of input.workOrders) {
    if (wo.verifiedAt) {
      events.push({
        id: `wo-ver-${wo.id}`,
        at: wo.verifiedAt,
        kind: "work_order",
        description: `${wo.number} marked verified`,
        href: `${base}/work-orders/${wo.id}`,
      });
    } else if (wo.completedAt) {
      events.push({
        id: `wo-comp-${wo.id}`,
        at: wo.completedAt,
        kind: "work_order",
        description: `${wo.number} marked completed`,
        href: `${base}/work-orders/${wo.id}`,
      });
    } else if (wo.issuedAt) {
      events.push({
        id: `wo-iss-${wo.id}`,
        at: wo.issuedAt,
        kind: "work_order",
        description: `${wo.number} issued`,
        href: `${base}/work-orders/${wo.id}`,
      });
    }
  }

  for (const co of input.changeOrders) {
    if (
      co.decidedAt &&
      (co.status === ChangeOrderStatus.APPROVED ||
        co.status === ChangeOrderStatus.REJECTED)
    ) {
      events.push({
        id: `co-dec-${co.id}`,
        at: co.decidedAt,
        kind: "change_order",
        description: `${co.number} '${co.title}' ${co.status.toLowerCase()}`,
        href: `${base}/change-orders`,
      });
    } else if (co.submittedAt && co.status === ChangeOrderStatus.SUBMITTED) {
      events.push({
        id: `co-sub-${co.id}`,
        at: co.submittedAt,
        kind: "change_order",
        description: `${co.number} '${co.title}' submitted`,
        href: `${base}/change-orders`,
      });
    }
  }

  for (const app of input.payApplications) {
    if (app.paidAt && app.status === PayApplicationStatus.PAID) {
      events.push({
        id: `pa-paid-${app.id}`,
        at: app.paidAt,
        kind: "pay_app",
        description: `Pay application #${app.number} paid`,
        href: `${base}/pay-apps`,
      });
    } else if (app.approvedAt && app.status === PayApplicationStatus.APPROVED) {
      events.push({
        id: `pa-apr-${app.id}`,
        at: app.approvedAt,
        kind: "pay_app",
        description: `Pay application #${app.number} approved`,
        href: `${base}/pay-apps`,
      });
    } else if (app.submittedAt) {
      events.push({
        id: `pa-sub-${app.id}`,
        at: app.submittedAt,
        kind: "pay_app",
        description: `Pay application #${app.number} submitted`,
        href: `${base}/pay-apps`,
      });
    }
  }

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}
