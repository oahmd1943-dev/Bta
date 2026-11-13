import { useMemo, useState } from "react";
import {
  Banknote,
  Boxes,
  Check,
  Coins,
  Download,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { Item } from "@/types";
import { useStore } from "@/lib/store";
import { downloadExcel } from "@/lib/excel";
import { amount, num, safeNumber, toSyp } from "@/lib/format";
import { cn } from "@/utils/cn";
import { PageIntro } from "@/components/PageIntro";
import { ImagePicker, ItemThumb } from "@/components/ItemImage";
import {
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  StatCard,
  Syp,
  Usd,
  useToast,
} from "@/components/ui";

type SortKey = "newest" | "name" | "qty" | "value";

interface ItemForm {
  name: string;
  category: string;
  qty: string;
  purchase: string;
  sale: string;
  image?: string;
}

export default function Inventory() {
  const { state, addItem, updateItem, deleteItem, adjustQty, markExported } = useStore();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [sort, setSort] = useState<SortKey>("newest");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [form, setForm] = useState<ItemForm>({
    name: "",
    category: state.categories[0] ?? "أخرى",
    qty: "1",
    purchase: "",
    sale: "",
    image: undefined,
  });

  const rate = state.exchangeRate;

  const totals = useMemo(() => {
    const purchaseUsd = state.items.reduce((acc, i) => acc + i.qty * i.purchaseUsd, 0);
    const saleUsd = state.items.reduce((acc, i) => acc + i.qty * i.saleUsd, 0);
    return {
      purchaseUsd,
      saleUsd,
      pieces: state.items.reduce((acc, i) => acc + i.qty, 0),
      expectedProfit: saleUsd - purchaseUsd,
    };
  }, [state.items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.items.filter((item) => {
      const matchesQuery =
        !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchesCategory = activeCategory === "الكل" || item.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
    switch (sort) {
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name, "ar"));
      case "qty":
        return [...list].sort((a, b) => b.qty - a.qty);
      case "value":
        return [...list].sort(
          (a, b) => b.qty * b.purchaseUsd - a.qty * a.purchaseUsd,
        );
      default:
        return [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  }, [state.items, query, activeCategory, sort]);

  const filteredPurchase = filtered.reduce((acc, i) => acc + i.qty * i.purchaseUsd, 0);
  const filteredSale = filtered.reduce((acc, i) => acc + i.qty * i.saleUsd, 0);

  const openNew = () => {
    setEditing(null);
    setError("");
    setCustomCategory("");
    setForm({
      name: "",
      category: state.categories[0] ?? "أخرى",
      qty: "1",
      purchase: "",
      sale: "",
      image: undefined,
    });
    setFormOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setError("");
    setCustomCategory("");
    setForm({
      name: item.name,
      category: item.category,
      qty: String(item.qty),
      purchase: String(item.purchaseUsd),
      sale: String(item.saleUsd),
      image: item.image,
    });
    setFormOpen(true);
  };

  const submit = () => {
    const name = form.name.trim();
    const category =
      form.category === "__new" ? customCategory.trim() : form.category.trim();
    const qty = safeNumber(form.qty, NaN);
    const purchase = safeNumber(form.purchase, NaN);
    const sale = safeNumber(form.sale, NaN);
    if (!name) return setError("اسم الصنف مطلوب");
    if (!category) return setError("اختر تصنيفاً أو أضف تصنيفاً جديداً");
    if (!Number.isFinite(qty) || qty < 0) return setError("أدخل كمية صحيحة (صفر أو أكثر)");
    if (!Number.isFinite(purchase) || purchase < 0) return setError("أدخل سعر شراء صحيحاً");
    if (!Number.isFinite(sale) || sale < 0) return setError("أدخل سعر بيع صحيحاً");
    const payload = {
      name,
      category,
      qty,
      purchaseUsd: purchase,
      saleUsd: sale,
      image: form.image,
    };
    const result = editing ? updateItem(editing.id, payload) : addItem(payload);
    if (!result.ok) return setError(result.error || "تعذّر الحفظ");
    setFormOpen(false);
    toast(editing ? "تم تحديث بيانات الصنف بنجاح" : "تمت إضافة الصنف إلى الجرد");
  };

  const exportNow = () => {
    downloadExcel(state);
    markExported();
    toast("تم تصدير تقرير Excel الكامل");
  };

  const formPreview = {
    syp: toSyp(safeNumber(form.sale), rate),
    margin: safeNumber(form.sale) - safeNumber(form.purchase),
  };
  const formMarginPct =
    safeNumber(form.purchase) > 0
      ? (formPreview.margin / safeNumber(form.purchase)) * 100
      : 0;

  return (
    <div>
      <PageIntro
        eyebrow="إدارة المخزون"
        title="جرد المحل"
        description="تابع كل صنف وكميته وسعر شرائه وبيعه، وتُحدَّث الأسعار بالليرة تلقائياً عند تغيير سعر الصرف."
        icon={Boxes}
        actions={
          <>
            <Button variant="outline" icon={Download} onClick={exportNow}>
              تصدير
            </Button>
            <Button icon={Plus} onClick={openNew}>
              إضافة صنف
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard
          label="عدد الأصناف"
          valueCount={state.items.length}
          icon={Package}
          tone="blue"
          note={`${num(state.categories.length)} تصنيفات مختلفة`}
        />
        <StatCard
          label="إجمالي القطع"
          valueCount={totals.pieces}
          icon={Boxes}
          tone="teal"
          note="قطعة متوفرة في المحل"
        />
        <StatCard
          label="قيمة المخزون · شراء"
          valueUsd={totals.purchaseUsd}
          rate={rate}
          icon={Coins}
          tone="indigo"
          note="Σ الكمية × سعر الشراء"
        />
        <StatCard
          label="قيمة المخزون · بيع"
          valueUsd={totals.saleUsd}
          rate={rate}
          icon={Banknote}
          tone="green"
          note={
            <span className="text-brand-600 dark:text-brand-400">
              ربح متوقع <Usd value={totals.expectedProfit} className="!inline-flex" />
            </span>
          }
        />
      </div>

      <div className="card mt-4 overflow-hidden sm:mt-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3.5 dark:border-white/5 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث بالاسم أو التصنيف…"
                className="pr-9"
                aria-label="بحث في الجرد"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 dark:border-white/10">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  aria-label="ترتيب الأصناف"
                  className="h-full bg-transparent text-[12px] font-bold text-slate-600 outline-none dark:text-slate-300"
                >
                  <option value="newest">الأحدث</option>
                  <option value="name">الاسم</option>
                  <option value="qty">الكمية</option>
                  <option value="value">القيمة</option>
                </select>
              </div>
              <Button
                variant="soft"
                icon={Plus}
                onClick={openNew}
                className="h-11 sm:hidden"
              >
                صنف
              </Button>
            </div>
          </div>
          <div className="-mx-0.5 flex items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5">
            <Chip
              active={activeCategory === "الكل"}
              onClick={() => setActiveCategory("الكل")}
              count={state.items.length}
            >
              الكل
            </Chip>
            {state.categories.map((category) => (
              <Chip
                key={category}
                active={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                count={state.items.filter((i) => i.category === category).length}
              >
                {category}
              </Chip>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={state.items.length === 0 ? "الجرد فارغ حالياً" : "لا توجد نتائج مطابقة"}
            description={
              state.items.length === 0
                ? "ابدأ بإضافة أول صنف إلى محلك، وسيظهر هنا مع كل تفاصيله وأسعاره."
                : "جرّب تعديل كلمات البحث أو اختيار تصنيف آخر لعرض الأصناف."
            }
            action={
              <Button icon={Plus} onClick={openNew}>
                إضافة صنف جديد
              </Button>
            }
          />
        ) : (
          <>
            {/* desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-collapse text-right text-[12px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10.5px] font-extrabold text-slate-400 dark:border-white/5 dark:bg-white/[0.025] dark:text-slate-500">
                    <th className="px-4 py-3 font-extrabold">الصنف</th>
                    <th className="px-3 py-3 font-extrabold">التصنيف</th>
                    <th className="px-3 py-3 font-extrabold">الكمية</th>
                    <th className="px-3 py-3 font-extrabold">سعر الشراء $</th>
                    <th className="px-3 py-3 font-extrabold">سعر البيع $</th>
                    <th className="px-3 py-3 font-extrabold">سعر البيع ل.س</th>
                    <th className="px-3 py-3 font-extrabold">إجمالي $</th>
                    <th className="px-3 py-3 font-extrabold">إجمالي ل.س</th>
                    <th className="px-3 py-3 font-extrabold">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const totalUsd = item.qty * item.purchaseUsd;
                    const lowStock = item.qty === 0;
                    return (
                      <tr
                        key={item.id}
                        className="group border-b border-slate-100/80 transition-colors last:border-0 hover:bg-brand-50/30 dark:border-white/[0.04] dark:hover:bg-white/[0.025]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <ItemThumb item={item} />
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-extrabold text-slate-800 dark:text-slate-100">
                                {item.name}
                              </p>
                              <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                                {item.qty === 0
                                  ? "نفدت الكمية"
                                  : item.qty <= 3
                                    ? "كمية منخفضة"
                                    : "متوفر في المحل"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[10.5px] font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
                            <button
                              type="button"
                              onClick={() => adjustQty(item.id, -1)}
                              disabled={item.qty <= 0}
                              aria-label={`إنقاص كمية ${item.name}`}
                              className="flex h-7 w-7 items-center justify-center rounded-r-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 dark:hover:bg-rose-500/10"
                            >
                              <Minus className="h-3 w-3" strokeWidth={2.6} />
                            </button>
                            <span
                              className={cn(
                                "num w-8 text-center text-[12px] font-extrabold",
                                lowStock ? "text-rose-600" : "text-slate-800 dark:text-slate-100",
                              )}
                            >
                              {num(item.qty)}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustQty(item.id, 1)}
                              aria-label={`زيادة كمية ${item.name}`}
                              className="flex h-7 w-7 items-center justify-center rounded-l-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10"
                            >
                              <Plus className="h-3 w-3" strokeWidth={2.6} />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Usd value={item.purchaseUsd} className="font-bold text-slate-600 dark:text-slate-300" />
                        </td>
                        <td className="px-3 py-3">
                          <Usd value={item.saleUsd} className="font-extrabold text-slate-800 dark:text-slate-100" />
                        </td>
                        <td className="px-3 py-3">
                          <Syp
                            usd={item.saleUsd}
                            rate={rate}
                            className="font-bold text-brand-700 dark:text-brand-300"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <Usd value={totalUsd} className="font-extrabold text-slate-800 dark:text-slate-100" />
                        </td>
                        <td className="px-3 py-3">
                          <Syp usd={totalUsd} rate={rate} className="font-semibold text-slate-500 dark:text-slate-400" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              aria-label={`تعديل ${item.name}`}
                              title="تعديل الصنف"
                              className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              aria-label={`حذف ${item.name}`}
                              title="حذف الصنف"
                              className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <div className="space-y-2.5 p-3 md:hidden">
              {filtered.map((item) => {
                const totalUsd = item.qty * item.purchaseUsd;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-white/[0.07] dark:bg-white/[0.02]"
                  >
                    <div className="flex items-start gap-2.5">
                      <ItemThumb item={item} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[10.5px] font-bold text-slate-400">
                          {item.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          aria-label={`تعديل ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`حذف ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400">الكمية في الجرد</span>
                      <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => adjustQty(item.id, -1)}
                          disabled={item.qty <= 0}
                          aria-label={`إنقاص كمية ${item.name}`}
                          className="flex h-7 w-7 items-center justify-center text-slate-400 disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="num w-9 text-center text-[12px] font-extrabold text-slate-800 dark:text-slate-100">
                          {num(item.qty)}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustQty(item.id, 1)}
                          aria-label={`زيادة كمية ${item.name}`}
                          className="flex h-7 w-7 items-center justify-center text-slate-400"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-50 p-2 dark:bg-white/[0.03]">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400">الشراء</p>
                        <Usd value={item.purchaseUsd} className="text-[11.5px] font-bold text-slate-600 dark:text-slate-300" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400">البيع</p>
                        <Usd value={item.saleUsd} className="text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400">البيع ل.س</p>
                        <Syp usd={item.saleUsd} rate={rate} className="text-[11px] font-bold text-brand-700 dark:text-brand-300" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-100 pt-2 dark:border-white/5">
                      <span className="text-[10px] font-bold text-slate-400">إجمالي القيمة</span>
                      <div className="text-left">
                        <Usd value={totalUsd} className="block text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100" />
                        <Syp usd={totalUsd} rate={rate} className="text-[9.5px] font-semibold text-slate-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-linear-to-l from-brand-50/70 to-white px-4 py-3.5 dark:border-white/5 dark:from-brand-500/[0.07] dark:to-transparent">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/10 text-brand-600">
                  <Check className="h-3.5 w-3.5" />
                </span>
                المعروض: {num(filtered.length)} صنف · {num(filtered.reduce((a, i) => a + i.qty, 0))} قطعة
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>
                  تكلفة: <Usd value={filteredPurchase} className="font-extrabold text-slate-800 dark:text-white" />
                </span>
                <span>
                  بيع: <Usd value={filteredSale} className="font-extrabold text-brand-700 dark:text-brand-300" />
                </span>
                <span>
                  تكلفة ل.س: <Syp usd={filteredPurchase} rate={rate} className="font-extrabold text-slate-700 dark:text-slate-200" />
                </span>
                <span>
                  بيع ل.س: <Syp usd={filteredSale} rate={rate} className="font-extrabold text-brand-700 dark:text-brand-300" />
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "تعديل بيانات الصنف" : "إضافة صنف إلى الجرد"}
        subtitle="أدخل البيانات بالدولار، وستُحسب أسعار الليرة تلقائياً حسب سعر الصرف الحالي."
        icon={editing ? Pencil : Plus}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              إلغاء
            </Button>
            <Button icon={Check} onClick={submit}>
              {editing ? "حفظ التعديلات" : "حفظ الصنف"}
            </Button>
          </>
        }
      >
        <div className="mb-4">
          <ImagePicker
            value={form.image}
            onChange={(image) => setForm((prev) => ({ ...prev, image }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم الصنف" className="sm:col-span-2" htmlFor="item-name">
            <Input
              id="item-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="مثال: وصلة شحن سريع USB-C"
              autoFocus
            />
          </Field>
          <Field label="التصنيف" htmlFor="item-category">
            <Select
              id="item-category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {state.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              <option value="__new">+ تصنيف جديد…</option>
            </Select>
          </Field>
          <Field label="الكمية المتوفرة" htmlFor="item-qty">
            <Input
              id="item-qty"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.qty}
              onChange={(event) => setForm({ ...form, qty: event.target.value })}
              placeholder="0"
            />
          </Field>
          {form.category === "__new" && (
            <Field
              label="اسم التصنيف الجديد"
              className="sm:col-span-2"
              htmlFor="item-new-category"
            >
              <Input
                id="item-new-category"
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                placeholder="مثال: أدوات كهربائية"
              />
            </Field>
          )}
          <Field
            label="سعر الشراء بالدولار"
            htmlFor="item-purchase"
            hint={`≈ ${num(toSyp(safeNumber(form.purchase), rate))} ل.س`}
          >
            <Input
              id="item-purchase"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.purchase}
              onChange={(event) => setForm({ ...form, purchase: event.target.value })}
              placeholder="0.00"
            />
          </Field>
          <Field
            label="سعر البيع بالدولار"
            htmlFor="item-sale"
            hint={`≈ ${num(formPreview.syp)} ل.س`}
          >
            <Input
              id="item-sale"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.sale}
              onChange={(event) => setForm({ ...form, sale: event.target.value })}
              placeholder="0.00"
            />
          </Field>
        </div>

        <div className="mt-4 rounded-2xl border border-brand-100 bg-linear-to-l from-brand-50/80 to-white p-3.5 dark:border-brand-500/15 dark:from-brand-500/[0.08] dark:to-transparent">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[9.5px] font-bold text-slate-400">البيع بالليرة</p>
              <p className="num mt-1 text-[13px] font-extrabold text-slate-800 dark:text-white">
                {num(formPreview.syp)} <span className="text-[9px]">ل.س</span>
              </p>
            </div>
            <div className="border-x border-brand-100 dark:border-brand-500/15">
              <p className="text-[9.5px] font-bold text-slate-400">ربح الوحدة</p>
              <p
                className={cn(
                  "num mt-1 text-[13px] font-extrabold",
                  formPreview.margin < 0 ? "text-rose-600" : "text-brand-700 dark:text-brand-300",
                )}
              >
                {amount(formPreview.margin)} <span className="text-[9px]">$</span>
              </p>
            </div>
            <div>
              <p className="text-[9.5px] font-bold text-slate-400">هامش الربح</p>
              <p className="num mt-1 text-[13px] font-extrabold text-violet-700 dark:text-violet-300">
                {Number.isFinite(formMarginPct) ? num(formMarginPct) : 0}%
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11.5px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف الصنف من الجرد"
        message={`سيتم حذف «${deleteTarget?.name ?? ""}» نهائياً من الجرد. سجل المبيعات السابق لن يتأثر، ويمكنك التراجع عن أي بيع من تبويب المعاملات.`}
        confirmLabel="حذف الصنف"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteItem(deleteTarget.id);
            toast(`تم حذف «${deleteTarget.name}» من الجرد`, "info");
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
