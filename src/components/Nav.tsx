import {
  Download,
  FileSpreadsheet,
  HandCoins,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import type { TabKey } from "@/types";
import { useStore } from "@/lib/store";
import { downloadExcel } from "@/lib/excel";
import { formatDateTime, num } from "@/lib/format";
import { cn } from "@/utils/cn";
import { Logo } from "./Logo";
import { useToast } from "./ui";

const NAV_ITEMS: Array<{
  key: TabKey;
  label: string;
  description: string;
  icon: typeof Package;
}> = [
  { key: "inventory", label: "الجرد", description: "الأصناف والكميات", icon: Package },
  { key: "sales", label: "المعاملات", description: "المبيعات والأرباح", icon: ShoppingCart },
  { key: "debts", label: "الديون", description: "ما لنا وما علينا", icon: HandCoins },
  { key: "budget", label: "الميزانية", description: "المؤشرات والمصاريف", icon: Wallet },
];

export function Sidebar({
  active,
  onChange,
  onOpenSettings,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  onOpenSettings: () => void;
}) {
  const { state, markExported } = useStore();
  const toast = useToast();
  const unsettledDebts = state.debts.filter((d) => !d.settled).length;

  const counts: Record<TabKey, number | null> = {
    inventory: state.items.length,
    sales: state.sales.length,
    debts: unsettledDebts,
    budget: null,
  };

  const handleExport = () => {
    const filename = downloadExcel(state);
    markExported();
    toast(`تم تصدير ${filename}`);
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-[268px] shrink-0 flex-col overflow-hidden bg-linear-to-b from-ink-900 via-ink-900 to-ink-950 lg:flex">
      <div className="pointer-events-none absolute -right-16 top-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative px-5 pb-5 pt-6">
        <Logo withText subtitle={state.shopName} markClassName="h-11 w-11" />
      </div>

      <div className="relative px-5">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
            </span>
            يعمل دون إنترنت
          </span>
          <span className="num rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] font-bold text-slate-400">
            v1.0
          </span>
        </div>
      </div>

      <nav className="relative mt-5 flex-1 overflow-y-auto px-3.5" aria-label="التنقل الرئيسي">
        <p className="mb-2 px-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
          الأقسام الرئيسية
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const count = counts[item.key];
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onChange(item.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "focus-ring group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-right transition-all duration-200",
                    isActive
                      ? "bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "hover:bg-white/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-colors",
                      isActive
                        ? "bg-brand-500 text-white shadow-[0_6px_16px_-6px_rgba(28,184,120,0.8)]"
                        : "bg-white/[0.05] text-slate-400 group-hover:text-slate-200",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[13px] font-bold leading-tight",
                        isActive ? "text-white" : "text-slate-300",
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500">
                      {item.description}
                    </span>
                  </span>
                  {count !== null && count > 0 && (
                    <span
                      className={cn(
                        "num rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold",
                        isActive
                          ? "bg-brand-500/20 text-brand-200"
                          : "bg-white/[0.06] text-slate-400",
                      )}
                    >
                      {num(count)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mb-2 mt-6 px-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
          أدوات
        </p>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={onOpenSettings}
              className="focus-ring group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-right transition-colors hover:bg-white/[0.04]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.05] text-slate-400 transition-colors group-hover:text-slate-200">
                <Settings className="h-[18px] w-[18px]" strokeWidth={2.1} />
              </span>
              <span className="flex-1 text-[13px] font-bold text-slate-300">الإعدادات والنسخ</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={handleExport}
              className="focus-ring group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-right transition-colors hover:bg-white/[0.04]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.05] text-slate-400 transition-colors group-hover:text-slate-200">
                <FileSpreadsheet className="h-[18px] w-[18px]" strokeWidth={2.1} />
              </span>
              <span className="flex-1 text-[13px] font-bold text-slate-300">تصدير Excel</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="relative mx-3.5 mb-3 rounded-2xl border border-white/[0.07] bg-linear-to-br from-white/[0.07] to-white/[0.02] p-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-brand-300">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-extrabold text-white">نسخة Excel تلقائية</p>
            <p className="text-[9.5px] font-medium text-slate-400">عند كل خروج من التطبيق</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-400">
          <span className="h-1 w-1 rounded-full bg-brand-400" />
          {state.lastExportAt ? `آخر تصدير: ${formatDateTime(state.lastExportAt)}` : "لم يتم التصدير بعد"}
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="focus-ring mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-brand-400"
        >
          <Download className="h-3.5 w-3.5" />
          تنزيل نسخة الآن
        </button>
      </div>

      <div className="relative border-t border-white/[0.07] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-extrabold tracking-[0.08em] text-white">Y.A.M</p>
            <p className="mt-0.5 text-[9px] font-medium text-slate-500">© 2026 جميع الحقوق محفوظة</p>
          </div>
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold text-slate-400">
            Android 6+
          </span>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const { state } = useStore();
  const unsettled = state.debts.filter((d) => !d.settled).length;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/90 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden dark:border-white/[0.08] dark:bg-[#091426]/95"
      aria-label="التنقل السفلي"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          const badge =
            item.key === "debts" ? unsettled : item.key === "inventory" ? state.items.length : 0;
          return (
            <li key={item.key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(item.key)}
                aria-current={isActive ? "page" : undefined}
                className="focus-ring group relative flex w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5"
              >
                <span
                  className={cn(
                    "relative flex h-8 w-12 items-center justify-center rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-brand-500 text-white shadow-[0_8px_16px_-8px_rgba(28,184,120,0.9)]"
                      : "text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 dark:group-hover:bg-white/[0.06] dark:group-hover:text-slate-200",
                  )}
                >
                  <item.icon className="h-[19px] w-[19px]" strokeWidth={2.1} />
                  {badge > 0 && (
                    <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink-900 px-1 text-[8.5px] font-extrabold text-white ring-2 ring-white dark:bg-white dark:text-ink-900 dark:ring-[#091426]">
                      {badge > 99 ? "99+" : num(badge)}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold leading-none transition-colors",
                    isActive ? "text-brand-700 dark:text-brand-400" : "text-slate-400",
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
