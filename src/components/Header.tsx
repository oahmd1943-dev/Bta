import { useEffect, useId, useState } from "react";
import {
  CircleDollarSign,
  Download,
  Moon,
  RefreshCw,
  Settings,
  Share2,
  Sun,
} from "lucide-react";
import type { TabKey } from "@/types";
import { useStore } from "@/lib/store";
import { downloadExcel, shareExcel } from "@/lib/excel";
import { num, safeNumber } from "@/lib/format";
import { cn } from "@/utils/cn";
import { Logo } from "./Logo";
import { Button, useToast } from "./ui";

export const TAB_META: Record<TabKey, { label: string; description: string }> = {
  inventory: { label: "الجرد", description: "كل الأصناف والكميات في مكان واحد" },
  sales: { label: "المعاملات", description: "سجل المبيعات والأرباح" },
  debts: { label: "الديون", description: "ما لنا وما علينا" },
  budget: { label: "الميزانية", description: "الوضع المالي للمحل بنظرة واحدة" },
};

const arDate = new Intl.DateTimeFormat("ar-SY-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function RateWidget({ full = false }: { full?: boolean }) {
  const { state, setExchangeRate } = useStore();
  const toast = useToast();
  const inputId = useId();
  const [draft, setDraft] = useState(String(state.exchangeRate));

  useEffect(() => {
    setDraft(String(state.exchangeRate));
  }, [state.exchangeRate]);

  const submit = () => {
    const value = safeNumber(draft, 0);
    if (value <= 0) {
      toast("أدخل سعر صرف صحيحاً أكبر من صفر", "error");
      setDraft(String(state.exchangeRate));
      return;
    }
    const next = Math.round(value);
    if (next === state.exchangeRate) {
      toast("سعر الصرف الحالي مطبّق على كل التبويبات بالفعل", "info");
      return;
    }
    setExchangeRate(next);
    toast(`تم التحديث إلى ${num(next)} ل.س — أُعيد حساب كل الأسعار`);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className={cn(
        "flex items-center gap-2 rounded-xl border p-1.5 transition-colors",
        full ? "w-full" : "",
        "border-slate-200 bg-slate-50/80 focus-within:border-brand-400 dark:border-white/10 dark:bg-white/[0.04]",
      )}
      aria-label="تحديث سعر الصرف"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300">
        <CircleDollarSign className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <div className={cn("min-w-0", full ? "flex-1" : "")}>
        <label
          htmlFor={inputId}
          className="block text-[9.5px] font-bold leading-none text-slate-400 dark:text-slate-500"
        >
          سعر الصرف · ل.س / $
        </label>
        <div className="mt-0.5 flex items-baseline gap-1">
          <input
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            dir="ltr"
            className="num w-[58px] min-w-0 bg-transparent text-[13px] font-extrabold text-slate-800 outline-none dark:text-white"
            aria-label="سعر صرف الدولار بالليرة السورية"
          />
          <span className="text-[9px] font-bold text-slate-400">ل.س</span>
        </div>
      </div>
      <Button type="submit" size="sm" variant="primary" icon={RefreshCw} className="!h-8 !rounded-lg">
        تحديث
      </Button>
    </form>
  );
}

export function Header({
  active,
  onOpenSettings,
}: {
  active: TabKey;
  onOpenSettings: () => void;
}) {
  const { state, markExported, toggleTheme } = useStore();
  const toast = useToast();
  const meta = TAB_META[active];

  const handleExport = () => {
    const filename = downloadExcel(state);
    markExported();
    toast(`تم إنشاء ${filename} — 5 أوراق Excel`);
  };

  const handleShare = async () => {
    const result = await shareExcel(state);
    if (result === "shared") {
      markExported();
      toast("تم تجهيز التقرير للمشاركة");
    } else if (result === "downloaded") {
      markExported();
      toast("مشاركة الملفات غير مدعومة هنا — تم تنزيل التقرير", "info");
    } else {
      toast("تعذّرت المشاركة، جرّب زر التصدير", "error");
    }
  };

  return (
    <>
      {/* mobile brand bar */}
      <header className="sticky top-0 z-40 overflow-hidden rounded-b-[26px] bg-linear-to-br from-ink-900 via-ink-800 to-ink-700 px-4 pb-4 pt-4 shadow-[0_18px_36px_-24px_rgba(8,24,48,0.9)] lg:hidden">
        <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-20 top-0 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-3">
          <Logo withText subtitle={state.shopName} markClassName="h-10 w-10" />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="تبديل الوضع الليلي"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/90 ring-1 ring-white/10 transition hover:bg-white/15"
            >
              {state.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleExport}
              aria-label="تصدير Excel"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/90 ring-1 ring-white/10 transition hover:bg-white/15"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="الإعدادات"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/90 ring-1 ring-white/10 transition hover:bg-white/15"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="relative mt-3">
          <div className="rounded-2xl bg-white/[0.07] p-1 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="[&_label]:!text-slate-300/80 [&_span]:!text-slate-400">
              <RateWidget full />
            </div>
          </div>
        </div>
      </header>

      {/* desktop header */}
      <header className="sticky top-0 z-30 hidden border-b border-slate-200/70 bg-white/85 backdrop-blur-xl lg:block dark:border-white/[0.06] dark:bg-[#081327]/85">
        <div className="flex h-[72px] items-center justify-between gap-4 px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
              <span>بَطّة</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-brand-600 dark:text-brand-400">{meta.label}</span>
            </div>
            <h1 className="truncate text-lg font-extrabold text-slate-900 dark:text-white">
              {meta.label}
              <span className="mr-2 hidden text-[11.5px] font-medium text-slate-400 xl:inline">
                {meta.description}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10.5px] font-bold text-slate-400 xl:flex dark:bg-white/[0.04] dark:text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {arDate.format(new Date())}
            </span>
            <div className="w-[220px]">
              <RateWidget />
            </div>
            <span className="h-7 w-px bg-slate-200 dark:bg-white/10" />
            <Button variant="outline" size="icon" onClick={handleShare} aria-label="مشاركة التقرير" title="مشاركة ملف Excel">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="تبديل الوضع الليلي" title="الوضع الليلي">
              {state.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="dark" icon={Download} onClick={handleExport}>
              تصدير Excel
            </Button>
            <Button variant="outline" size="icon" onClick={onOpenSettings} aria-label="الإعدادات" title="الإعدادات">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
