import Link from "next/link";
import { formatDateTime } from "@/lib/format";

export type ActivityEventView = {
  id: string;
  at: string;
  kind: string;
  description: string;
  href: string;
};

export function ActivityFeed({ events }: { events: ActivityEventView[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
        <p className="mt-0.5 text-xs text-slate-500">Last 15 project events</p>
      </div>
      <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
        {events.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">
            No recent activity.
          </li>
        ) : (
          events.map((event) => (
            <li key={event.id} className="px-4 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink">{event.description}</p>
                  <p className="num mt-0.5 text-[11px] text-slate-500">
                    {formatDateTime(event.at)}
                  </p>
                </div>
                <Link
                  href={event.href}
                  className="shrink-0 text-xs font-medium text-sky hover:underline"
                >
                  Open
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
