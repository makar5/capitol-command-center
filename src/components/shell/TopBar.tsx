import { RoleSwitcher } from "./RoleSwitcher";
import type { DemoRole } from "@/lib/roles";

export function TopBar({
  projectName,
  contractNumber,
  role,
}: {
  projectName: string;
  contractNumber: string;
  role: DemoRole;
}) {
  return (
    <header className="no-print flex h-14 items-center justify-between border-b border-slate-200 bg-navy-header px-5 text-white">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{projectName}</div>
        <div className="num text-xs text-sky-100/80">{contractNumber}</div>
      </div>
      <RoleSwitcher role={role} />
    </header>
  );
}
