export const SESSION_COOKIE = "coecap-session";
export const SESSION_VALUE = "capitol-demo-v1";

export type DemoAccount = {
  email: string;
  password: string;
  name: string;
  title: string;
};

/** Hardcoded demo login for sales meetings — not real authentication. */
export const DEMO_ACCOUNT: DemoAccount = {
  email: "demo@capitolcommand.com",
  password: "demo",
  name: "Alex Rivera",
  title: "Project controls",
};

export function credentialsMatch(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_ACCOUNT.email &&
    password === DEMO_ACCOUNT.password
  );
}

export function isAuthenticatedSession(value: string | undefined): boolean {
  return value === SESSION_VALUE;
}
