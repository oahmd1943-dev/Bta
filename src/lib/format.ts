import type { Currency, Period } from "@/types";

const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const twoFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Full grouped number, no currency. */
export function num(value: number, decimals = false): string {
  const safe = Number.isFinite(value) ? value : 0;
  return decimals ? twoFmt.format(safe) : intFmt.format(Math.round(safe));
}

/** Grouped number keeping up to 2 decimals when needed. */
export function amount(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return Number.isInteger(safe) ? intFmt.format(safe) : twoFmt.format(safe);
}

export function compact(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  if (abs >= 1_000_000) return `${twoFmt.format(safe / 1_000_000)}م`;
  if (abs >= 10_000) return `${intFmt.format(Math.round(safe / 1000))}ألف`;
  return intFmt.format(Math.round(safe));
}

export function usdText(value: number): string {
  return `${amount(value)} $`;
}

export function sypText(value: number): string {
  return `${num(value)} ل.س`;
}

export function toUsd(value: number, currency: Currency, rate: number): number {
  if (currency === "USD") return value;
  return rate > 0 ? value / rate : 0;
}

export function toSyp(valueUsd: number, rate: number): number {
  return valueUsd * (Number.isFinite(rate) ? rate : 0);
}

export function percent(value: number, total: number): number {
  if (!total) return 0;
  return clamp((value / total) * 100, -999, 999);
}

export function todayISO(): string {
  const d = new Date();
  return dateInput(d);
}

export function dateInput(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(value: string | undefined): Date {
  if (!value) return new Date(NaN);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  return new Date(value);
}

const dateFmt = new Intl.DateTimeFormat("ar-SY-u-nu-latn", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateOnlyFmt = new Intl.DateTimeFormat("ar-SY-u-nu-latn", {
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat("ar-SY-u-nu-latn", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value?: string): string {
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function formatShortDate(value?: string): string {
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateOnlyFmt.format(d);
}

export function formatTime(value?: string): string {
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return timeFmt.format(d);
}

export function formatDateTime(value?: string): string {
  if (!value) return "—";
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export const PERIOD_LABELS: Record<Period, string> = {
  today: "اليوم",
  week: "آخر ٧ أيام",
  month: "هذا الشهر",
  all: "الكل",
};

export function periodStart(period: Period): number {
  const now = new Date();
  if (period === "all") return 0;
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (period === "week") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - 6);
    return d.getTime();
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export function isInPeriod(value: string | undefined, period: Period): boolean {
  if (period === "all") return true;
  const d = parseDate(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() >= periodStart(period);
}

export function fileStamp(date = new Date()): string {
  const p = (v: number) => `${v}`.padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_${p(
    date.getHours(),
  )}-${p(date.getMinutes())}`;
}

export function daysAgo(days: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, Math.floor(Math.random() * 50), 0, 0);
  return d.toISOString();
}
