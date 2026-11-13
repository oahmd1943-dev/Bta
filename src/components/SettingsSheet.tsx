import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Database,
  Download,
  FileSpreadsheet,
  Moon,
  Palette,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  Upload,
  WifiOff,
  X,
} from "lucide-react";
import { APP_VERSION, useStore } from "@/lib/store";
import { downloadBackup, downloadExcel, shareExcel } from "@/lib/excel";
import { formatDateTime, num } from "@/lib/format";
import { cn } from "@/utils/cn";
import { DuckMark } from "./Logo";
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Toggle,
  useToast,
} from "./ui";

function Section({
  icon: Icon,
  title,
  description,
  children,
  tone = "slate",
}: {
  icon: typeof Tag;
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "slate" | "green" | "violet" | "orange" | "blue";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300",
    green: "bg-brand-500/10 text-brand-600 dark:text-brand-300",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
    blue: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  };
  return (
    <section className="rounded-2xl border border-slate-200/80 p-3.5 dark:border-white/[0.07]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-4 w-4" strokeWidth={2.1} />
        </span>
        <div>
          <h3 className="text-[12.5px] font-extrabold text-slate-800 dark:text-white">{title}</h3>
          {description && <p className="mt-0.5 text-[10px] font-medium text-slate-400">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function GuideContent() {
  const steps = [
    {
      title: "١. اضبط سعر الصرف",
      body: "أدخل سعر دولار اليوم في الخانة أعلى الشاشة ثم اضغط «تحديث». تُعاد جميع أسعار الليرة في الجرد والديون والميزانية فوراً، دون تغيير أسعار الدولار الأصلية.",
    },
    {
      title: "٢. أضف أصناف الجرد",
      body: "من تبويب الجرد اضغط «إضافة صنف»، وحدّد الاسم والتصنيف والكمية وسعر الشراء والبيع بالدولار. يمكنك إضافة تصنيف جديد من النموذج مباشرة أو إدارته من الإعدادات.",
    },
    {
      title: "٣. سجّل عمليات البيع",
      body: "من تبويب المعاملات اضغط «عملية بيع جديدة». يتم خصم الكمية من الجرد تلقائياً واحتساب الربح من فرق سعر الشراء والبيع. زر «تراجع» يعيد الكمية إلى الجرد.",
    },
    {
      title: "٤. تابع الديون",
      body: "أضف الدين وحدد نوعه: «له» أي مبلغ مستحق لك، أو «عليه» أي مبلغ مستحق عليك. زر «تم السداد» يغيّر الحالة، والديون غير المسددة فقط تدخل في صافي الربح النهائي.",
    },
    {
      title: "٥. سجّل المصاريف والإيرادات",
      body: "من تبويب الميزانية أضف المصاريف (إيجار، كهرباء، رواتب…) بالدولار أو الليرة، وأضف الإيرادات المتنوعة إن وجدت. كل مبالغ الليرة تُحوّل حسب سعر الصرف الحالي.",
    },
    {
      title: "٦. راجع الميزانية وصدّر",
      body: "اختر الفترة (اليوم / الأسبوع / الشهر / الكل) لمشاهدة المبيعات والتكلفة والمصاريف وصافي الربح. زر «تصدير Excel» ينشئ ملفاً بخمس أوراق منسّقة بالعربية RTL.",
    },
  ];

  return (
    <div id="print-guide" className="space-y-4">
      <div className="rounded-2xl bg-linear-to-br from-ink-900 to-ink-700 p-4 text-white">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-white p-0.5">
            <DuckMark className="h-10 w-10 rounded-[11px]" />
          </span>
          <div>
            <p className="text-sm font-extrabold">دليل استخدام بَطّة</p>
            <p className="text-[10px] font-medium text-slate-300">
              جرد • مبيعات • ديون • ميزانية — نسخة {APP_VERSION}
            </p>
          </div>
          <span className="mr-auto rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[9px] font-extrabold">
            عربي RTL
          </span>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-300">
          تطبيق محلي بالكامل لإدارة محل تجاري صغير. لا يحتاج اتصالاً بالإنترنت، ولا تُرسل بياناتك إلى
          أي سيرفر. صُمم للعمل على شاشات اللمس مع تبويبات سفلية وأزرار كبيرة.
        </p>
      </div>

      <div className="space-y-2.5">
        {steps.map((step) => (
          <div key={step.title} className="rounded-xl border border-slate-200/80 p-3 dark:border-white/[0.07]">
            <p className="text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100">{step.title}</p>
            <p className="mt-1 text-[10.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 dark:border-brand-500/15 dark:bg-brand-500/[0.06]">
        <p className="text-[11.5px] font-extrabold text-brand-800 dark:text-brand-300">
          معادلات الحساب المعتمدة
        </p>
        <ul className="mt-1.5 space-y-1 text-[10.5px] font-semibold leading-relaxed text-brand-900/70 dark:text-brand-200/80">
          <li>قيمة البضاعة الحالية = Σ (الكمية × سعر الشراء)</li>
          <li>إجمالي المبيعات = Σ (كل عمليات البيع)</li>
          <li>تكلفة المباع = Σ (الكمية المباعة × سعر شراء الصنف)</li>
          <li>الربح الإجمالي = المبيعات − التكلفة</li>
          <li>صافي الربح النهائي = الربح الإجمالي − المصاريف + الإيرادات + له − عليه</li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200/80 p-3 dark:border-white/[0.07]">
        <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-slate-800 dark:text-slate-100">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
          الحفظ والنسخ الاحتياطي
        </p>
        <p className="mt-1 text-[10.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          تُحفظ البيانات تلقائياً في التخزين المحلي للجهاز بعد كل تعديل. يُنصح بتصدير نسخة Excel أو
          نسخة JSON احتياطية بانتظام. عند الخروج من التطبيق تُنشأ نسخة Excel تلقائياً (حسب إعدادات
          التصدير) وتُحفظ باسم يتضمن تاريخ ووقت الإغلاق.
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-[9.5px] font-bold text-slate-400 dark:border-white/10">
        <span className="text-[11px] tracking-[0.1em] text-slate-600 dark:text-slate-300">Y.A.M</span>
        <span>© 2026 بَطّة — جميع الحقوق محفوظة</span>
      </div>
    </div>
  );
}

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    state,
    setTheme,
    setAutoExport,
    setShopName,
    addCategory,
    renameCategory,
    deleteCategory,
    resetAll,
    loadDemo,
    importState,
    markExported,
  } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shopDraft, setShopDraft] = useState(state.shopName);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [confirm, setConfirm] = useState<"reset" | "demo" | null>(null);

  useEffect(() => {
    if (open) {
      setShopDraft(state.shopName);
      setEditingCategory(null);
    }
  }, [open, state.shopName]);

  const close = () => {
    setShopDraft(state.shopName);
    onClose();
  };

  const handleExport = () => {
    const filename = downloadExcel(state);
    markExported();
    toast(`تم تصدير ${filename}`);
  };

  const handleShare = async () => {
    const result = await shareExcel(state);
    markExported();
    toast(
      result === "shared" ? "تم تجهيز التقرير للمشاركة" : "تم تنزيل التقرير — شاركه عبر واتساب أو الإيميل",
      result === "failed" ? "error" : "success",
    );
  };

  const handleBackup = () => {
    const filename = downloadBackup(state);
    toast(`تم إنشاء النسخة الاحتياطية ${filename}`);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const result = importState(parsed);
        if (result.ok) {
          toast("تم استيراد النسخة الاحتياطية بنجاح");
          close();
        } else {
          toast(result.error || "ملف غير صالح", "error");
        }
      } catch {
        toast("تعذّر قراءة الملف — تأكد أنه ملف JSON صحيح", "error");
      }
    };
    reader.readAsText(file);
  };

  const submitCategory = () => {
    if (!newCategory.trim()) return;
    const result = addCategory(newCategory);
    toast(result.ok ? "تمت إضافة التصنيف" : result.error || "تعذّر الإضافة", result.ok ? "success" : "error");
    if (result.ok) setNewCategory("");
  };

  const saveCategoryName = (oldName: string) => {
    const result = renameCategory(oldName, categoryDraft);
    toast(result.ok ? "تم تعديل التصنيف" : result.error || "تعذّر التعديل", result.ok ? "success" : "error");
    if (result.ok) setEditingCategory(null);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 animate-fade bg-ink-950/55 backdrop-blur-[3px]" onClick={close} />
          <aside className="animate-sheet absolute inset-y-0 left-0 flex w-full max-w-[420px] flex-col bg-white shadow-float dark:bg-[#0a1628]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-ink-900 p-0.5">
                  <DuckMark className="h-9 w-9 rounded-[10px]" />
                </span>
                <div>
                  <p className="text-[14px] font-extrabold text-slate-900 dark:text-white">الإعدادات</p>
                  <p className="text-[10px] font-bold text-slate-400">بَطّة · Y.A.M</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="إغلاق الإعدادات"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <Section icon={Tag} title="بيانات المحل" description="الاسم يظهر في رأس التقارير" tone="blue">
                <div className="flex gap-2">
                  <Input
                    value={shopDraft}
                    onChange={(event) => setShopDraft(event.target.value)}
                    placeholder="اسم المحل"
                    className="h-10"
                  />
                  <Button
                    size="md"
                    icon={Check}
                    onClick={() => {
                      setShopName(shopDraft);
                      toast("تم حفظ اسم المحل");
                    }}
                    className="shrink-0"
                  >
                    حفظ
                  </Button>
                </div>
              </Section>

              <Section icon={Palette} title="المظهر" description="وضع نهاري أو ليلي مريح للعين" tone="violet">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "light" as const, label: "نهاري", icon: Sun },
                      { value: "dark" as const, label: "ليلي", icon: Moon },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "focus-ring flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[12px] font-bold transition",
                        state.theme === option.value
                          ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-400/40 dark:bg-brand-500/10 dark:text-brand-300"
                          : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.03]",
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section icon={FileSpreadsheet} title="تصدير Excel" description="خمس أوراق منسقة بالعربية RTL" tone="green">
                <div className="grid grid-cols-2 gap-2">
                  <Button icon={Download} onClick={handleExport}>
                    تصدير
                  </Button>
                  <Button variant="outline" icon={Share2} onClick={handleShare}>
                    مشاركة
                  </Button>
                </div>
                <div className="mt-3 space-y-3">
                  <Toggle
                    checked={state.autoExport}
                    onChange={(value) => {
                      setAutoExport(value);
                      toast(value ? "تم تفعيل التصدير التلقائي عند الخروج" : "تم إيقاف التصدير التلقائي", "info");
                    }}
                    label="تصدير تلقائي عند الخروج"
                    description="ينشئ نسخة Excel عند إغلاق التطبيق أو الصفحة. قد يطلب المتصفح السماح بالتنزيل."
                  />
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                    {state.lastExportAt
                      ? `آخر تصدير: ${formatDateTime(state.lastExportAt)}`
                      : "لم يتم تصدير أي تقرير بعد"}
                  </p>
                </div>
              </Section>

              <Section icon={Database} title="النسخ الاحتياطي" description="احفظ بياناتك أو استعدها من ملف" tone="orange">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" icon={Download} onClick={handleBackup}>
                    تنزيل نسخة
                  </Button>
                  <Button variant="outline" icon={Upload} onClick={() => fileRef.current?.click()}>
                    استيراد نسخة
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleImport(file);
                    event.target.value = "";
                  }}
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button size="sm" variant="ghost" icon={Sparkles} onClick={() => setConfirm("demo")}>
                    بيانات تجريبية
                  </Button>
                  <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setConfirm("reset")} className="text-rose-600 hover:bg-rose-50 dark:text-rose-400">
                    مسح البيانات
                  </Button>
                </div>
              </Section>

              <Section icon={Tag} title="التصنيفات" description="أضف أو عدّل تصنيفات الجرد" tone="slate">
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submitCategory();
                      }
                    }}
                    placeholder="تصنيف جديد…"
                    className="h-10"
                  />
                  <Button size="md" icon={Plus} onClick={submitCategory} className="shrink-0">
                    إضافة
                  </Button>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {state.categories.map((category) => {
                    const used = state.items.filter((item) => item.category === category).length;
                    const isEditing = editingCategory === category;
                    return (
                      <li
                        key={category}
                        className="flex items-center gap-2 rounded-xl border border-slate-200/80 px-2.5 py-1.5 dark:border-white/[0.07]"
                      >
                        {isEditing ? (
                          <Input
                            value={categoryDraft}
                            onChange={(event) => setCategoryDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                saveCategoryName(category);
                              }
                            }}
                            className="h-8 flex-1 text-[11.5px]"
                            autoFocus
                          />
                        ) : (
                          <span className="flex-1 text-[12px] font-bold text-slate-700 dark:text-slate-200">
                            {category}
                          </span>
                        )}
                        <Badge tone="slate">{num(used)} صنف</Badge>
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => saveCategoryName(category)}
                            aria-label="حفظ التصنيف"
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-600"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryDraft(category);
                            }}
                            aria-label={`تعديل التصنيف ${category}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-orange-50 hover:text-orange-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const result = deleteCategory(category);
                            toast(
                              result.ok ? "تم حذف التصنيف" : result.error || "تعذّر الحذف",
                              result.ok ? "success" : "error",
                            );
                          }}
                          aria-label={`حذف التصنيف ${category}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Section>

              <Section icon={BookOpen} title="دليل الاستخدام" description="شرح مختصر بالعربية + طباعة PDF" tone="blue">
                <Button variant="soft" icon={ArrowLeft} onClick={() => setGuideOpen(true)} className="w-full">
                  فتح الدليل الكامل
                </Button>
              </Section>

              <section className="rounded-2xl bg-linear-to-br from-ink-900 to-ink-700 p-4 text-white">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-white p-0.5">
                    <DuckMark className="h-10 w-10 rounded-[11px]" />
                  </span>
                  <div>
                    <p className="text-[13px] font-extrabold">بَطّة — إدارة المحل</p>
                    <p className="text-[10px] font-medium text-slate-300">الإصدار {APP_VERSION} · Y.A.M</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[9px] font-bold">
                    <WifiOff className="h-3 w-3" /> بدون إنترنت
                  </span>
                  <span className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[9px] font-bold">
                    <ShieldCheck className="h-3 w-3" /> بيانات محلية
                  </span>
                  <span className="rounded-md bg-white/10 px-2 py-1 text-[9px] font-bold">Android 6+</span>
                </div>
                <p className="mt-3 text-[9.5px] leading-relaxed text-slate-300">
                  بياناتك تُحفظ على هذا الجهاز فقط ولا تُرسل لأي خادم. لعرض التطبيق كتطبيق مثبّت على
                  أندرويد، استخدم خيار «إضافة إلى الشاشة الرئيسية» من المتصفح.
                </p>
                <p className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[9px] text-slate-400">
                  <span className="text-[11px] font-extrabold tracking-[0.1em] text-white">Y.A.M</span>
                  <span>© 2026 جميع الحقوق محفوظة</span>
                </p>
              </section>
            </div>
          </aside>
        </div>
      )}

      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="دليل استخدام بَطّة"
        subtitle="شرح مبسّط لكل التبويبات والمعادلات"
        icon={BookOpen}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              icon={Printer}
              onClick={() => window.print()}
              className="no-print"
            >
              طباعة / حفظ PDF
            </Button>
            <Button onClick={() => setGuideOpen(false)}>تم</Button>
          </>
        }
      >
        <GuideContent />
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "reset" ? "مسح جميع البيانات" : "استعادة البيانات التجريبية"}
        message={
          confirm === "reset"
            ? "سيتم حذف الأصناف والمبيعات والديون والمصاريف نهائياً من هذا الجهاز. ننصح بتصدير نسخة احتياطية قبل المتابعة."
            : "سيتم استبدال البيانات الحالية ببيانات تجريبية جاهزة. هل تريد المتابعة؟"
        }
        confirmLabel={confirm === "reset" ? "نعم، امسح الكل" : "تحميل البيانات التجريبية"}
        danger={confirm === "reset"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === "reset") {
            resetAll();
            toast("تم مسح جميع البيانات", "info");
          } else {
            loadDemo();
            toast("تم تحميل البيانات التجريبية");
          }
          setConfirm(null);
        }}
      />
    </>
  );
}


