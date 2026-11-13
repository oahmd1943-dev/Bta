import { useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  Download,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  TrendingUp,
  User,
} from "lucide-react";
import type { Period, Sale } from "@/types";
import { computeStats, useStore } from "@/lib/store";
import { downloadExcel } from "@/lib/excel";
import { formatDate, formatTime, isInPeriod, num, safeNumber } from "@/lib/format";
import { cn } from "@/utils/cn";
import { PageIntro } from "@/components/PageIntro";
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

export default function Sales() {
  const { state, addSale, undoSale, markExported } = useStore();
  const toast = useToast();
  const rate = state.exchangeRate;

  const [period, setPeriod] = useState<Period>("all");
  const [query, setQuery] = useState("");
  const [saleOpen, setSaleOpen] = useState(false);
  const [undoTarget, setUndoTarget] = useState<Sale | null>(null);
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("1");
  const [customer, setCustomer] = useState("");
  const [error, setError] = useState("");

  const todayStats = computeStats(state, "today");
  const allStats = computeStats(state, "all");
  const averageInvoice =
    allStats.salesCount > 0 ? allStats.salesTotalUsd / allStats.salesCount : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.sales
      .filter((sale) => {
        const matchQuery =
          !q ||
          sale.itemName.toLowerCase().includes(q) ||
          sale.customer.toLowerCase().includes(q) ||
          sale.category.toLowerCase().includes(q);
        return matchQuery && isInPeriod(sale.date, period);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.sales, query, period]);

  const filteredTotal = filtered.reduce((acc, s) => acc + s.qty * s.unitPriceUsd, 0);
  const filteredProfit = filtered.reduce(
    (acc, s) => acc + s.qty * (s.unitPriceUsd - s.unitCostUsd),
    0,
  );

  const selectedItem = state.items.find((item) => item.id === itemId);
  const quantity = safeNumber(qty);
  const totalUsd = selectedItem ? quantity * selectedItem.saleUsd : 0;
  const profitUsd = selectedItem
    ? quantity * (selectedItem.saleUsd - selectedItem.purchaseUsd)
    : 0;
  const remaining = selectedItem ? selectedItem.qty - quantity : 0;
  const invalidQty = Boolean(
    selectedItem &&
      (quantity <= 0 || quantity > selectedItem.qty || !Number.isFinite(quantity)),
  );

  const openSale = () => {
    setItemId(state.items.find((i) => i.qty > 0)?.id ?? "");
    setQty("1");
    setCustomer("");
    setError("");
    setSaleOpen(true);
  };

  const submitSale = () => {
    if (!selectedItem) return setError("اختر صنفاً من الجرد أولاً");
    if (quantity <= 0) return setError("أدخل كمية أكبر من صفر");
    if (quantity > selectedItem.qty)
      return setError(`الكمية المتوفرة في الجرد ${num(selectedItem.qty)} قطعة فقط`);
    const result = addSale({ itemId: selectedItem.id, qty: quantity, customer });
    if (!result.ok) return setError(result.error || "تعذّر تسجيل البيع");
    setSaleOpen(false);
    toast(
      `تم تسجيل بيع ${num(quantity)} × ${selectedItem.name} وخصمها من الجرد`,
      "success",
    );
  };

  const exportNow = () => {
    downloadExcel(state);
    markExported();
    toast("تم تصدير تقرير Excel الكامل");
  };

  return (
    <div>
      <PageIntro
        eyebrow="نقطة البيع"
        title="المعاملات والمبيعات"
        description="سجّل عمليات البيع بسرعة، وتُخصم الكميات من الجرد تلقائياً مع احتساب الربح من فرق سعر الشراء والبيع."
        icon={ShoppingCart}
        actions={
          <>
            <Button variant="outline" icon={Download} onClick={exportNow}>
              تصدير
            </Button>
            <Button icon={Plus} onClick={openSale}>
              عملية بيع جديدة
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard
          label="مبيعات اليوم"
          valueUsd={todayStats.salesTotalUsd}
          rate={rate}
          icon={Banknote}
          tone="blue"
          note={`${num(todayStats.salesCount)} عملية بيع اليوم`}
        />
        <StatCard
          label="إجمالي المبيعات"
          valueUsd={allStats.salesTotalUsd}
          rate={rate}
          icon={Receipt}
          tone="teal"
          note={`${num(allStats.salesCount)} عملية مسجّلة`}
        />
        <StatCard
          label="أرباح المبيعات"
          valueUsd={allStats.grossProfitUsd}
          rate={rate}
          icon={TrendingUp}
          tone="green"
          note={`هامش ${num(allStats.marginPct)}% من المبيعات`}
        />
        <StatCard
          label="متوسط قيمة الفاتورة"
          valueUsd={averageInvoice}
          rate={rate}
          icon={ShoppingCart}
          tone="violet"
          note="إجمالي المبيعات ÷ عدد العمليات"
        />
      </div>

      <div className="card mt-4 overflow-hidden sm:mt-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3.5 dark:border-white/5 sm:p-4">
          <SectionHeader
            icon={Receipt}
            title="سجل عمليات البيع"
            subtitle="الأحدث أولاً — يمكنك التراجع عن أي عملية وإرجاع الكمية للجرد"
            action={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ابحث عن صنف أو زبون…"
                    className="h-9 pr-9 text-[12px] sm:w-52"
                    aria-label="بحث في المبيعات"
                  />
                </div>
                <Segmented
                  value={period}
                  onChange={setPeriod}
                  options={[
                    { value: "today", label: "اليوم" },
                    { value: "week", label: "أسبوع" },
                    { value: "month", label: "شهر" },
                    { value: "all", label: "الكل" },
                  ]}
                />
              </div>
            }
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title={state.sales.length === 0 ? "لا توجد مبيعات بعد" : "لا توجد معاملات في هذه الفترة"}
            description={
              state.sales.length === 0
                ? "ابدأ أول عملية بيع، وسيتم خصم الكمية من الجرد واحتساب الربح تلقائياً."
                : "جرّب تغيير فترة العرض أو كلمة البحث."
            }
            action={
              <Button icon={Plus} onClick={openSale}>
                تسجيل عملية بيع
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-collapse text-right text-[12px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10.5px] font-extrabold text-slate-400 dark:border-white/5 dark:bg-white/[0.025] dark:text-slate-500">
                    <th className="px-4 py-3 font-extrabold">التاريخ</th>
                    <th className="px-3 py-3 font-extrabold">الصنف</th>
                    <th className="px-3 py-3 font-extrabold">الكمية</th>
                    <th className="px-3 py-3 font-extrabold">الزبون</th>
                    <th className="px-3 py-3 font-extrabold">سعر الوحدة $</th>
                    <th className="px-3 py-3 font-extrabold">الإجمالي $</th>
                    <th className="px-3 py-3 font-extrabold">الإجمالي ل.س</th>
                    <th className="px-3 py-3 font-extrabold">الربح $</th>
                    <th className="px-3 py-3 font-extrabold">تراجع</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale) => {
                    const total = sale.qty * sale.unitPriceUsd;
                    const profit = sale.qty * (sale.unitPriceUsd - sale.unitCostUsd);
                    return (
                      <tr
                        key={sale.id}
                        className="border-b border-slate-100/80 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-white/[0.04] dark:hover:bg-white/[0.025]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500 dark:bg-sky-500/10 dark:text-sky-300">
                              <CalendarDays className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                                {formatDate(sale.date)}
                              </p>
                              <p className="num mt-0.5 text-[9.5px] font-semibold text-slate-400">
                                {formatTime(sale.date)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
                            {sale.itemName}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold text-slate-400">{sale.category}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="num inline-flex min-w-7 justify-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-extrabold text-slate-600 dark:bg-white/[0.06] dark:text-slate-200">
                            {num(sale.qty)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="block max-w-[130px] truncate text-[11.5px] font-bold text-slate-600 dark:text-slate-300">
                            {sale.customer || "زبون نقدي"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Usd value={sale.unitPriceUsd} className="font-bold text-slate-600 dark:text-slate-300" />
                        </td>
                        <td className="px-3 py-3">
                          <Usd value={total} className="font-extrabold text-slate-900 dark:text-white" />
                        </td>
                        <td className="px-3 py-3">
                          <Syp usd={total} rate={rate} className="font-bold text-brand-700 dark:text-brand-300" />
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "num inline-flex items-center rounded-md px-2 py-1 text-[11px] font-extrabold",
                              profit >= 0
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
                            )}
                          >
                            {profit < 0 ? "−" : "+"}
                            <Usd value={Math.abs(profit)} className="!inline-flex" />
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => setUndoTarget(sale)}
                            className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10.5px] font-bold text-slate-400 transition hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            تراجع
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-2.5 p-3 md:hidden">
              {filtered.map((sale) => {
                const total = sale.qty * sale.unitPriceUsd;
                const profit = sale.qty * (sale.unitPriceUsd - sale.unitCostUsd);
                return (
                  <div
                    key={sale.id}
                    className="rounded-2xl border border-slate-200/80 p-3.5 dark:border-white/[0.07]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-100">
                          {sale.itemName}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(sale.date)} · {formatTime(sale.date)}
                        </p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-extrabold text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
                        × {num(sale.qty)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-white/[0.03]">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400">الإجمالي</p>
                        <Usd value={total} className="text-[12px] font-extrabold text-slate-900 dark:text-white" />
                        <Syp usd={total} rate={rate} className="mt-0.5 text-[9.5px] font-bold text-brand-700 dark:text-brand-300" />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-slate-400">الربح</p>
                        <span
                          className={cn(
                            "text-[11.5px] font-extrabold",
                            profit >= 0 ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          {profit < 0 ? "−" : "+"}
                          <Usd value={Math.abs(profit)} className="!inline-flex" />
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <User className="h-3 w-3" />
                        {sale.customer || "زبون نقدي"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setUndoTarget(sale)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-bold text-orange-600 hover:bg-orange-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        تراجع عن البيع
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3.5 dark:border-white/5 dark:bg-white/[0.02]">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {num(filtered.length)} عملية · {num(filtered.reduce((a, s) => a + s.qty, 0))} قطعة مباعة
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>
                  الإجمالي: <Usd value={filteredTotal} className="font-extrabold text-slate-900 dark:text-white" />
                </span>
                <span>
                  ل.س: <Syp usd={filteredTotal} rate={rate} className="font-extrabold text-brand-700 dark:text-brand-300" />
                </span>
                <span>
                  الربح:{" "}
                  <span className={cn("font-extrabold", filteredProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                    <Usd value={filteredProfit} />
                  </span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
        title="تسجيل عملية بيع"
        subtitle="اختر الصنف والكمية — يُخصم المخزون ويُحسب الربح فور الحفظ."
        icon={ShoppingCart}
        footer={
          <>
            <Button variant="outline" onClick={() => setSaleOpen(false)}>
              إلغاء
            </Button>
            <Button icon={Check} onClick={submitSale} disabled={!selectedItem || invalidQty}>
              تأكيد البيع
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="الصنف المباع" htmlFor="sale-item">
            <Select
              id="sale-item"
              value={itemId}
              onChange={(event) => {
                setItemId(event.target.value);
                setQty("1");
                setError("");
              }}
            >
              <option value="">— اختر صنفاً من الجرد —</option>
              {state.items.map((item) => (
                <option key={item.id} value={item.id} disabled={item.qty === 0}>
                  {item.name} · متوفر {num(item.qty)} · {num(item.saleUsd, true)} $
                  {item.qty === 0 ? " (نفد)" : ""}
                </option>
              ))}
            </Select>
          </Field>

          {selectedItem && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[12.5px] font-extrabold text-slate-800 dark:text-white">
                    {selectedItem.name}
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-bold text-slate-400">{selectedItem.category}</p>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-extrabold",
                    selectedItem.qty > 3
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
                  )}
                >
                  متوفر {num(selectedItem.qty)}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white p-2 dark:bg-white/[0.04]">
                  <p className="text-[9px] font-bold text-slate-400">سعر البيع للوحدة</p>
                  <Usd value={selectedItem.saleUsd} className="mt-0.5 text-[12px] font-extrabold text-slate-800 dark:text-white" />
                </div>
                <div className="rounded-lg bg-white p-2 dark:bg-white/[0.04]">
                  <p className="text-[9px] font-bold text-slate-400">بالليرة السورية</p>
                  <Syp usd={selectedItem.saleUsd} rate={rate} className="mt-0.5 text-[12px] font-extrabold text-brand-700 dark:text-brand-300" />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الكمية المباعة" htmlFor="sale-qty" hint={selectedItem ? `المتاح حالياً ${num(selectedItem.qty)} قطعة` : undefined}>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQty(String(Math.max(1, quantity - 1)))}
                  className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                  aria-label="إنقاص الكمية"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <Input
                  id="sale-qty"
                  type="number"
                  min="1"
                  max={selectedItem?.qty ?? 1}
                  value={qty}
                  onChange={(event) => {
                    setQty(event.target.value);
                    setError("");
                  }}
                  className="text-center font-extrabold"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => setQty(String(Math.min(selectedItem?.qty ?? 999, quantity + 1)))}
                  className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </Field>
            <Field label="اسم الزبون (اختياري)" htmlFor="sale-customer">
              <div className="relative">
                <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="sale-customer"
                  value={customer}
                  onChange={(event) => setCustomer(event.target.value)}
                  placeholder="زبون نقدي"
                  className="pr-9"
                />
              </div>
            </Field>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-linear-to-l from-brand-50/90 to-white p-4 dark:border-brand-500/20 dark:from-brand-500/[0.1] dark:to-transparent">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9.5px] font-bold text-slate-400">إجمالي البيع</p>
                <Usd value={totalUsd} className="mt-1 text-[14px] font-extrabold text-slate-900 dark:text-white" />
                <Syp usd={totalUsd} rate={rate} className="mt-0.5 text-[9.5px] font-bold text-brand-700 dark:text-brand-300" />
              </div>
              <div className="border-x border-brand-100 dark:border-brand-500/20">
                <p className="text-[9.5px] font-bold text-slate-400">ربح العملية</p>
                <p className={cn("num mt-1 text-[14px] font-extrabold", profitUsd >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {profitUsd < 0 ? "−" : "+"}
                  {num(Math.abs(profitUsd), true)} $
                </p>
                <p className="mt-0.5 text-[9px] font-bold text-slate-400">
                  {num(quantity)} وحدة
                </p>
              </div>
              <div>
                <p className="text-[9.5px] font-bold text-slate-400">يتبقى في الجرد</p>
                <p className={cn("num mt-1 text-[14px] font-extrabold", remaining < 0 ? "text-rose-600" : "text-slate-800 dark:text-white")}>
                  {num(Math.max(remaining, 0))}
                </p>
                <p className="mt-0.5 text-[9px] font-bold text-slate-400">قطعة بعد البيع</p>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11.5px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(undoTarget)}
        title="التراجع عن عملية البيع"
        message={`سيتم حذف عملية بيع «${undoTarget?.itemName ?? ""}» وإرجاع ${num(
          undoTarget?.qty ?? 0,
        )} قطعة إلى الجرد. هل تريد المتابعة؟`}
        confirmLabel="نعم، تراجع"
        danger={false}
        onCancel={() => setUndoTarget(null)}
        onConfirm={() => {
          if (undoTarget) {
            undoSale(undoTarget.id);
            toast("تم التراجع عن البيع وإرجاع الكمية إلى الجرد", "info");
          }
          setUndoTarget(null);
        }}
      />
    </div>
  );
}
