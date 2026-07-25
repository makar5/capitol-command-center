import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAuthenticatedSession, SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_PROJECT_ID } from "@/lib/projects";

export default async function HomePage() {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!isAuthenticatedSession(session)) {
    redirect("/login");
  }

  const flagship = await db.project.findUnique({
    where: { id: DEFAULT_PROJECT_ID },
    select: { id: true },
  });
  const project =
    flagship ??
    (await db.project.findFirst({
      orderBy: { startDate: "asc" },
      select: { id: true },
    }));

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page p-8">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
          <h1 className="text-lg font-semibold text-ink">No project seeded</h1>
          <p className="mt-2 text-sm text-slate-600">
            Run{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              npx prisma db seed
            </code>{" "}
            to load the demo portfolio.
          </p>
        </div>
      </div>
    );
  }

  redirect(`/projects/${project.id}`);
}
