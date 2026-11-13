import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  Currency,
  Debt,
  DebtType,
  Expense,
  Item,
  Period,
  Revenue,
  Sale,
  Stats,
  StoreState,
  Theme,
} from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";
import {
  dateInput,
  daysAgo,
  isInPeriod,
  round2,
  safeNumber,
  toUsd,
  todayISO,
  uid,
} from "./format";

export const STORAGE_KEY = "batta_inventory_store_v1";
export const APP_VERSION = "1.0.0";

export const DEFAULT_CATEGORIES = [
  "إلكترونيات",
  "قرطاسية",
  "مواد غذائية",
  "مستلزمات منزلية",
];

function makeSeed(): StoreState {
  const now = new Date().toISOString();
  const rawItems: Array<[string, string, number, number, number]> = [
    ["وصلة شحن سريع USB-C", "إلكترونيات", 18, 1.2, 2.5],
    ["سماعات بلوتوث لاسلكية", "إلكترونيات", 7, 8.5, 14],
    ["شاحن جداري 20 واط", "إلكترونيات", 24, 3.2, 6],
    ["دفتر 100 ورقة", "قرطاسية", 64, 0.6, 1.2],
    ["طقم أقلام حبر جاف", "قرطاسية", 40, 0.35, 0.9],
    ["أرز بسمتي 1 كغ", "مواد غذائية", 35, 1.4, 2.1],
    ["زيت زيتون 1 لتر", "مواد غذائية", 12, 5.5, 8.5],
    ["سكر ناعم 1 كغ", "مواد غذائية", 50, 0.7, 1.1],
    ["مصباح LED 12 واط", "مستلزمات منزلية", 21, 1.1, 2.2],
    ["طقم صحون زجاجي", "مستلزمات منزلية", 5, 7, 12.5],
    ["كابل HDMI بطول 2 متر", "إلكترونيات", 9, 2.4, 5],
    ["علبة ألوان مائية", "قرطاسية", 15, 1.8, 3.5],
  ];

  const items: Item[] = rawItems.map(([name, category, qty, purchaseUsd, saleUsd], i) => ({
    id: `itm_${i + 1}`,
    name,
    category,
    qty,
    purchaseUsd,
    saleUsd,
    createdAt: daysAgo(30 + i, 10),
  }));

  const saleSeed: Array<[number, number, string, number, number]> = [
    [1, 2, "أبو محمد", 0, 12],
    [0, 6, "زبون نقدي", 0, 10],
    [3, 10, "مدرسة النور", 0, 9],
    [2, 4, "سامر العلي", 1, 17],
    [5, 8, "أم خالد", 1, 13],
    [7, 10, "زبون نقدي", 1, 11],
    [1, 3, "ليلى حسن", 3, 16],
    [10, 3, "شركة الرؤية", 3, 12],
    [3, 20, "مركز الأمل", 5, 14],
    [4, 15, "مدرسة النور", 5, 10],
    [11, 4, "هدى سالم", 5, 9],
    [9, 2, "أبو أحمد", 8, 15],
    [8, 6, "زبون نقدي", 8, 12],
    [6, 3, "مطعم الشام", 8, 11],
    [1, 5, "محمد الخطيب", 12, 18],
    [2, 8, "مؤسسة الإمداد", 12, 14],
    [0, 10, "زبون نقدي", 12, 10],
    [5, 15, "أم خالد", 18, 13],
    [7, 20, "كشك الحي", 18, 11],
    [6, 2, "مطعم الشام", 18, 9],
    [10, 4, "شركة الرؤية", 25, 17],
    [3, 30, "مدرسة النور", 25, 12],
    [4, 20, "مركز الأمل", 25, 10],
  ];

  const sales: Sale[] = saleSeed.map(([idx, qty, customer, days, hour], i) => {
    const item = items[idx];
    return {
      id: `sale_${i + 1}`,
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      qty,
      customer,
      unitPriceUsd: item.saleUsd,
      unitCostUsd: item.purchaseUsd,
      date: daysAgo(days, hour),
      exchangeRate: 14200,
    };
  });

  const day = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return dateInput(d);
  };

  const debts: Debt[] = [
    {
      id: "debt_1",
      person: "أحمد الحلبي",
      type: "له",
      amountUsd: 45,
      note: "بضاعة على الحساب",
      date: day(2),
      settled: false,
    },
    {
      id: "debt_2",
      person: "محل الوفاء",
      type: "عليه",
      amountUsd: 60,
      note: "فاتورة توريد قرطاسية",
      date: day(4),
      settled: false,
    },
    {
      id: "debt_3",
      person: "سامر العلي",
      type: "له",
      amountUsd: 30,
      note: "سماعات ووصلة شحن",
      date: day(9),
      settled: false,
    },
    {
      id: "debt_4",
      person: "أم خالد",
      type: "عليه",
      amountUsd: 25,
      note: "دفعة مقدمة لطلبية",
      date: day(14),
      settled: true,
      settledAt: daysAgo(6, 15),
    },
  ];

  const expenses: Expense[] = [
    {
      id: "exp_1",
      description: "إيجار المحل لشهر حالي",
      amount: 120,
      currency: "USD",
      category: "إيجار",
      date: day(6),
    },
    {
      id: "exp_2",
      description: "فاتورة كهرباء",
      amount: 120000,
      currency: "SYP",
      category: "كهرباء",
      date: day(3),
    },
    {
      id: "exp_3",
      description: "رواتب الموظفين",
      amount: 90,
      currency: "USD",
      category: "رواتب",
      date: day(1),
    },
    {
      id: "exp_4",
      description: "مواصلات وتوصيل طلبيات",
      amount: 30000,
      currency: "SYP",
      category: "مواصلات",
      date: day(0),
    },
    {
      id: "exp_5",
      description: "أكياس وأدوات تغليف",
      amount: 12,
      currency: "USD",
      category: "تغليف",
      date: day(11),
    },
  ];

  const revenues: Revenue[] = [
    {
      id: "rev_1",
      description: "خدمة تغليف هدايا",
      amount: 6,
      currency: "USD",
      date: day(3),
    },
    {
      id: "rev_2",
      description: "بيع رف خشبي مستعمل",
      amount: 22,
      currency: "USD",
      date: day(10),
    },
  ];

  return {
    items,
    sales,
    debts,
    expenses,
    revenues,
    categories: [...DEFAULT_CATEGORIES],
    exchangeRate: 14200,
    theme: "light",
    autoExport: true,
    shopName: "متجر يام",
    lastExportAt: null,
    createdAt: now,
  };
}

