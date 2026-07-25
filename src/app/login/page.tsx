import { LoginForm } from "@/components/auth/LoginForm";
import { DEMO_ACCOUNT } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-navy text-white">
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(14,165,233,0.35), transparent 55%), radial-gradient(ellipse 60% 50% at 85% 80%, rgba(7,89,133,0.55), transparent 50%), linear-gradient(180deg, #0A1628 0%, #071018 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center gap-12 px-6 py-12 lg:flex-row lg:items-center lg:gap-20 lg:px-10">
        <div className="max-w-xl lg:flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky">
            Capitol Command Center
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Prove the work.
            <br />
            <span className="text-sky">Get paid faster.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
            Evidence-to-payment operations for federal construction — field
            photos through verified work orders to the pay application package.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky" />
              Franklin Court demo project
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-status-verified" />
              Seeded sales environment
            </span>
          </div>
        </div>

        <div className="w-full max-w-md lg:flex-shrink-0">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <h2 className="text-lg font-semibold text-white">Sign in</h2>
            <p className="mt-1 text-sm text-slate-400">
              Use the demo account for walkthroughs.
            </p>
            <LoginForm />
            <div className="mt-6 rounded-lg border border-sky/30 bg-sky/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky">
                Demo account
              </p>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Email</dt>
                  <dd className="num text-white">{DEMO_ACCOUNT.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Password</dt>
                  <dd className="num text-white">{DEMO_ACCOUNT.password}</dd>
                </div>
              </dl>
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] text-slate-500">
            Demo sign-in only — no real authentication in v1.
          </p>
        </div>
      </div>
    </div>
  );
}
