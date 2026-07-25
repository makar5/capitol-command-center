import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { db } from "@/lib/db";
import { ensureExceptionsFresh } from "@/app/actions/exceptions";

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
    },
  });

  if (!project) notFound();

  await ensureExceptionsFresh(project.id);

  const [exceptionCritical, exceptionTotal] = await Promise.all([
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
  ]);

  return (
    <AppShell
      projectId={project.id}
      projectName={project.name}
      contractNumber={project.contractNumber}
      exceptionCritical={exceptionCritical}
      exceptionTotal={exceptionTotal}
    >
      {children}
    </AppShell>
  );
}