function emptyState(base?: StoreState): StoreState {
  const fallback = base ?? makeSeed();
  return {
    ...fallback,
    items: [],
    sales: [],
    debts: [],
    expenses: [],
    revenues: [],
    lastExportAt: null,
    createdAt: new Date().toISOString(),
  };
}

export function computeStats(state: StoreState, period: Period = "all"): Stats {
  const rate = state.exchangeRate || 1;
  const inventoryValueUsd = state.items.reduce(
    (acc, item) => acc + safeNumber(item.qty) * safeNumber(item.purchaseUsd),
    0,
  );
  const piecesCount = state.items.reduce((acc, item) => acc + safeNumber(item.qty), 0);

  const periodSales = state.sales.filter((s) => isInPeriod(s.date, period));
  const salesTotalUsd = periodSales.reduce(
    (acc, s) => acc + safeNumber(s.qty) * safeNumber(s.unitPriceUsd),
    0,
  );
  const cogsUsd = periodSales.reduce(
    (acc, s) => acc + safeNumber(s.qty) * safeNumber(s.unitCostUsd),
    0,
  );

  const periodExpenses = state.expenses.filter((e) => isInPeriod(e.date, period));
  const expensesTotalUsd = periodExpenses.reduce(
    (acc, e) => acc + toUsd(safeNumber(e.amount), e.currency, rate),
    0,
  );

  const periodRevenues = state.revenues.filter((r) => isInPeriod(r.date, period));
  const revenuesTotalUsd = periodRevenues.reduce(
    (acc, r) => acc + toUsd(safeNumber(r.amount), r.currency, rate),
    0,
  );

  const outstanding = state.debts.filter((d) => !d.settled);
  const receivableUsd = outstanding
    .filter((d) => d.type === "له")
    .reduce((acc, d) => acc + safeNumber(d.amountUsd), 0);
  const payableUsd = outstanding
    .filter((d) => d.type === "عليه")
    .reduce((acc, d) => acc + safeNumber(d.amountUsd), 0);

  const grossProfitUsd = salesTotalUsd - cogsUsd;
  const netProfitUsd = grossProfitUsd - expensesTotalUsd + revenuesTotalUsd;
  const finalNetUsd = netProfitUsd + receivableUsd - payableUsd;

  return {
    inventoryValueUsd: round2(inventoryValueUsd),
    itemsCount: state.items.length,
    piecesCount: round2(piecesCount),
    salesCount: periodSales.length,
    salesTotalUsd: round2(salesTotalUsd),
    cogsUsd: round2(cogsUsd),
    grossProfitUsd: round2(grossProfitUsd),
    expensesTotalUsd: round2(expensesTotalUsd),
    revenuesTotalUsd: round2(revenuesTotalUsd),
    receivableUsd: round2(receivableUsd),
    payableUsd: round2(payableUsd),
    debtNetUsd: round2(receivableUsd - payableUsd),
    netProfitUsd: round2(netProfitUsd),
    finalNetUsd: round2(finalNetUsd),
    marginPct: salesTotalUsd > 0 ? round2((grossProfitUsd / salesTotalUsd) * 100) : 0,
  };
}

