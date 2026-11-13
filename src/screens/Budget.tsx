import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpLeft,
  Banknote,
  Calculator,
  CalendarDays,
  Coins,
  Download,
  HandCoins,
  Layers,
  Package,
  Plus,
  Receipt,
  Scale,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Currency, Expense, Period, Revenue } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";
import { computeStats, useStore } from "@/lib/store";
import { downloadExcel } from "@/lib/excel";
import { formatDate, isInPeriod, num, safeNumber, toUsd, toSyp, todayISO } from "@/lib/format";
import { cn } from "@/utils/cn";
import { PageIntro } from "@/components/PageIntro";
import { DistributionChart, ProgressRing } from "@/components/Charts";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  SectionHeader,
  Segmented,
  Select,
  StatCard,
  Syp,
  Usd,
  useToast,
} from "@/components/ui";

function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (value: Currency) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]">
      {(
        [
          { value: "USD" as Currency, label: "دولار $" },
          { value: "SYP" as Currency, label: "ليرة ل.س" },
        ] as const
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg py-2 text-[11.5px] font-extrabold transition-all",
            value === option.value
              ? "bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-white"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function Budget({ onNavigate }: { onNavigate?: (tab: "debts") => void }) {
  const {
    state,
    addExpense,
    deleteExpense,
    addRevenue,
    deleteRevenue,
    markExported,
  } = useStore();
  const toast = useToast();
  const rate = state.exchangeRate;
  const [period, setPeriod] = useState<Period>("all");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<
    { kind: "expense" | "revenue"; id: string; label: string } | null
  >(null);

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    currency: "USD" as Currency,
    category: EXPENSE_CATEGORIES[0] as string,
    date: todayISO(),
  });
  const [revenueForm, setRevenueForm] = useState({
    description: "",
    amount: "",
    currency: "USD" as Currency,
    date: todayISO(),
  });

  const stats = useMemo(() => computeStats(state, period), [state, period]);

  const periodExpenses = useMemo(
    () =>
      state.expenses
        .filter((expense) => isInPeriod(expense.date, period))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.expenses, period],
  );
  const periodRevenues = useMemo(
    () =>
      state.revenues
        .filter((revenue) => isInPeriod(revenue.date, period))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.revenues, period],
  );

  const chartData = [
    { label: "المبيعات", value: stats.salesTotalUsd, color: "#0ea5e9" },
    { label: "تكلفة المباع", value: stats.cogsUsd, color: "#6366f1" },
    { label: "المصاريف", value: stats.expensesTotalUsd, color: "#f97316" },
    {
      label: "صافي الربح",
      value: stats.netProfitUsd,
      color: stats.netProfitUsd >= 0 ? "#10b981" : "#f43f5e",
    },
  ];

  const denominator = Math.max(stats.salesTotalUsd, stats.cogsUsd + stats.expensesTotalUsd, 1);
  const cogsShare = (stats.cogsUsd / denominator) * 100;
  const expenseShare = (stats.expensesTotalUsd / denominator) * 100;
  const profitShare = Math.max(0, 100 - cogsShare - expenseShare);

  const expenseAmount = safeNumber(expenseForm.amount);
  const expenseUsd =
    expenseForm.currency === "USD" ? expenseAmount : toUsd(expenseAmount, "SYP", rate);
  const revenueAmount = safeNumber(revenueForm.amount);
  const revenueUsd =
    revenueForm.currency === "USD" ? revenueAmount : toUsd(revenueAmount, "SYP", rate);

  const exportNow = () => {
    downloadExcel(state);
    markExported();
    toast("تم إنشاء تقرير Excel ذي الأوراق الخمس");
  };

  const openExpense = () => {
    setExpenseForm({
      description: "",
      amount: "",
      currency: "USD",
      category: EXPENSE_CATEGORIES[0] as string,
      date: todayISO(),
    });
    setError("");
    setExpenseOpen(true);
  };

  const openRevenue = () => {
    setRevenueForm({
      description: "",
      amount: "",
      currency: "USD",
      date: todayISO(),
    });
    setError("");
    setRevenueOpen(true);
  };

  const submitExpense = () => {
    const amount = safeNumber(expenseForm.amount, NaN);
    if (!expenseForm.description.trim()) return setError("أدخل وصف المصروف");
    if (!Number.isFinite(amount) || amount <= 0) return setError("أدخل مبلغاً صحيحاً أكبر من صفر");
    const result = addExpense({
      description: expenseForm.description,
      amount,
      currency: expenseForm.currency,
      category: expenseForm.category,
      date: expenseForm.date,
    });
    if (!result.ok) return setError(result.error || "تعذّر الحفظ");
    setExpenseOpen(false);
    toast("تم تسجيل المصروف وتحديث الميزانية");
  };

  const submitRevenue = () => {
    const amount = safeNumber(revenueForm.amount, NaN);
    if (!revenueForm.description.trim()) return setError("أدخل وصف الإيراد");
    if (!Number.isFinite(amount) || amount <= 0) return setError("أدخل مبلغاً صحيحاً أكبر من صفر");
    const result = addRevenue({
      description: revenueForm.description,
      amount,
      currency: revenueForm.currency,
      date: revenueForm.date,
    });
    if (!result.ok) return setError(result.error || "تعذّر الحفظ");
    setRevenueOpen(false);
    toast("تم تسجيل الإيراد المتنوع");
  };

  return (
    <div>
      <PageIntro
        eyebrow="المركز المالي"
        title="ميزانية المحل"
        description="صورة كاملة عن المبيعات والتكاليف والمصاريف والديون، مع صافي الربح وقيمة البضاعة في المحل."
        icon={Wallet}
        actions={
          <>
            <Button variant="outline" icon={Download} onClick={exportNow} className="hidden sm:inline-flex">
              تصدير
            </Button>
            <Button variant="outline" icon={Coins} onClick={openRevenue}>
              إيراد
            </Button>
            <Button icon={Plus} onClick={openExpense}>
              إضافة مصروف
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">الفترة</span>
          <Segmented
            value={period}
            onChange={setPeriod}
            options={[
              { value: "today", label: "اليوم" },
              { value: "week", label: "الأسبوع" },
              { value: "month", label: "الشهر" },
              { value: "all", label: "الكل" },
            ]}
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] font-bold text-slate-400 dark:border-white/10 dark:bg-white/[0.03]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          سعر الصرف: <span className="num text-slate-700 dark:text-slate-200">{num(rate)}</span> ل.س / $
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard
          label="صافي الربح النهائي"
          valueUsd={stats.finalNetUsd}
          rate={rate}
          icon={stats.finalNetUsd >= 0 ? TrendingUp : TrendingDown}
          featured
          className="col-span-2"
          note={
            <span className="flex flex-wrap items-center gap-1.5">
              صافي الربح قبل الديون <Usd value={stats.netProfitUsd} unitClassName="text-violet-100" className="text-violet-100" />
              <span className="opacity-50">•</span>
              تأثير الديون{" "}
              <span className={stats.debtNetUsd >= 0 ? "text-emerald-200" : "text-rose-200"}>
                {stats.debtNetUsd >= 0 ? "+" : "−"}
                {num(Math.abs(stats.debtNetUsd), true)} $
              </span>
            </span>
          }
        />
        <StatCard
          label="إجمالي المبيعات"
          valueUsd={stats.salesTotalUsd}
          rate={rate}
          icon={Banknote}
          tone="blue"
          note={`${num(stats.salesCount)} عملية بيع في الفترة`}
        />
        <StatCard
          label="الربح الإجمالي"
          valueUsd={stats.grossProfitUsd}
          rate={rate}
          icon={TrendingUp}
          tone="green"
          note={`هامش الربح ${num(stats.marginPct)}%`}
        />
        <StatCard
          label="تكلفة البضاعة المباعة"
          valueUsd={stats.cogsUsd}
          rate={rate}
          icon={ShoppingCart}
          tone="indigo"
          note="Σ الكمية المباعة × سعر الشراء"
        />
        <StatCard
          label="إجمالي المصاريف"
          valueUsd={stats.expensesTotalUsd}
          rate={rate}
          icon={Receipt}
          tone="orange"
          note={`${num(periodExpenses.length)} مصروف في الفترة`}
        />
        <StatCard
          label="الإيرادات الأخرى"
          valueUsd={stats.revenuesTotalUsd}
          rate={rate}
          icon={Coins}
          tone="violet"
          note={`${num(periodRevenues.length)} إيراد متنوع`}
        />
        <StatCard
          label="قيمة البضاعة الحالية"
          valueUsd={stats.inventoryValueUsd}
          rate={rate}
          icon={Package}
          tone="teal"
          note={`${num(stats.itemsCount)} صنف · ${num(stats.piecesCount)} قطعة`}
        />
      </div>

      <div className="card mt-3 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <HandCoins className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[12.5px] font-extrabold text-slate-800 dark:text-white">
                الديون غير المسددة وتأثيرها على الصافي
              </p>
              <p className="text-[10px] font-medium text-slate-400">
                صافي الربح النهائي = صافي الربح قبل الديون + ديون لنا − ديون علينا
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.("debts")}>
            إدارة الديون
          </Button>
        </div>
        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-x-reverse sm:divide-y-0 dark:divide-white/5">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <ArrowUpLeft className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold text-slate-400">ديون لنا · له</p>
              <Usd value={stats.receivableUsd} className="text-[14px] font-extrabold text-emerald-600" />
            </div>
            <Syp usd={stats.receivableUsd} rate={rate} className="mr-auto text-[10px] font-bold text-slate-400" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
              <ArrowDownRight className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold text-slate-400">ديون علينا · عليه</p>
              <Usd value={stats.payableUsd} className="text-[14px] font-extrabold text-rose-600" />
            </div>
            <Syp usd={stats.payableUsd} rate={rate} className="mr-auto text-[10px] font-bold text-slate-400" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
              <Scale className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold text-slate-400">صافي تأثير الديون</p>
              <span className={cn("num text-[14px] font-extrabold", stats.debtNetUsd >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {stats.debtNetUsd >= 0 ? "+" : "−"}
                {num(Math.abs(stats.debtNetUsd), true)} $
              </span>
            </div>
            <Syp usd={stats.debtNetUsd} rate={rate} className="mr-auto text-[10px] font-bold text-slate-400" />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-5">
        <div className="card p-4 xl:col-span-3">
          <SectionHeader
            icon={TrendingUp}
            title="الأداء المالي للفترة"
            subtitle="مقارنة المبيعات مع التكلفة والمصاريف وصافي الربح"
            action={
              <div className="flex flex-wrap items-center gap-2 text-[9.5px] font-bold text-slate-400">
                {chartData.map((item) => (
                  <span key={item.label} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                ))}
              </div>
            }
          />
          <div className="mt-3 text-slate-300 dark:text-slate-600">
            <DistributionChart data={chartData} />
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[10.5px] font-bold text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {period === "today"
                ? "اليوم"
                : period === "week"
                  ? "آخر ٧ أيام"
                  : period === "month"
                    ? "هذا الشهر"
                    : "كل الفترات"}
            </span>
            <span>
              صافي الربح قبل الديون:{" "}
              <span className={cn("font-extrabold", stats.netProfitUsd >= 0 ? "text-emerald-600" : "text-rose-600")}>
                <Usd value={stats.netProfitUsd} />
              </span>
            </span>
          </div>
        </div>

        <div className="card flex flex-col p-4 xl:col-span-2">
          <SectionHeader icon={Layers} title="ملخص تنفيذي" subtitle="كيف توزّعت مبيعات الفترة؟" />
          <div className="mt-4">
            <ProgressRing
              percentage={Math.abs(stats.marginPct)}
              label="هامش الربح الإجمالي"
              sub={`${num(stats.marginPct)}% من إجمالي المبيعات`}
              tone="emerald"
            />
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>تكلفة المباع</span>
              <span>المصاريف</span>
              <span>الربح</span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <span className="h-full bg-indigo-500" style={{ width: `${cogsShare}%` }} />
              <span className="h-full bg-orange-400" style={{ width: `${expenseShare}%` }} />
              <span
                className="h-full bg-emerald-500"
                style={{ width: `${Math.min(profitShare, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10.5px] font-bold">
              <span className="text-slate-500 dark:text-slate-400">إجمالي المبيعات</span>
              <Usd value={stats.salesTotalUsd} className="text-slate-800 dark:text-white" />
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-dashed border-slate-100 pt-3 text-[11px] dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> تكلفة البضاعة
              </span>
              <span className="flex items-center gap-2">
                <Usd value={stats.cogsUsd} className="font-extrabold text-slate-700 dark:text-slate-200" />
                <span className="num w-9 text-left font-bold text-slate-400">{num((stats.cogsUsd / denominator) * 100)}%</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full bg-orange-400" /> المصاريف
              </span>
              <span className="flex items-center gap-2">
                <Usd value={stats.expensesTotalUsd} className="font-extrabold text-slate-700 dark:text-slate-200" />
                <span className="num w-9 text-left font-bold text-slate-400">{num((stats.expensesTotalUsd / denominator) * 100)}%</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> صافي الربح قبل الديون
              </span>
              <span className={cn("font-extrabold", stats.netProfitUsd >= 0 ? "text-emerald-600" : "text-rose-600")}>
                <Usd value={stats.netProfitUsd} />
              </span>
            </div>
          </div>
          {stats.netProfitUsd < 0 && (
            <p className="mt-3 rounded-lg bg-rose-50 px-2.5 py-2 text-[10px] font-bold leading-relaxed text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              مصاريف الفترة أعلى من أرباح المبيعات — راجع بنود المصاريف أدناه.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-5">
        <div className="card overflow-hidden xl:col-span-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-4 dark:border-white/5">
            <SectionHeader icon={Receipt} title="المصاريف" subtitle="إيجار، كهرباء، رواتب، مواصلات…" />
            <Button size="sm" icon={Plus} onClick={openExpense}>
              مصروف
            </Button>
          </div>
          {periodExpenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="لا توجد مصاريف في هذه الفترة"
              description="أضف مصاريف المحل لتظهر في حساب صافي الربح تلقائياً."
              action={
                <Button size="sm" icon={Plus} onClick={openExpense}>
                  إضافة مصروف
                </Button>
              }
            />
          ) : (
            <>
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full min-w-[540px] border-collapse text-right text-[11.5px]">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-[#101f35]">
                    <tr className="text-[10px] font-extrabold text-slate-400">
                      <th className="px-4 py-2.5 font-extrabold">الوصف</th>
                      <th className="px-3 py-2.5 font-extrabold">التصنيف</th>
                      <th className="px-3 py-2.5 font-extrabold">المبلغ</th>
                      <th className="px-3 py-2.5 font-extrabold">بالدولار</th>
                      <th className="px-3 py-2.5 font-extrabold">التاريخ</th>
                      <th className="px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {periodExpenses.map((expense: Expense) => {
                      const usd = toUsd(expense.amount, expense.currency, rate);
                      return (
                        <tr
                          key={expense.id}
                          className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/60 dark:border-white/[0.04] dark:hover:bg-white/[0.02]"
                        >
                          <td className="max-w-[190px] px-4 py-2.5">
                            <p className="truncate font-extrabold text-slate-700 dark:text-slate-200">
                              {expense.description}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="rounded-md bg-orange-50 px-2 py-1 text-[9.5px] font-bold text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
                              {expense.category}
                            </span>
                          </td>
                          <td className="num px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400">
                            {num(expense.amount)}
                            <span className="mr-1 text-[9px] opacity-70">
                              {expense.currency === "USD" ? "$" : "ل.س"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <Usd value={usd} className="font-extrabold text-slate-800 dark:text-slate-100" />
                          </td>
                          <td className="px-3 py-2.5 text-[10px] font-bold text-slate-400">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-2 py-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "expense",
                                  id: expense.id,
                                  label: expense.description,
                                })
                              }
                              aria-label={`حذف مصروف ${expense.description}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-orange-50/40 px-4 py-3 dark:border-white/5 dark:bg-orange-500/[0.04]">
                <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  إجمالي المصاريف ({num(periodExpenses.length)})
                </span>
                <span className="flex items-center gap-2">
                  <Usd value={stats.expensesTotalUsd} className="text-[13px] font-extrabold text-orange-600" />
                  <Syp usd={stats.expensesTotalUsd} rate={rate} className="hidden text-[10px] font-bold text-slate-400 sm:inline-flex" />
                </span>
              </div>
            </>
          )}
        </div>

        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-4 dark:border-white/5">
            <SectionHeader icon={Coins} title="إيرادات أخرى" subtitle="دخل خارج المبيعات" />
            <Button size="sm" variant="violet" icon={Plus} onClick={openRevenue}>
              إيراد
            </Button>
          </div>
          {periodRevenues.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="لا توجد إيرادات متنوعة"
              description="أضف أي دخل خارج المبيعات، مثل خدمات أو بيع أصول."
              action={
                <Button size="sm" variant="violet" icon={Plus} onClick={openRevenue}>
                  إضافة إيراد
                </Button>
              }
            />
          ) : (
            <>
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full min-w-[320px] border-collapse text-right text-[11.5px]">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-[#101f35]">
                    <tr className="text-[10px] font-extrabold text-slate-400">
                      <th className="px-4 py-2.5 font-extrabold">الوصف</th>
                      <th className="px-3 py-2.5 font-extrabold">المبلغ</th>
                      <th className="px-3 py-2.5 font-extrabold">التاريخ</th>
                      <th className="px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {periodRevenues.map((revenue: Revenue) => {
                      const usd = toUsd(revenue.amount, revenue.currency, rate);
                      return (
                        <tr
                          key={revenue.id}
                          className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/60 dark:border-white/[0.04] dark:hover:bg-white/[0.02]"
                        >
                          <td className="max-w-[170px] px-4 py-2.5">
                            <p className="truncate font-extrabold text-slate-700 dark:text-slate-200">
                              {revenue.description}
                            </p>
                            <p className="mt-0.5 text-[9px] font-bold text-slate-400">
                              {revenue.currency === "USD" ? "دولار" : "ليرة سورية"}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <Usd value={usd} className="font-extrabold text-violet-600 dark:text-violet-300" />
                          </td>
                          <td className="px-3 py-2.5 text-[10px] font-bold text-slate-400">{formatDate(revenue.date)}</td>
                          <td className="px-2 py-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "revenue",
                                  id: revenue.id,
                                  label: revenue.description,
                                })
                              }
                              aria-label={`حذف إيراد ${revenue.description}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-violet-50/40 px-4 py-3 dark:border-white/5 dark:bg-violet-500/[0.05]">
                <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  إجمالي الإيرادات
                </span>
                <span className="flex items-center gap-2">
                  <Usd value={stats.revenuesTotalUsd} className="text-[13px] font-extrabold text-violet-600 dark:text-violet-300" />
                  <Syp usd={stats.revenuesTotalUsd} rate={rate} className="hidden text-[10px] font-bold text-slate-400 sm:inline-flex" />
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card mt-3 flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
          <Calculator className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200">
            طريقة الحساب داخل بَطّة
          </p>
          <p className="mt-1 text-[10.5px] font-medium leading-relaxed text-slate-400">
            قيمة البضاعة = Σ (الكمية × سعر الشراء) • إجمالي المبيعات = Σ عمليات البيع • تكلفة المباع =
            Σ (الكمية المباعة × سعر شراء الصنف) • الربح الإجمالي = المبيعات − التكلفة • صافي الربح
            النهائي = الربح الإجمالي − المصاريف + الإيرادات الأخرى + الديون لنا − الديون علينا.
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[10px] font-extrabold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          سعر الصرف الحالي {num(rate)} ل.س
        </span>
      </div>

      {/* expense modal */}
      <Modal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        title="إضافة مصروف"
        subtitle="يُخصم المصروف من صافي ربح الفترة ويظهر في تقرير Excel."
        icon={Receipt}
        footer={
          <>
            <Button variant="outline" onClick={() => setExpenseOpen(false)}>
              إلغاء
            </Button>
            <Button icon={Plus} onClick={submitExpense}>
              حفظ المصروف
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="وصف المصروف" htmlFor="expense-description">
            <Input
              id="expense-description"
              value={expenseForm.description}
              onChange={(event) =>
                setExpenseForm({ ...expenseForm, description: event.target.value })
              }
              placeholder="مثال: فاتورة كهرباء شهر كانون الثاني"
              autoFocus
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="المبلغ" htmlFor="expense-amount">
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })}
                placeholder="0.00"
              />
            </Field>
            <div>
              <span className="label-base">عملة المبلغ</span>
              <CurrencyToggle
                value={expenseForm.currency}
                onChange={(currency) => setExpenseForm({ ...expenseForm, currency })}
              />
            </div>
            <Field label="تصنيف المصروف" htmlFor="expense-category">
              <Select
                id="expense-category"
                value={expenseForm.category}
                onChange={(event) =>
                  setExpenseForm({ ...expenseForm, category: event.target.value })
                }
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="التاريخ" htmlFor="expense-date">
              <Input
                id="expense-date"
                type="date"
                value={expenseForm.date}
                onChange={(event) => setExpenseForm({ ...expenseForm, date: event.target.value })}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 px-3.5 py-3 dark:border-orange-500/15 dark:bg-orange-500/[0.06]">
            <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300">
              القيمة بالدولار / الليرة
            </span>
            <span className="flex items-center gap-2">
              <Usd value={expenseUsd} className="text-[13px] font-extrabold text-orange-700 dark:text-orange-300" />
              <span className="text-orange-300">•</span>
              <span className="num text-[12px] font-extrabold text-orange-700 dark:text-orange-300">
                {num(toSyp(expenseUsd, rate))} ل.س
              </span>
            </span>
          </div>
          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11.5px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>
      </Modal>

      {/* revenue modal */}
      <Modal
        open={revenueOpen}
        onClose={() => setRevenueOpen(false)}
        title="إضافة إيراد متنوع"
        subtitle="أي دخل خارج المبيعات — خدمات، بيع أصول، عمولات…"
        icon={Coins}
        footer={
          <>
            <Button variant="outline" onClick={() => setRevenueOpen(false)}>
              إلغاء
            </Button>
            <Button variant="violet" icon={Plus} onClick={submitRevenue}>
              حفظ الإيراد
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="وصف الإيراد" htmlFor="revenue-description">
            <Input
              id="revenue-description"
              value={revenueForm.description}
              onChange={(event) =>
                setRevenueForm({ ...revenueForm, description: event.target.value })
              }
              placeholder="مثال: خدمة تغليف هدايا"
              autoFocus
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="المبلغ" htmlFor="revenue-amount">
              <Input
                id="revenue-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={revenueForm.amount}
                onChange={(event) => setRevenueForm({ ...revenueForm, amount: event.target.value })}
                placeholder="0.00"
              />
            </Field>
            <div>
              <span className="label-base">عملة المبلغ</span>
              <CurrencyToggle
                value={revenueForm.currency}
                onChange={(currency) => setRevenueForm({ ...revenueForm, currency })}
              />
            </div>
          </div>
          <Field label="التاريخ" htmlFor="revenue-date">
            <Input
              id="revenue-date"
              type="date"
              value={revenueForm.date}
              onChange={(event) => setRevenueForm({ ...revenueForm, date: event.target.value })}
            />
          </Field>
          <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/60 px-3.5 py-3 dark:border-violet-500/15 dark:bg-violet-500/[0.06]">
            <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300">
              القيمة بالدولار / الليرة
            </span>
            <span className="flex items-center gap-2">
              <Usd value={revenueUsd} className="text-[13px] font-extrabold text-violet-700 dark:text-violet-300" />
              <span className="text-violet-300">•</span>
              <span className="num text-[12px] font-extrabold text-violet-700 dark:text-violet-300">
                {num(toSyp(revenueUsd, rate))} ل.س
              </span>
            </span>
          </div>
          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11.5px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.kind === "expense" ? "حذف المصروف" : "حذف الإيراد"}
        message={`سيتم حذف «${deleteTarget?.label ?? ""}» وتحديث حسابات الميزانية فوراً.`}
        confirmLabel="حذف"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            if (deleteTarget.kind === "expense") deleteExpense(deleteTarget.id);
            else deleteRevenue(deleteTarget.id);
            toast("تم الحذف وتحديث الميزانية", "info");
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
