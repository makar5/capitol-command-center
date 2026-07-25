import { RoleSwitcher } from "./RoleSwitcher";
import { SignOutButton } from "./SignOutButton";
import type { DemoRole } from "@/lib/roles";
import { DEMO_ACCOUNT } from "@/lib/auth";

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
    <header className="no-print flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-navy-header px-5 text-white">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{projectName}</div>
        <div className="num text-xs text-sky-100/80">{contractNumber}</div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-xs font-medium text-white">{DEMO_ACCOUNT.name}</div>
          <div className="text-[11px] text-sky-100/70">{DEMO_ACCOUNT.title}</div>
        </div>
        <RoleSwitcher role={role} />
        <SignOutButton />
      </div>
    </header>
  );
}
