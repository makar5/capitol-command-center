"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { DEMO_ACCOUNT } from "@/lib/auth";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 w-full rounded bg-sky px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-xs font-medium text-slate-300">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={DEMO_ACCOUNT.email}
          className="mt-1.5 w-full rounded border border-white/15 bg-navy/60 px-3 py-2 text-sm text-white outline-none ring-sky placeholder:text-slate-500 focus:border-sky focus:ring-1"
          placeholder="demo@capitolcommand.com"
        />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-300">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue={DEMO_ACCOUNT.password}
          className="mt-1.5 w-full rounded border border-white/15 bg-navy/60 px-3 py-2 text-sm text-white outline-none ring-sky placeholder:text-slate-500 focus:border-sky focus:ring-1"
          placeholder="Password"
        />
      </label>

      {state.error ? (
        <p className="rounded border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
