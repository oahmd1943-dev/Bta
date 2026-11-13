import { useEffect, useRef, useState } from "react";
import { WifiOff, ShieldCheck, FileSpreadsheet } from "lucide-react";
import type { TabKey } from "@/types";
import { STORAGE_KEY, StoreProvider, useStore } from "@/lib/store";
import { downloadExcel } from "@/lib/excel";
import { ToastProvider } from "@/components/ui";
import { Header } from "@/components/Header";
import { BottomNav, Sidebar } from "@/components/Nav";
import { SettingsSheet } from "@/components/SettingsSheet";
import { DuckMark } from "@/components/Logo";
import Inventory from "@/screens/Inventory";
import Sales from "@/screens/Sales";
import Debts from "@/screens/Debts";
import Budget from "@/screens/Budget";

function Splash() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-ink-950 via-ink-900 to-ink-800 px-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/20 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-sky-500/15 blur-[100px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="animate-floaty relative">
        <div className="absolute inset-0 -z-10 scale-110 rounded-[38px] bg-brand-400/20 blur-2xl" />
        <div className="rounded-[34px] border border-white/20 bg-white p-1.5 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.8)]">
          <DuckMark className="h-28 w-28 rounded-[28px] sm:h-32 sm:w-32" />
        </div>
      </div>

      <div className="relative mt-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-[38px] font-black leading-none tracking-tight text-white">بَطّة</h1>
          <span className="rounded-md border border-brand-400/30 bg-brand-400/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-brand-300">
            Y.A.M
          </span>
        </div>
        <p className="mt-2.5 max-w-xs text-[12px] font-medium leading-relaxed text-slate-300">
          جردك، مبيعاتك، ديونك وميزانيتك — كل شيء في مكان واحد يعمل بدون إنترنت.
        </p>
      </div>

      <div className="relative mt-7 flex flex-wrap items-center justify-center gap-2">
        {["جرد ذكي", "مبيعات", "ديون", "ميزانية", "Excel"].map((label) => (
          <span
            key={label}
            className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[9px] font-bold text-slate-300 backdrop-blur"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="relative mt-8 w-52">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="animate-splash-bar h-full rounded-full bg-linear-to-l from-brand-300 to-brand-500" />
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[9.5px] font-bold text-slate-400">
          <WifiOff className="h-3 w-3" />
          يعمل بدون إنترنت · بياناتك محلية 100%
        </p>
      </div>

      <p className="absolute bottom-7 text-[9px] font-bold tracking-[0.18em] text-slate-500">
        © 2026 Y.A.M — ALL RIGHTS RESERVED
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-7 flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 pb-2 pt-5 text-center sm:flex-row sm:text-right dark:border-white/[0.07]">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span className="text-[15px] font-black tracking-[0.14em] text-slate-800 dark:text-white">
          Y.A.M
        </span>
        <span className="h-3 w-px bg-slate-300 dark:bg-white/15" />
        <span className="text-[10px] font-bold text-slate-400">
          © 2026 بَطّة — جميع الحقوق محفوظة
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-[9px] font-bold text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-brand-500" />
          بيانات محلية آمنة
        </span>
        <span className="h-3 w-px bg-slate-200 dark:bg-white/10" />
        <span className="flex items-center gap-1">
          <WifiOff className="h-3 w-3 text-sky-500" />
          بدون إنترنت
        </span>
        <span className="h-3 w-px bg-slate-200 dark:bg-white/10" />
        <span className="flex items-center gap-1">
          <FileSpreadsheet className="h-3 w-3 text-violet-500" />
          تصدير Excel
        </span>
      </div>
    </footer>
  );
}

function Shell() {
  const { state } = useStore();
  const [tab, setTab] = useState<TabKey>("inventory");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [booting, setBooting] = useState(true);

  const latest = useRef(state);
  const dirty = useRef(false);
  const firstRender = useRef(true);
  latest.current = state;

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 2150);
    return () => window.clearTimeout(timer);
  }, []);

  // Mark the data as changed so the exit auto-export only fires when needed.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    dirty.current = true;
  }, [state.items, state.sales, state.debts, state.expenses, state.revenues, state.exchangeRate]);

  // Automatic Excel snapshot when the app/page is left (best effort in browsers).
  useEffect(() => {
    const handleExit = () => {
      const snapshot = latest.current;
      if (!snapshot.autoExport || !dirty.current) return;
      const last = snapshot.lastExportAt ? new Date(snapshot.lastExportAt).getTime() : 0;
      if (Date.now() - last < 45_000) return;
      try {
        downloadExcel(snapshot);
        dirty.current = false;
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...snapshot, lastExportAt: new Date().toISOString() }),
          );
        } catch {
          /* ignore storage errors */
        }
      } catch {
        /* downloads can be blocked during unload — the local save is already up to date */
      }
    };
    window.addEventListener("pagehide", handleExit);
    return () => window.removeEventListener("pagehide", handleExit);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  const screens: Record<TabKey, React.ReactNode> = {
    inventory: <Inventory />,
    sales: <Sales />,
    debts: <Debts />,
    budget: <Budget onNavigate={() => setTab("debts")} />,
  };

  return (
    <div className="min-h-dvh bg-surface dark:bg-[#060e1c]">
      <div className="mx-auto flex min-h-dvh max-w-[1640px]">
        <Sidebar active={tab} onChange={setTab} onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header active={tab} onOpenSettings={() => setSettingsOpen(true)} />
          <main className="relative flex-1 px-3 pb-28 pt-4 sm:px-5 lg:px-7 lg:pb-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(28,184,120,0.06),transparent_60%)]" />
            <div key={tab} className="animate-screen">
              {screens[tab]}
            </div>
            <Footer />
          </main>
        </div>
      </div>

      <BottomNav active={tab} onChange={setTab} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {booting && <Splash />}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </StoreProvider>
  );
}
