import { format, formatDistanceToNowStrict, differenceInCalendarDays } from "date-fns";

export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function formatCurrencyCompact(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(dollars);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatDate(date: Date | string): string {
  return format(typeof date === "string" ? new Date(date) : date, "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(typeof date === "string" ? new Date(date) : date, "MMM d, yyyy h:mm a");
}

export function formatShortDate(date: Date | string): string {
  return format(typeof date === "string" ? new Date(date) : date, "MM/dd/yyyy");
}

export function daysBetween(a: Date, b: Date): number {
  return differenceInCalendarDays(b, a);
}

export function relativeDays(date: Date | string): string {
  return formatDistanceToNowStrict(typeof date === "string" ? new Date(date) : date, {
    addSuffix: true,
  });
}

export function qty(value: number | null | undefined, unit?: string | null): string {
  if (value == null) return "—";
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}
