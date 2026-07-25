import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A1628",
          header: "#075985",
        },
        sky: {
          DEFAULT: "#0EA5E9",
          callout: "#E0F2FE",
        },
        page: "#F8FAFC",
        ink: "#0F172A",
        status: {
          verified: "#059669",
          paid: "#059669",
          atrisk: "#D97706",
          deficient: "#DC2626",
          overdue: "#DC2626",
          draft: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
        table: ["13px", { lineHeight: "1.35" }],
      },
    },
  },
  plugins: [],
};
export default config;
