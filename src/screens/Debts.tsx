import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpLeft,
  Check,
  CheckCircle2,
  Download,
  HandCoins,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import type { Debt, DebtType } from "@/types";
import { useStore } from "@/lib/store";
import { downloadExcel } from "@/lib/excel";
import { formatDate, num, safeNumber, toSyp, todayISO } from "@/lib/format";
import { cn } from "@/utils/cn";
import { PageIntro } from "@/components/PageIntro";
import {
  Badge,
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  StatCard,
  Syp,
  Usd,
  useToast,
} from "@/components/ui";

type Filter = "all" | "open" | "له" | "عليه";

export default function Debts() {
  const { state, addDebt, toggleDebt, deleteDebt, markExported } = useStore();
  const toast = useToast();
  const rate = state.exchangeRate;

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    person: "",
    type: "له" as DebtType,
    amount: "",
    note: "",
    date: todayISO(),
  });

  const outstanding = state.debts.filter((debt) => !debt.settled);
  const receivable = outstanding
    .filter((debt) => debt.type === "له")
    .reduce((acc, debt) => acc + debt.amountUsd, 0);
  const payable = outstanding
    .filter((debt) => debt.type === "عليه")
    .reduce((acc, debt) => acc + debt.amountUsd, 0);
  const settledCount = state.debts.filter((debt) => debt.settled).length;
  const net = receivable - payable;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.debts
      .filter((debt) => {
        const matchesQuery =
          !q ||
          debt.person.toLowerCase().includes(q) ||
          debt.note.toLowerCase().includes(q);
        const matchesFilter =
          filter === "all"
            ? true
            : filter === "open"
              ? !debt.settled
              : debt.type === filter;
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (a.settled !== b.settled) return a.settled ? 1 : -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [state.debts, query, filter]);

  const filteredReceivable = filtered
    .filter((d) => d.type === "له" && !d.settled)
    .reduce((acc, d) => acc + d.amountUsd, 0);
  const filteredPayable = filtered
    .filter((d) => d.type === "عليه" && !d.settled)
    .reduce((acc, d) => acc + d.amountUsd, 0);

  const openNew = () => {
    setForm({
      person: "",
      type: "له",
      amount: "",
      note: "",
      date: todayISO(),
    });
    setError("");
    setOpenForm(true);
  };

  const submit = () => {
    const amount = safeNumber(form.amount, NaN);
    if (!form.person.trim()) return setError("اسم الشخص مطلوب");
    if (!Number.isFinite(amount) || amount <= 0) return setError("أدخل مبلغاً أكبر من صفر");
    const result = addDebt({
      person: form.person,
      type: form.type,
      amountUsd: amount,
      note: form.note,
      date: form.date,
    });
    if (!result.ok) return setError(result.error || "تعذّر الحفظ");
    setOpenForm(false);
    toast(`تم إضافة الدين على «${form.person.trim()}»`);
  };

  const exportNow = () => {
    downloadExcel(state);
    markExported();
    toast("تم تصدير تقرير Excel الكامل");
  };

  const formAmount = safeNumber(form.amount);

  return (
    <div>
      <PageIntro
        eyebrow="الحسابات"
        title="الديون"
        description="سجّل ما لك وما عليك بالدولار، ويُعرض المبلغ بالليرة السورية تلقائياً حسب سعر الصرف الحالي مع متابعة السداد."
        icon={HandCoins}
        actions={
          <>
            <Button variant="outline" icon={Download} onClick={exportNow}>
              تصدير
            </Button>
            <Button icon={Plus} onClick={openNew}>
              إضافة دين
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard
          label="ديون لنا · له"
          valueUsd={receivable}
          rate={rate}
          icon={ArrowUpLeft}
          tone="green"
          note="مستحقة لنا من الزبائن"
        />
        <StatCard
          label="ديون علينا · عليه"
          valueUsd={payable}
          rate={rate}
          icon={ArrowDownRight}
          tone="rose"
          note="مستحقة علينا للموردين"
        />
        <StatCard
          label="الصافي"
          valueUsd={net}
          rate={rate}
          icon={Scale}
          tone={net >= 0 ? "blue" : "orange"}
          note={net >= 0 ? "الوضع لصالح المحل" : "مبالغ مستحقة عليك أكثر"}
        />
        <StatCard
          label="ديون مسدّدة"
          valueCount={settledCount}
          icon={CheckCircle2}
          tone="teal"
          note={`${num(outstanding.length)} دين مفتوح حالياً`}
        />
      </div>

      <div className="card mt-4 overflow-hidden sm:mt-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3.5 dark:border-white/5 sm:p-4">
          <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-800 dark:text-white">
                سجل الديون
              </h2>
              <p className="mt-0.5 text-[11.5px] font-medium text-slate-400">
                الديون غير المسددة هي التي تدخل في حساب الميزانية
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث باسم الشخص…"
                className="h-9 pr-9 text-[12px] sm:w-56"
                aria-label="بحث في الديون"
              />
            </div>
          </div>
          <div className="-mx-0.5 flex items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5">
            <Chip active={filter === "all"} onClick={() => setFilter("all")} count={state.debts.length}>
              الكل
            </Chip>
            <Chip active={filter === "open"} onClick={() => setFilter("open")} count={outstanding.length}>
              غير مسددة
            </Chip>
            <Chip active={filter === "له"} onClick={() => setFilter("له")} count={state.debts.filter((d) => d.type === "له").length}>
              له
            </Chip>
            <Chip active={filter === "عليه"} onClick={() => setFilter("عليه")} count={state.debts.filter((d) => d.type === "عليه").length}>
              عليه
            </Chip>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title={state.debts.length === 0 ? "لا توجد ديون مسجلة" : "لا توجد ديون مطابقة"}
            description={
              state.debts.length === 0
                ? "أضف ديناً لشخص أو مورد، وتابع حالته حتى السداد."
                : "جرّب تغيير التصفية أو كلمة البحث."
            }
            action={
              <Button icon={Plus} onClick={openNew}>
                إضافة دين جديد
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-right text-[12px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10.5px] font-extrabold text-slate-400 dark:border-white/5 dark:bg-white/[0.025] dark:text-slate-500">
                    <th className="px-4 py-3 font-extrabold">الشخص</th>
                    <th className="px-3 py-3 font-extrabold">النوع</th>
                    <th className="px-3 py-3 font-extrabold">المبلغ $</th>
                    <th className="px-3 py-3 font-extrabold">المبلغ ل.س</th>
                    <th className="px-3 py-3 font-extrabold">الملاحظة</th>
                    <th className="px-3 py-3 font-extrabold">التاريخ</th>
                    <th className="px-3 py-3 font-extrabold">الحالة</th>
                    <th className="px-3 py-3 font-extrabold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((debt) => (
                    <tr
                      key={debt.id}
                      className={cn(
                        "border-b border-slate-100/80 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-white/[0.04] dark:hover:bg-white/[0.025]",
                        debt.settled && "opacity-70",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold",
                              debt.type === "له"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
                            )}
                          >
                            <User className="h-4 w-4" />
                          </span>
                          <span
                            className={cn(
                              "text-[12.5px] font-extrabold text-slate-800 dark:text-slate-100",
                              debt.settled && "line-through decoration-slate-300",
                            )}
                          >
                            {debt.person}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={debt.type === "له" ? "green" : "red"} dot>
                          {debt.type}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Usd value={debt.amountUsd} className="font-extrabold text-slate-800 dark:text-slate-100" />
                      </td>
                      <td className="px-3 py-3">
                        <Syp usd={debt.amountUsd} rate={rate} className="font-bold text-slate-500 dark:text-slate-400" />
                      </td>
                      <td className="max-w-[220px] px-3 py-3">
                        <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {debt.note || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[10.5px] font-bold text-slate-400">{formatDate(debt.date)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={debt.settled ? "green" : "amber"} dot>
                          {debt.settled ? "تم السداد" : "غير مسدد"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              toggleDebt(debt.id);
                              toast(
                                debt.settled
                                  ? `أُعيد فتح دين «${debt.person}»`
                                  : `تم سداد دين «${debt.person}» بنجاح`,
                                debt.settled ? "info" : "success",
                              );
                            }}
                            className={cn(
                              "focus-ring inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-extrabold transition",
                              debt.settled
                                ? "border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300",
                            )}
                          >
                            {debt.settled ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            {debt.settled ? "إعادة" : "تم السداد"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(debt)}
                            aria-label={`حذف دين ${debt.person}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2.5 p-3 md:hidden">
              {filtered.map((debt) => (
                <div
                  key={debt.id}
                  className={cn(
                    "rounded-2xl border border-slate-200/80 p-3.5 dark:border-white/[0.07]",
                    debt.settled && "opacity-75",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl",
                          debt.type === "له"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
                        )}
                      >
                        <User className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-100">
                          {debt.person}
                        </p>
                        <p className="mt-0.5 text-[10px] font-bold text-slate-400">{formatDate(debt.date)}</p>
                      </div>
                    </div>
                    <Badge tone={debt.settled ? "green" : "amber"} dot>
                      {debt.settled ? "مسدد" : "غير مسدد"}
                    </Badge>
                  </div>
                  <div className="mt-2.5 flex items-end justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/[0.03]">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400">المبلغ</p>
                      <Usd value={debt.amountUsd} className="text-[14px] font-extrabold text-slate-900 dark:text-white" />
                      <Syp usd={debt.amountUsd} rate={rate} className="mt-0.5 text-[9.5px] font-bold text-slate-400" />
                    </div>
                    <Badge tone={debt.type === "له" ? "green" : "red"}>{debt.type}</Badge>
                  </div>
                  {debt.note && (
                    <p className="mt-2 text-[10.5px] font-medium text-slate-400">{debt.note}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-100 pt-2 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        toggleDebt(debt.id);
                        toast(debt.settled ? "أُعيد فتح الدين" : "تم تسجيل السداد", debt.settled ? "info" : "success");
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-extrabold",
                        debt.settled ? "text-slate-500" : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {debt.settled ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                      {debt.settled ? "إعادة فتح" : "تم السداد"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(debt)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold text-rose-500"
                    >
                      <Trash2 className="h-3 w-3" />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3.5 dark:border-white/5 dark:bg-white/[0.02]">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {num(filtered.length)} دين معروض · الإجماليات غير المسددة فقط
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>
                  له: <Usd value={filteredReceivable} className="font-extrabold text-emerald-600" />
                </span>
                <span>
                  عليه: <Usd value={filteredPayable} className="font-extrabold text-rose-600" />
                </span>
                <span>
                  ل.س: <Syp usd={filteredReceivable - filteredPayable} rate={rate} className="font-extrabold text-slate-800 dark:text-white" />
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title="إضافة دين جديد"
        subtitle="حدّد إن كان المبلغ لك أم عليك، وسيُحسب بالليرة تلقائياً."
        icon={HandCoins}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              إلغاء
            </Button>
            <Button icon={Plus} onClick={submit}>
              حفظ الدين
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="label-base">نوع الدين</span>
            <div className="grid grid-cols-2 gap-2">
              {(["له", "عليه"] as DebtType[]).map((type) => {
                const active = form.type === type;
                const isForUs = type === "له";
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, type })}
                    className={cn(
                      "focus-ring flex items-center gap-2.5 rounded-xl border p-3 text-right transition-all",
                      active
                        ? isForUs
                          ? "border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-500/10 dark:border-emerald-400/40 dark:bg-emerald-500/10"
                          : "border-rose-400 bg-rose-50/80 ring-2 ring-rose-500/10 dark:border-rose-400/40 dark:bg-rose-500/10"
                        : "border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.03]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        isForUs
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-300",
                      )}
                    >
                      {isForUs ? <ArrowUpLeft className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </span>
                    <span>
                      <span className="block text-[12.5px] font-extrabold text-slate-800 dark:text-white">
                        {type}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                        {isForUs ? "مبلغ مستحق لنا" : "مبلغ مستحق علينا"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الشخص / الجهة" htmlFor="debt-person">
              <div className="relative">
                <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="debt-person"
                  value={form.person}
                  onChange={(event) => setForm({ ...form, person: event.target.value })}
                  placeholder="مثال: أحمد الحلبي"
                  className="pr-9"
                  autoFocus
                />
              </div>
            </Field>
            <Field label="المبلغ بالدولار" htmlFor="debt-amount" hint={`≈ ${num(toSyp(formAmount, rate))} ل.س`}>
              <Input
                id="debt-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field label="التاريخ" htmlFor="debt-date">
              <Input
                id="debt-date"
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </Field>
            <Field label="ملاحظة (اختياري)" htmlFor="debt-note">
              <Input
                id="debt-note"
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="تفاصيل الدين…"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.03]">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
              <Wallet className="h-3.5 w-3.5" />
              المبلغ بالليرة السورية
            </span>
            <span className="num text-[14px] font-extrabold text-brand-700 dark:text-brand-300">
              {num(toSyp(formAmount, rate))} <span className="text-[10px]">ل.س</span>
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
        title="حذف الدين"
        message={`سيتم حذف دين «${deleteTarget?.person ?? ""}» بقيمة ${num(
          deleteTarget?.amountUsd ?? 0,
          true,
        )} $ نهائياً. لا يمكن التراجع عن الحذف.`}
        confirmLabel="حذف نهائي"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteDebt(deleteTarget.id);
            toast("تم حذف الدين", "info");
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
