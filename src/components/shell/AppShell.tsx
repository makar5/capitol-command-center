import { cookies } from "next/headers";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { parseRole, ROLE_COOKIE } from "@/lib/roles";
import type { ProjectOption } from "@/lib/projects";

export function AppShell({
  projectId,
  projectName,
  contractNumber,
  owningAgency,
  status,
  projects,
  exceptionCritical = 0,
  exceptionTotal = 0,
  children,
}: {
  projectId: string;
  projectName: string;
  contractNumber: string;
  owningAgency: string;
  status: string;
  projects: ProjectOption[];
  exceptionCritical?: number;
  exceptionTotal?: number;
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const role = parseRole(cookieStore.get(ROLE_COOKIE)?.value);

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar
        projectId={projectId}
        projectName={projectName}
        projects={projects}
        role={role}
        exceptionCritical={exceptionCritical}
        exceptionTotal={exceptionTotal}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          projectName={projectName}
          contractNumber={contractNumber}
          owningAgency={owningAgency}
          status={status}
          role={role}
        />
        <main className="flex-1 overflow-auto p-5">{children}</main>
      </div>
    </div>
  );
}
