import { notFound } from "next/navigation";
import { subDays, startOfDay } from "date-fns";
import { HeaderBand } from "@/components/dashboard/HeaderBand";
import { SovProgressTable } from "@/components/dashboard/SovProgressTable";
import { MilestoneTimeline } from "@/components/dashboard/MilestoneTimeline";
import { ExceptionsPanel } from "@/components/dashboard/ExceptionsPanel";
import { CashPositionPanel } from "@/components/dashboard/CashPositionPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { SiteMap } from "@/components/dashboard/SiteMap";
import { PageHeader } from "@/components/shell/PageHeader";
import { assembleActivityFeed } from "@/lib/activity";
import { db } from "@/lib/db";
import {
  computeSovProgressRows,
  projectBilledToDateCents,
  projectVerifiedCompletePct,
  retainageHeldCents,
  paidToDateCents,
  revisedContractValueCents,
  timeElapsedPct,
} from "@/lib/progress";

export default async function ProjectDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const today = startOfDay(new Date());

  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      sovLines: { orderBy: { sortOrder: "asc" } },
      workOrders: {
        include: {
          fieldVerifications: true,
          photos: { select: { id: true } },
        },
      },
      milestones: { orderBy: { plannedDate: "asc" } },
      payApplications: {
        include: { lines: true },
        orderBy: { number: "asc" },
      },
      changeOrders: true,
      dailyReports: {
        select: { id: true, date: true, status: true },
        orderBy: { date: "desc" },
      },
      photos: {
        where: {
          lat: { not: null },
          lng: { not: null },
          takenAt: { gte: subDays(today, 30) },
        },
        include: {
          workOrder: { select: { id: true, number: true } },
        },
        orderBy: { takenAt: "desc" },
        take: 80,
      },
    },
  });

  if (!project) notFound();

  // Exceptions are kept fresh in the project layout (ensureExceptionsFresh).
  const openAlerts = await db.exceptionAlert.findMany({
    where: { projectId: project.id, resolvedAt: null },
    orderBy: [{ createdAt: "desc" }],
  });
  const severityRank: Record<string, number> = {
    CRITICAL: 0,
    WARNING: 1,
    INFO: 2,
  };
  openAlerts.sort(
    (a, b) =>
      (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9) ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );

  const revisedValue = revisedContractValueCents(
    project.contractValueCents,
    project.changeOrders,
  );

  const progressRows = computeSovProgressRows(
    project.sovLines,
    project.workOrders,
    project.payApplications,
  );

  const billedToDate = projectBilledToDateCents(progressRows);
  const paid = paidToDateCents(project.payApplications);
  const retainage = retainageHeldCents(project.payApplications);
  const verifiedPct = projectVerifiedCompletePct(progressRows);
  const elapsedPct = timeElapsedPct(project.startDate, project.endDate, today);

  const verifications = await db.fieldVerification.findMany({
    where: { workOrder: { projectId: project.id } },
    include: {
      workOrder: { select: { id: true, number: true, title: true } },
    },
    orderBy: { date: "desc" },
    take: 40,
  });

  const activity = assembleActivityFeed({
    projectId: project.id,
    dailyReports: project.dailyReports,
    verifications,
    workOrders: project.workOrders,
    changeOrders: project.changeOrders,
    payApplications: project.payApplications,
  });

  const mapPhotos = project.photos
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      kind: p.kind,
      lat: p.lat as number,
      lng: p.lng as number,
      takenAt: p.takenAt,
      workOrderId: p.workOrderId,
      workOrderNumber: p.workOrder?.number ?? null,
    }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Command center — evidence, schedule, and cash position"
      />

      <HeaderBand
        contractValueCents={revisedValue}
        billedToDateCents={billedToDate}
        paidToDateCents={paid}
        retainageHeldCents={retainage}
        verifiedCompletePct={verifiedPct}
        timeElapsedPct={elapsedPct}
      />

      <SovProgressTable projectId={project.id} rows={progressRows} />

      <div className="grid gap-5 xl:grid-cols-2">
        <MilestoneTimeline
          milestones={project.milestones.map((m) => ({
            ...m,
            plannedDate: m.plannedDate.toISOString(),
            forecastDate: m.forecastDate?.toISOString() ?? null,
            actualDate: m.actualDate?.toISOString() ?? null,
          }))}
          startDate={project.startDate.toISOString()}
          endDate={project.endDate.toISOString()}
          today={today.toISOString()}
        />
        <ExceptionsPanel
          projectId={project.id}
          alerts={openAlerts.map((a) => ({
            id: a.id,
            type: a.type,
            severity: a.severity,
            message: a.message,
            entityType: a.entityType,
            entityId: a.entityId,
            createdAt: a.createdAt.toISOString(),
          }))}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <CashPositionPanel
          payApplications={project.payApplications.map((app) => ({
            ...app,
            periodStart: app.periodStart.toISOString(),
            periodEnd: app.periodEnd.toISOString(),
            submittedAt: app.submittedAt?.toISOString() ?? null,
            approvedAt: app.approvedAt?.toISOString() ?? null,
            paidAt: app.paidAt?.toISOString() ?? null,
          }))}
        />
        <ActivityFeed
          events={activity.map((e) => ({
            ...e,
            at: e.at.toISOString(),
          }))}
        />
      </div>

      <SiteMap
        projectId={project.id}
        projectName={project.name}
        lat={project.lat}
        lng={project.lng}
        photos={mapPhotos.map((p) => ({
          ...p,
          takenAt: p.takenAt ? new Date(p.takenAt).toISOString() : null,
        }))}
      />
    </div>
  );
}
