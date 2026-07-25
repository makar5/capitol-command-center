"use client";

import { logoutAction } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded border border-white/20 px-2 py-1 text-xs text-slate-200 transition hover:border-white/40 hover:bg-white/5 hover:text-white"
      >
        Sign out
      </button>
    </form>
  );
}
