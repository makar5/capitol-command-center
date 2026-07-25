"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { credentialsMatch, SESSION_COOKIE, SESSION_VALUE } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_PROJECT_ID } from "@/lib/projects";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  if (!credentialsMatch(parsed.data.email, parsed.data.password)) {
    return { error: "Those credentials don't match the demo account." };
  }

  cookies().set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.VERCEL === "1",
  });

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

  redirect(project ? `/projects/${project.id}` : "/");
}

export async function logoutAction(): Promise<void> {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  redirect("/login");
}
