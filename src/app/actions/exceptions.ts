"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  refreshExceptionsForProject,
  type RefreshExceptionsResult,
} from "@/lib/refresh-exceptions";

export type { RefreshExceptionsResult };

const refreshSchema = z.object({
  projectId: z.string().min(1),
});

export async function refreshExceptions(
  projectId: string,
): Promise<RefreshExceptionsResult> {
  const parsed = refreshSchema.parse({ projectId });
  const result = await refreshExceptionsForProject(parsed.projectId);
  revalidatePath(`/projects/${parsed.projectId}`);
  return result;
}

/**
 * Recompute when none are open or the newest open alert is older than 24h.
 * Cached per-request so layout + page share one refresh (avoids empty panel race).
 */
export const ensureExceptionsFresh = cache(async (projectId: string): Promise<void> => {
  const today = startOfDay(new Date());
  const newest = await db.exceptionAlert.findFirst({
    where: { projectId, resolvedAt: null },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const stale =
    !newest ||
    today.getTime() - newest.createdAt.getTime() > 24 * 60 * 60 * 1000;

  if (stale) {
    await refreshExceptionsForProject(projectId);
    revalidatePath(`/projects/${projectId}`);
  }
});
