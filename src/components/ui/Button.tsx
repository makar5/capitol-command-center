import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-sky text-white hover:bg-sky/90",
  secondary: "bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-50",
  ghost: "bg-transparent text-ink hover:bg-slate-100",
  danger: "bg-status-deficient text-white hover:bg-red-700",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
