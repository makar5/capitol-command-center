import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { EvidenceChain } from "@/components/evidence/EvidenceChain";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, qty } from "@/lib/format";

export default async function WorkOrderDetailStubPage({
  params,
}: {
  params: { id: string; woId: string };
}) {
  const wo = await db.workOrder.findFirst({
    where: { id: params.woId, projectId: params.id },
    include: {
      sovLine: true,
      subcontract: { include: { subcontractor: true } },
      fieldVerifications: { orderBy: { date: "desc" } },
      photos: { orderBy: { takenAt: "desc" } },
    },
  });

  if (!wo) notFound();

  const hasVerification = wo.fieldVerifications.length > 0;
  const chain = {
    photo: wo.photos.length > 0,
    dailyReport: false,
    verification: hasVerification,
    sovLine: true,
    payApp: wo.status === "VERIFIED",
  };

  return (
    <div>
      <PageHeader
        title={`${wo.number} · ${wo.title}`}
        description="Work order detail (full timeline in Phase 5)"
        actions={
          <Link
            href={`/projects/${params.id}/work-orders`}
            className="text-sm font-medium text-sky hover:underline"
          >
            All work orders
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusChip tone={wo.status}>
          {wo.status.toLowerCase().replace(/_/g, " ")}
        </StatusChip>
        <EvidenceChain state={chain} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-3 text-sm font-semibold text-ink">Details</h2>
          <dl className="space-y-2 text-sm">
            <Row label="SOV" value={`${wo.sovLine.code} · ${wo.sovLine.description}`} />
            <Row label="Subcontractor" value={wo.subcontract.subcontractor.name} />
            <Row label="Trade" value={wo.subcontract.trade} />
            <Row label="Issued" value={wo.issuedAt ? formatDate(wo.issuedAt) : "—"} />
            <Row label="Due" value={wo.dueDate ? formatDate(wo.dueDate) : "—"} />
            <Row
              label="Completed"
              value={wo.completedAt ? formatDate(wo.completedAt) : "—"}
            />
            <Row
              label="Verified"
              value={wo.verifiedAt ? formatDate(wo.verifiedAt) : "—"}
            />
            <Row
              label="Qty claimed / verified"
              value={`${qty(wo.qtyClaimed)} / ${qty(wo.qtyVerified)}`}
            />
          </dl>
          <p className="mt-4 text-slate-600">{wo.description}</p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Verifications</h2>
          {wo.fieldVerifications.length === 0 ? (
            <p className="text-sm text-slate-500">No field verifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {wo.fieldVerifications.map((v) => (
                <li key={v.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <StatusChip tone={v.result}>{v.result.toLowerCase()}</StatusChip>
                    <span className="num text-xs text-slate-500">
                      {formatDateTime(v.date)} · {v.inspectorName}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600">{v.notes}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Photos ({wo.photos.length})
        </h2>
        {wo.photos.length === 0 ? (
          <p className="text-sm text-slate-500">No photos linked.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {wo.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption}
                className="aspect-[4/3] w-full rounded border border-slate-200 object-cover"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
