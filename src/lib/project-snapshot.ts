import { startOfDay } from "date-fns";
import { db } from "@/lib/db";
import type { ProjectSnapshot } from "@/lib/exceptions";

export async function loadProjectSnapshot(
  projectId: string,
  today: Date = startOfDay(new Date()),
): Promise<ProjectSnapshot | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      sovLines: { orderBy: { sortOrder: "asc" } },
      workOrders: {
        include: {
          fieldVerifications: true,
          photos: { select: { id: true } },
        },
      },
      dailyReports: { select: { id: true, date: true, status: true } },
      milestones: true,
      payApplications: { include: { lines: true } },
      changeOrders: { select: { amountCents: true, status: true } },
    },
  });

  if (!project) return null;

  return {
    projectId: project.id,
    today: startOfDay(today),
    sovLines: project.sovLines.map((s) => ({
      id: s.id,
      code: s.code,
      description: s.description,
      scheduledValueCents: s.scheduledValueCents,
      unit: s.unit,
      qtyScheduled: s.qtyScheduled,
      sortOrder: s.sortOrder,
    })),
    workOrders: project.workOrders.map((w) => ({
      id: w.id,
      number: w.number,
      title: w.title,
      sovLineId: w.sovLineId,
      status: w.status,
      qtyClaimed: w.qtyClaimed,
      qtyVerified: w.qtyVerified,
      dueDate: w.dueDate,
      completedAt: w.completedAt,
      verifiedAt: w.verifiedAt,
      fieldVerifications: w.fieldVerifications.map((v) => ({
        id: v.id,
        result: v.result,
        date: v.date,
      })),
      photoCount: w.photos.length,
    })),
    dailyReports: project.dailyReports,
    milestones: project.milestones,
    payApplications: project.payApplications.map((app) => ({
      id: app.id,
      number: app.number,
      status: app.status,
      periodStart: app.periodStart,
      periodEnd: app.periodEnd,
      submittedAt: app.submittedAt,
      approvedAt: app.approvedAt,
      paidAt: app.paidAt,
      lines: app.lines,
    })),
    changeOrders: project.changeOrders,
  };
}
