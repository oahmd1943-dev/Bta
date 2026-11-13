export type Currency = "USD" | "SYP";
export type DebtType = "له" | "عليه";
export type TabKey = "inventory" | "sales" | "debts" | "budget";
export type Period = "today" | "week" | "month" | "all";
export type Theme = "light" | "dark";

export interface Item {
  id: string;
  name: string;
  category: string;
  qty: number;
  purchaseUsd: number;
  saleUsd: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  qty: number;
  customer: string;
  unitPriceUsd: number;
  unitCostUsd: number;
  date: string;
  exchangeRate: number;
}

export interface Debt {
  id: string;
  person: string;
  type: DebtType;
  amountUsd: number;
  note: string;
  date: string;
  settled: boolean;
  settledAt?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  category: string;
  date: string;
}

export interface Revenue {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  date: string;
}

export interface StoreState {
  items: Item[];
  sales: Sale[];
  debts: Debt[];
  expenses: Expense[];
  revenues: Revenue[];
  categories: string[];
  exchangeRate: number;
  theme: Theme;
  autoExport: boolean;
  shopName: string;
  lastExportAt: string | null;
  createdAt: string;
}

export interface Stats {
  inventoryValueUsd: number;
  itemsCount: number;
  piecesCount: number;
  salesCount: number;
  salesTotalUsd: number;
  cogsUsd: number;
  grossProfitUsd: number;
  expensesTotalUsd: number;
  revenuesTotalUsd: number;
  receivableUsd: number;
  payableUsd: number;
  debtNetUsd: number;
  netProfitUsd: number;
  finalNetUsd: number;
  marginPct: number;
}

export const EXPENSE_CATEGORIES = [
  "إيجار",
  "كهرباء",
  "رواتب",
  "مواصلات",
  "تغليف",
  "صيانة",
  "أخرى",
] as const;
