/** Flagship demo project — default landing after login. */
export const DEFAULT_PROJECT_ID = "proj_franklin";

/** Preferred sidebar / switcher order for sales demos. */
export const DEMO_PROJECT_ORDER = [
  "proj_franklin",
  "proj_va_ambulatory",
  "proj_usace_logistics",
  "proj_courthouse_security",
] as const;

export type ProjectOption = {
  id: string;
  name: string;
  status: string;
  owningAgency: string;
};

export function sortDemoProjects<T extends { id: string }>(projects: T[]): T[] {
  const rank = new Map(
    DEMO_PROJECT_ORDER.map((id, index) => [id, index] as const),
  );
  return [...projects].sort((a, b) => {
    const ai = rank.get(a.id as (typeof DEMO_PROJECT_ORDER)[number]) ?? 999;
    const bi = rank.get(b.id as (typeof DEMO_PROJECT_ORDER)[number]) ?? 999;
    if (ai !== bi) return ai - bi;
    return a.id.localeCompare(b.id);
  });
}
