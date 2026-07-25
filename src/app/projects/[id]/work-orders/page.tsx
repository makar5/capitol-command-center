import Link from "next/link";
import { PageHeader } from "@/components/shell/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function WorkOrdersPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { sovLine?: string; sov?: string };
}) {
  const sovFilter = searchParams.sovLine;
  const sovIdFilter = searchParams.sov;

  const sovLine = sovFilter
    ? await db.sovLine.findFirst({
        where: { projectId: params.id, code: sovFilter },
      })
    : sovIdFilter
      ? await db.sovLine.findFirst({
          where: { projectId: params.id, id: sovIdFilter },
        })
      : null;

  const workOrders = await db.workOrder.findMany({
    where: {
      projectId: params.id,
      ...(sovLine ? { sovLineId: sovLine.id } : {}),
    },
    include: {
      sovLine: true,
      subcontract: { include: { subcontractor: true } },
    },
    orderBy: { number: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Work orders"
        description={
          sovLine
            ? `Filtered to SOV ${sovLine.code} · ${sovLine.description} (full filters in Phase 5)`
            : "Dense filterable table ships in Phase 5"
        }
        actions={
          sovLine ? (
            <Link
              href={`/projects/${params.id}/work-orders`}
              className="text-sm font-medium text-sky hover:underline"
            >
              Clear filter
            </Link>
          ) : null
        }
      />

      {workOrders.length === 0 ? (
        <EmptyState
          title="No work orders"
          description="No work orders match this filter."
          action={
            <Link
              href={`/projects/${params.id}/work-orders`}
              className="text-sm font-medium text-sky hover:underline"
            >
              View all work orders
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-table">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2.5 font-medium">Number</th>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">SOV</th>
                <th className="px-4 py-2.5 font-medium">Sub</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.id} className="border-t border-slate-100">
                  <td className="num px-4 py-2.5">
                    <Link
                      href={`/projects/${params.id}/work-orders/${wo.id}`}
                      className="font-medium text-sky hover:underline"
                    >
                      {wo.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/projects/${params.id}/work-orders/${wo.id}`}
                      className="text-ink hover:underline"
                    >
                      {wo.title}
                    </Link>
                  </td>
                  <td className="num px-4 py-2.5 text-slate-600">{wo.sovLine.code}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {wo.subcontract.subcontractor.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusChip tone={wo.status}>
                      {wo.status.toLowerCase().replace(/_/g, " ")}
                    </StatusChip>
                  </td>
                  <td className="num px-4 py-2.5 text-slate-600">
                    {wo.dueDate ? formatDate(wo.dueDate) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