export function loadState(): StoreState {
  if (typeof window === "undefined") return makeSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeSeed();
    const parsed = JSON.parse(raw) as Partial<StoreState> | null;
    if (!parsed || typeof parsed !== "object") return makeSeed();
    const seed = makeSeed();
    const merged: StoreState = {
      ...seed,
      ...parsed,
      items: Array.isArray(parsed.items) ? (parsed.items as Item[]) : seed.items,
      sales: Array.isArray(parsed.sales) ? (parsed.sales as Sale[]) : seed.sales,
      debts: Array.isArray(parsed.debts) ? (parsed.debts as Debt[]) : seed.debts,
      expenses: Array.isArray(parsed.expenses)
        ? (parsed.expenses as Expense[])
        : seed.expenses,
      revenues: Array.isArray(parsed.revenues)
        ? (parsed.revenues as Revenue[])
        : seed.revenues,
      categories:
        Array.isArray(parsed.categories) && parsed.categories.length
          ? (parsed.categories as string[])
          : seed.categories,
      exchangeRate: safeNumber(parsed.exchangeRate, seed.exchangeRate) || seed.exchangeRate,
      theme: parsed.theme === "dark" ? "dark" : "light",
      autoExport: typeof parsed.autoExport === "boolean" ? parsed.autoExport : true,
      shopName: typeof parsed.shopName === "string" && parsed.shopName ? parsed.shopName : seed.shopName,
      lastExportAt:
        typeof parsed.lastExportAt === "string" || parsed.lastExportAt === null
          ? parsed.lastExportAt
          : null,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : seed.createdAt,
    };
    return merged;
  } catch {
    return makeSeed();
  }
}

interface AddItemInput {
  name: string;
  category: string;
  qty: number;
  purchaseUsd: number;
  saleUsd: number;
}

interface AddSaleInput {
  itemId: string;
  qty: number;
  customer?: string;
  date?: string;
}

interface AddDebtInput {
  person: string;
  type: DebtType;
  amountUsd: number;
  note?: string;
  date?: string;
}

