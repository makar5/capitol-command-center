import type { DemoRole } from "@/lib/roles";

export type NavItem = {
  href: string;
  label: string;
  emphasizedFor: DemoRole[];
};

export function projectNav(projectId: string): NavItem[] {
  return [
    {
      href: `/projects/${projectId}`,
      label: "Dashboard",
      emphasizedFor: ["EXECUTIVE", "PROJECT_MANAGER"],
    },
    {
      href: `/projects/${projectId}/daily-reports`,
      label: "Daily reports",
      emphasizedFor: ["PROJECT_MANAGER", "FIELD_INSPECTOR"],
    },
    {
      href: `/projects/${projectId}/field`,
      label: "Field",
      emphasizedFor: ["FIELD_INSPECTOR"],
    },
    {
      href: `/projects/${projectId}/work-orders`,
      label: "Work orders",
      emphasizedFor: ["PROJECT_MANAGER", "FIELD_INSPECTOR"],
    },
    {
      href: `/projects/${projectId}/change-orders`,
      label: "Change orders",
      emphasizedFor: ["PROJECT_MANAGER", "EXECUTIVE"],
    },
    {
      href: `/projects/${projectId}/pay-apps`,
      label: "Pay applications",
      emphasizedFor: ["PROJECT_MANAGER", "EXECUTIVE"],
    },
    {
      href: `/projects/${projectId}/subcontractors`,
      label: "Subcontractors",
      emphasizedFor: ["PROJECT_MANAGER", "EXECUTIVE"],
    },
    {
      href: `/projects/${projectId}/documents`,
      label: "Documents",
      emphasizedFor: ["PROJECT_MANAGER"],
    },
    {
      href: `/projects/${projectId}/reports/weekly`,
      label: "Weekly report",
      emphasizedFor: ["EXECUTIVE"],
    },
  ];
}
