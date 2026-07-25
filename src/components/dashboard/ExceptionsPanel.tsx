"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { refreshExceptions } from "@/app/actions/exceptions";
import { Button } from "@/components/ui/Button";
import { relativeDays } from "@/lib/format";

export type ExceptionView = {
  id: string;
  type: string;
  severity: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: Date | string;
};

const SEVERITY_ORDER = ["CRITICAL", "WARNING", "INFO"] as const;

function entityHref(
  projectId: string,
  entityType?: string | null,
  entityId?: string | null,
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "WorkOrder") {
    return `/projects/${projectId}/work-orders/${entityId}`;
  }
  if (entityType === "SovLine") {
    return `/projects/${projectId}/work-orders?sov=${entityId}`;
  }
  if (entityType === "Milestone") {
    return `/projects/${projectId}#milestone-${entityId}`;
  }
  if (entityType === "DailyReport") {
    return `/projects/${projectId}/daily-reports`;
  }
  return null;
}

export function ExceptionsPanel({
  projectId,
  alerts,
}: {
  projectId: string;
  alerts: ExceptionView[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(alerts.length <= 8);

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    items: alerts.filter((a) => a.severity === severity),
  })).filter((g) => g.items.length > 0);

  const totalAlerts = alerts.length;
  const collapseInfo = totalAlerts > 8;

  function onRefresh() {
    startTransition(async () => {
      const result = await refreshExceptions(projectId);
      setToast(
        `Exceptions refreshed — ${result.created} created, ${result.resolved} resolved, ${result.open} open`,
      );
      router.refresh();
      window.setTimeout(() => setToast(null), 4000);
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Exceptions</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {alerts.length} open · recomputed from project evidence
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onRefresh}
          disabled={pending}
        >
          {pending ? "Refreshing…" : "Refresh exceptions"}
        </Button>
      </div>

      {toast ? (
        <div className="border-b border-sky-100 bg-sky-callout px-4 py-2 text-xs text-navy-header">
          {toast}
        </div>
      ) : null}

      <div className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
        {grouped.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No open exceptions.
          </div>
        ) : (
          grouped.map((group) => {
            const isInfo = group.severity === "INFO";
            const hidden = isInfo && collapseInfo && !infoOpen;
            return (
              <div key={group.severity}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between bg-slate-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  onClick={() => {
                    if (isInfo && collapseInfo) setInfoOpen((v) => !v);
                  }}
                  disabled={!isInfo || !collapseInfo}
                >
                  <span>
                    {group.severity.toLowerCase()} · {group.items.length}
                  </span>
                  {isInfo && collapseInfo ? (
                    <span className="font-normal normal-case text-slate-400">
                      {infoOpen ? "Collapse" : "Expand"}
                    </span>
                  ) : null}
                </button>
                {!hidden
                  ? group.items.map((alert) => {
                      const href = entityHref(
                        projectId,
                        alert.entityType,
                        alert.entityId,
                      );
                      return (
                        <div
                          key={alert.id}
                          className="flex gap-3 px-4 py-2.5"
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              alert.severity === "CRITICAL"
                                ? "bg-status-deficient"
                                : alert.severity === "WARNING"
                                  ? "bg-status-atrisk"
                                  : "bg-slate-400"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-ink">{alert.message}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span>{relativeDays(alert.createdAt)}</span>
                              {href ? (
                                <Link
                                  href={href}
                                  className="font-medium text-sky hover:underline"
                                >
                                  View
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
