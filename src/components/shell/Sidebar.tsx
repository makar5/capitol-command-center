"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { projectNav } from "./nav";
import type { DemoRole } from "@/lib/roles";
import type { ProjectOption } from "@/lib/projects";

export function Sidebar({
  projectId,
  projectName,
  projects,
  role,
  exceptionCritical = 0,
  exceptionTotal = 0,
}: {
  projectId: string;
  projectName: string;
  projects: ProjectOption[];
  role: DemoRole;
  exceptionCritical?: number;
  exceptionTotal?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = projectNav(projectId);
  const dashboardHref = `/projects/${projectId}`;

  function switchProject(nextId: string) {
    if (nextId === projectId) return;
    const suffix = pathname.startsWith(`/projects/${projectId}`)
      ? pathname.slice(`/projects/${projectId}`.length)
      : "";
    router.push(`/projects/${nextId}${suffix || ""}`);
  }

  return (
    <aside className="no-print flex w-60 shrink-0 flex-col bg-navy text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="text-[11px] font-medium uppercase tracking-wider text-sky">
          Capitol Command Center
        </div>
        <div className="mt-1 text-sm font-semibold leading-snug">
          Federal Project Ops
        </div>
      </div>

      <div className="border-b border-white/10 px-4 py-3">
        <label
          htmlFor="project-switcher"
          className="text-[11px] uppercase tracking-wide text-slate-400"
        >
          Project
        </label>
        <select
          id="project-switcher"
          className="mt-1 w-full truncate rounded border border-white/15 bg-navy-header/40 px-2 py-1.5 text-xs text-white"
          value={projectId}
          onChange={(e) => switchProject(e.target.value)}
          aria-label="Switch project"
        >
          {(projects.length > 0
            ? projects
            : [
                {
                  id: projectId,
                  name: projectName,
                  status: "ACTIVE",
                  owningAgency: "",
                },
              ]
          ).map((p) => (
            <option key={p.id} value={p.id}>
              {p.owningAgency ? `${p.owningAgency} · ` : ""}
              {shortProjectName(p.name)}
              {p.status !== "ACTIVE" ? ` (${formatStatus(p.status)})` : ""}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== dashboardHref && pathname.startsWith(item.href));
          const emphasized = item.emphasizedFor.includes(role);
          const isDashboard = item.href === dashboardHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between gap-2 rounded px-3 py-2 text-sm transition ${
                active
                  ? "bg-sky/20 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={`truncate ${emphasized ? "font-medium" : ""}`}>
                {item.label}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {isDashboard && exceptionTotal > 0 ? (
                  <>
                    {exceptionCritical > 0 ? (
                      <span className="num rounded bg-status-deficient px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                        {exceptionCritical}
                      </span>
                    ) : null}
                    <span className="num rounded bg-slate-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                      {exceptionTotal}
                    </span>
                  </>
                ) : null}
                {emphasized && !isDashboard ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-sky" aria-hidden />
                ) : null}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-500">
        Seeded demo · v1
      </div>
    </aside>
  );
}

function shortProjectName(name: string): string {
  const cut = name.split("—")[0]?.trim() ?? name;
  return cut.length > 42 ? `${cut.slice(0, 40)}…` : cut;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}