interface AddExpenseInput {
  description: string;
  amount: number;
  currency: Currency;
  category: string;
  date?: string;
}

interface AddRevenueInput {
  description: string;
  amount: number;
  currency: Currency;
  date?: string;
}

type Result = { ok: boolean; error?: string };

interface StoreApi {
  state: StoreState;
  addItem: (input: AddItemInput) => Result;
  updateItem: (id: string, input: AddItemInput) => Result;
  deleteItem: (id: string) => void;
  adjustQty: (id: string, delta: number) => void;
  addSale: (input: AddSaleInput) => Result;
  undoSale: (id: string) => void;
  addDebt: (input: AddDebtInput) => Result;
  toggleDebt: (id: string) => void;
  deleteDebt: (id: string) => void;
  addExpense: (input: AddExpenseInput) => Result;
  deleteExpense: (id: string) => void;
  addRevenue: (input: AddRevenueInput) => Result;
  deleteRevenue: (id: string) => void;
  addCategory: (name: string) => Result;
  renameCategory: (oldName: string, newName: string) => Result;
  deleteCategory: (name: string) => Result;
  setExchangeRate: (rate: number) => Result;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAutoExport: (value: boolean) => void;
  setShopName: (name: string) => void;
  markExported: () => void;
  resetAll: () => void;
  loadDemo: () => void;
  importState: (raw: unknown) => Result;
  stats: (period?: Period) => Stats;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => loadState());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable — the app keeps working in memory */
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", state.theme === "dark");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.theme === "dark" ? "#060e1c" : "#081830");
  }, [state.theme]);

  const findCategory = (name: string) =>
    state.categories.some((c) => c.trim() === name.trim());

  const api: StoreApi = {
    state,
    addItem(input) {
      const name = input.name.trim();
      if (!name) return { ok: false, error: "اسم الصنف مطلوب" };
      if (!Number.isFinite(input.qty) || input.qty < 0)
        return { ok: false, error: "الكمية غير صحيحة" };
      if (input.purchaseUsd < 0 || input.saleUsd < 0)
        return { ok: false, error: "الأسعار يجب أن تكون موجبة" };
      const category = input.category.trim() || "أخرى";
      setState((prev) => ({
        ...prev,
        categories: prev.categories.includes(category)
          ? prev.categories
          : [...prev.categories, category],
        items: [
          {
            id: uid("itm"),
            name,
            category,
            qty: safeNumber(input.qty),
            purchaseUsd: safeNumber(input.purchaseUsd),
            saleUsd: safeNumber(input.saleUsd),
            createdAt: new Date().toISOString(),
          },
          ...prev.items,
        ],
      }));
      return { ok: true };
    },
    updateItem(id, input) {
      const name = input.name.trim();
      if (!name) return { ok: false, error: "اسم الصنف مطلوب" };
      if (input.qty < 0 || input.purchaseUsd < 0 || input.saleUsd < 0)
        return { ok: false, error: "أدخل قيماً موجبة" };
      const category = input.category.trim() || "أخرى";
      setState((prev) => ({
        ...prev,
        categories: prev.categories.includes(category)
          ? prev.categories
          : [...prev.categories, category],
        items: prev.items.map((item) =>
          item.id === id
            ? {
                ...item,
                name,
                category,
                qty: safeNumber(input.qty),
                purchaseUsd: safeNumber(input.purchaseUsd),
                saleUsd: safeNumber(input.saleUsd),
              }
            : item,
        ),
      }));
      return { ok: true };
    },
    deleteItem(id) {
      setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
    },
    adjustQty(id, delta) {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === id
            ? { ...item, qty: Math.max(0, safeNumber(item.qty) + delta) }
            : item,
        ),
      }));
    },
    addSale(input) {
      const item = state.items.find((i) => i.id === input.itemId);
      if (!item) return { ok: false, error: "اختر صنفاً من الجرد" };
      const qty = safeNumber(input.qty);
      if (qty <= 0) return { ok: false, error: "أدخل كمية صحيحة" };
      if (qty > item.qty)
        return { ok: false, error: `الكمية المتوفرة في الجرد ${item.qty} فقط` };
      const sale: Sale = {
        id: uid("sale"),
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        qty,
        customer: (input.customer || "").trim(),
        unitPriceUsd: item.saleUsd,
        unitCostUsd: item.purchaseUsd,
        date: input.date || new Date().toISOString(),
        exchangeRate: state.exchangeRate,
      };
      setState((prev) => ({
        ...prev,
        sales: [sale, ...prev.sales],
        items: prev.items.map((i) =>
          i.id === item.id ? { ...i, qty: Math.max(0, i.qty - qty) } : i,
        ),
      }));
      return { ok: true };
    },
    undoSale(id) {
      setState((prev) => {
        const sale = prev.sales.find((s) => s.id === id);
        if (!sale) return prev;
        return {
          ...prev,
          sales: prev.sales.filter((s) => s.id !== id),
          items: prev.items.map((item) =>
            item.id === sale.itemId ? { ...item, qty: item.qty + sale.qty } : item,
          ),
        };
      });
    },
    addDebt(input) {
      const person = input.person.trim();
      if (!person) return { ok: false, error: "اسم الشخص مطلوب" };
      if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0)
        return { ok: false, error: "أدخل مبلغاً أكبر من صفر" };
      setState((prev) => ({
        ...prev,
        debts: [
          {
            id: uid("debt"),
            person,
            type: input.type,
            amountUsd: safeNumber(input.amountUsd),
            note: (input.note || "").trim(),
            date: input.date || todayISO(),
            settled: false,
          },
          ...prev.debts,
        ],
      }));
      return { ok: true };
    },
    toggleDebt(id) {
      setState((prev) => ({
        ...prev,
        debts: prev.debts.map((d) =>
          d.id === id
            ? {
                ...d,
                settled: !d.settled,
                settledAt: d.settled ? undefined : new Date().toISOString(),
              }
            : d,
        ),
      }));
    },
    deleteDebt(id) {
      setState((prev) => ({ ...prev, debts: prev.debts.filter((d) => d.id !== id) }));
    },
    addExpense(input) {
      if (!input.description.trim())
        return { ok: false, error: "أدخل وصف المصروف" };
      if (!Number.isFinite(input.amount) || input.amount <= 0)
        return { ok: false, error: "أدخل مبلغاً صحيحاً" };
      setState((prev) => ({
        ...prev,
        expenses: [
          {
            id: uid("exp"),
            description: input.description.trim(),
            amount: safeNumber(input.amount),
            currency: input.currency,
            category: input.category || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1],
            date: input.date || todayISO(),
          },
          ...prev.expenses,
        ],
      }));
      return { ok: true };
    },
    deleteExpense(id) {
      setState((prev) => ({
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== id),
      }));
    },
    addRevenue(input) {
      if (!input.description.trim())
        return { ok: false, error: "أدخل وصف الإيراد" };
      if (!Number.isFinite(input.amount) || input.amount <= 0)
        return { ok: false, error: "أدخل مبلغاً صحيحاً" };
      setState((prev) => ({
        ...prev,
        revenues: [
          {
            id: uid("rev"),
            description: input.description.trim(),
            amount: safeNumber(input.amount),
            currency: input.currency,
            date: input.date || todayISO(),
          },
          ...prev.revenues,
        ],
      }));
      return { ok: true };
    },
    deleteRevenue(id) {
      setState((prev) => ({
        ...prev,
        revenues: prev.revenues.filter((r) => r.id !== id),
      }));
    },
    addCategory(name) {
      const value = name.trim();
      if (!value) return { ok: false, error: "أدخل اسم التصنيف" };
      if (findCategory(value)) return { ok: false, error: "هذا التصنيف موجود مسبقاً" };
      setState((prev) => ({ ...prev, categories: [...prev.categories, value] }));
      return { ok: true };
    },
    renameCategory(oldName, newName) {
      const value = newName.trim();
      if (!value) return { ok: false, error: "أدخل اسم التصنيف" };
      if (value === oldName) return { ok: true };
      if (findCategory(value)) return { ok: false, error: "هذا التصنيف موجود مسبقاً" };
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c === oldName ? value : c)),
        items: prev.items.map((i) =>
          i.category === oldName ? { ...i, category: value } : i,
        ),
        sales: prev.sales.map((s) =>
          s.category === oldName ? { ...s, category: value } : s,
        ),
      }));
      return { ok: true };
    },
    deleteCategory(name) {
      if (state.items.some((i) => i.category === name)) {
        return { ok: false, error: "لا يمكن حذف تصنيف مرتبط بأصناف موجودة" };
      }
      setState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c !== name),
      }));
      return { ok: true };
    },
    setExchangeRate(rate) {
      if (!Number.isFinite(rate) || rate <= 0)
        return { ok: false, error: "أدخل سعر صرف صحيحاً" };
      setState((prev) => ({ ...prev, exchangeRate: Math.round(rate) }));
      return { ok: true };
    },
    setTheme(theme) {
      setState((prev) => ({ ...prev, theme }));
    },
    toggleTheme() {
      setState((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
    },
    setAutoExport(value) {
      setState((prev) => ({ ...prev, autoExport: value }));
    },
    setShopName(name) {
      setState((prev) => ({ ...prev, shopName: name.trim() || prev.shopName }));
    },
    markExported() {
      setState((prev) => ({ ...prev, lastExportAt: new Date().toISOString() }));
    },
    resetAll() {
      setState((prev) => emptyState(prev));
    },
    loadDemo() {
      setState((prev) => ({ ...makeSeed(), theme: prev.theme, shopName: prev.shopName }));
    },
    importState(raw) {
      if (!raw || typeof raw !== "object") return { ok: false, error: "ملف غير صالح" };
      const candidate = raw as Partial<StoreState>;
      if (
        !Array.isArray(candidate.items) ||
        !Array.isArray(candidate.sales) ||
        !Array.isArray(candidate.debts)
      ) {
        return { ok: false, error: "الملف لا يحتوي على بيانات النسخة الاحتياطية" };
      }
      setState((prev) => ({
        ...loadStateFromCandidate(candidate, prev),
        theme: prev.theme,
      }));
      return { ok: true };
    },
    stats(period = "all") {
      return computeStats(state, period);
    },
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

function loadStateFromCandidate(candidate: Partial<StoreState>, fallback: StoreState): StoreState {
  return {
    ...fallback,
    ...candidate,
    items: Array.isArray(candidate.items) ? candidate.items : fallback.items,
    sales: Array.isArray(candidate.sales) ? candidate.sales : fallback.sales,
    debts: Array.isArray(candidate.debts) ? candidate.debts : fallback.debts,
    expenses: Array.isArray(candidate.expenses) ? candidate.expenses : fallback.expenses,
    revenues: Array.isArray(candidate.revenues) ? candidate.revenues : fallback.revenues,
    categories:
      Array.isArray(candidate.categories) && candidate.categories.length
        ? candidate.categories
        : fallback.categories,
    exchangeRate: safeNumber(candidate.exchangeRate, fallback.exchangeRate) || fallback.exchangeRate,
    theme: fallback.theme,
    autoExport:
      typeof candidate.autoExport === "boolean" ? candidate.autoExport : fallback.autoExport,
    shopName:
      typeof candidate.shopName === "string" && candidate.shopName
        ? candidate.shopName
        : fallback.shopName,
    lastExportAt: typeof candidate.lastExportAt === "string" ? candidate.lastExportAt : null,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : fallback.createdAt,
  };
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
