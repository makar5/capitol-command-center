import { db } from "@/lib/db";
import { computeExceptions, exceptionMatchKey } from "@/lib/exceptions";
import { loadProjectSnapshot } from "@/lib/project-snapshot";

export type RefreshExceptionsResult = {
  created: number;
  resolved: number;
  open: number;
};

export async function refreshExceptionsForProject(
  projectId: string,
): Promise<RefreshExceptionsResult> {
  const snapshot = await loadProjectSnapshot(projectId);
  if (!snapshot) {
    throw new Error("Project not found");
  }

  const candidates = computeExceptions(snapshot);
  const candidateKeys = new Set(candidates.map((c) => exceptionMatchKey(c)));

  const existing = await db.exceptionAlert.findMany({
    where: { projectId },
  });

  const unresolved = existing.filter((e) => e.resolvedAt == null);
  const unresolvedByKey = new Map(
    unresolved.map((e) => [exceptionMatchKey(e), e]),
  );

  let created = 0;
  let resolved = 0;
  const now = new Date();

  for (const candidate of candidates) {
    const key = exceptionMatchKey(candidate);
    if (unresolvedByKey.has(key)) continue;

    await db.exceptionAlert.create({
      data: {
        projectId,
        type: candidate.type,
        severity: candidate.severity,
        message: candidate.message,
        entityType: candidate.entityType,
        entityId: candidate.entityId,
      },
    });
    created += 1;
  }

  for (const alert of unresolved) {
    const key = exceptionMatchKey(alert);
    if (candidateKeys.has(key)) continue;
    await db.exceptionAlert.update({
      where: { id: alert.id },
      data: { resolvedAt: now },
    });
    resolved += 1;
  }

  const open = await db.exceptionAlert.count({
    where: { projectId, resolvedAt: null },
  });

  return { created, resolved, open };
}
