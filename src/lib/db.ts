import { existsSync, copyFileSync, mkdirSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

/**
 * On Vercel, SQLite must live under /tmp (the deploy bundle is read-only).
 * We ship a seeded prisma/demo.db and copy it once per instance.
 */
function ensureDatabaseUrl(): void {
  if (process.env.DATABASE_URL && !process.env.VERCEL) {
    return;
  }

  if (process.env.VERCEL) {
    const target = "/tmp/coecap-demo.db";
    const source = path.join(process.cwd(), "prisma", "demo.db");
    if (!existsSync(target) && existsSync(source)) {
      mkdirSync("/tmp", { recursive: true });
      copyFileSync(source, target);
    }
    process.env.DATABASE_URL = `file:${target}`;
    return;
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
  }
}

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
