"use client";

import { useRouter } from "next/navigation";
import { ROLE_COOKIE, ROLE_LABELS, type DemoRole } from "@/lib/roles";

const ROLES: DemoRole[] = ["EXECUTIVE", "PROJECT_MANAGER", "FIELD_INSPECTOR"];

export function RoleSwitcher({ role }: { role: DemoRole }) {
  const router = useRouter();

  function onChange(next: DemoRole) {
    document.cookie = `${ROLE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  return (
    <label className="flex items-center gap-2 text-xs text-slate-300">
      <span className="hidden sm:inline">Role</span>
      <select
        value={role}
        onChange={(e) => onChange(e.target.value as DemoRole)}
        className="rounded border border-white/20 bg-navy px-2 py-1 text-xs text-white focus:border-sky focus:outline-none"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </label>
  );
}
