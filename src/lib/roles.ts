export type DemoRole = "EXECUTIVE" | "PROJECT_MANAGER" | "FIELD_INSPECTOR";

export const ROLE_COOKIE = "coecap-role";

export const ROLE_LABELS: Record<DemoRole, string> = {
  EXECUTIVE: "Executive",
  PROJECT_MANAGER: "PM",
  FIELD_INSPECTOR: "Field inspector",
};

export function isDemoRole(value: string | undefined | null): value is DemoRole {
  return (
    value === "EXECUTIVE" ||
    value === "PROJECT_MANAGER" ||
    value === "FIELD_INSPECTOR"
  );
}

export function parseRole(value: string | undefined | null): DemoRole {
  return isDemoRole(value) ? value : "PROJECT_MANAGER";
}
