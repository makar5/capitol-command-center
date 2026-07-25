import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { db } from "@/lib/db";
import { ensureExceptionsFresh } from "@/app/actions/exceptions";
import { sortDemoProjects } from "@/lib/projects";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const project = await db.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      contractNumber: true,
      owningAgency: true,
      status: true,
    },
  });

  if (!project) notFound();

  await ensureExceptionsFresh(project.id);

  const [exceptionCritical, exceptionTotal, allProjects] = await Promise.all([
    db.exceptionAlert.count({
      where: {
        projectId: project.id,
        resolvedAt: null,
        severity: "CRITICAL",
      },
    }),
    db.exceptionAlert.count({
      where: { projectId: project.id, resolvedAt: null },
    }),
    db.project.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        owningAgency: true,
      },
    }),
  ]);

  return (
    <AppShell
      projectId={project.id}
      projectName={project.name}
      contractNumber={project.contractNumber}
      owningAgency={project.owningAgency}
      status={project.status}
      projects={sortDemoProjects(allProjects)}
      exceptionCritical={exceptionCritical}
      exceptionTotal={exceptionTotal}
    >
      {children}
    </AppShell>
  );
}
