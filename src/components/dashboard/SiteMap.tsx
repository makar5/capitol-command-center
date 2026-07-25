"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";

export type MapPhoto = {
  id: string;
  url: string;
  caption: string;
  kind: string;
  lat: number;
  lng: number;
  takenAt?: Date | string | null;
  workOrderId?: string | null;
  workOrderNumber?: string | null;
};

const KIND_COLORS: Record<string, string> = {
  BEFORE: "#64748B",
  PROGRESS: "#0EA5E9",
  AFTER: "#059669",
  DEFECT: "#DC2626",
};

const SiteMapInner = dynamic(
  () => import("./SiteMapInner").then((m) => m.SiteMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading map…
      </div>
    ),
  },
);

export function SiteMap({
  projectId,
  projectName,
  lat,
  lng,
  photos,
}: {
  projectId: string;
  projectName: string;
  lat: number;
  lng: number;
  photos: MapPhoto[];
}) {
  const [selected, setSelected] = useState<MapPhoto | null>(null);

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Site map</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Project location and geotagged photos · last 30 days
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
          {Object.entries(KIND_COLORS).map(([kind, color]) => (
            <span key={kind} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {kind.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
      <div className="relative h-[280px] w-full overflow-hidden">
        <SiteMapInner lat={lat} lng={lng} photos={photos} onSelect={setSelected} />
        {selected ? (
          <div className="absolute bottom-3 left-3 z-[1000] w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.url}
              alt={selected.caption}
              className="mb-2 h-24 w-full rounded object-cover"
            />
            <p className="text-xs font-medium text-ink">{selected.caption}</p>
            <p className="num mt-1 text-[11px] text-slate-500">
              {selected.takenAt ? formatDateTime(selected.takenAt) : "No timestamp"} ·{" "}
              {selected.kind.toLowerCase()}
            </p>
            {selected.workOrderId ? (
              <Link
                href={`/projects/${projectId}/work-orders/${selected.workOrderId}`}
                className="mt-2 inline-block text-xs font-medium text-sky hover:underline"
              >
                {selected.workOrderNumber ?? "Work order"}
              </Link>
            ) : (
              <p className="mt-2 text-[11px] text-slate-400">{projectName}</p>
            )}
            <button
              type="button"
              className="absolute right-2 top-2 rounded bg-white/90 px-1.5 text-xs text-slate-500"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
