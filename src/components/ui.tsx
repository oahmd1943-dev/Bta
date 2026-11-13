import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Info,
  Inbox,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { amount, num, toSyp } from "@/lib/format";

/* ------------------------------------------------------------ money */

export function Usd({
  value,
  className,
  unitClassName,
}: {
  value: number;
  className?: string;
  unitClassName?: string;
}) {
  const safe = Number.isFinite(value) ? value : 0;
  return (
    <span dir="ltr" className={cn("num inline-flex items-baseline gap-1 whitespace-nowrap", className)}>
      <span>{amount(safe)}</span>
      <span className={cn("text-[0.72em] font-bold opacity-55", unitClassName)}>$</span>
    </span>
  );
}

export function Syp({
  usd,
  rate,
  className,
  rounded = true,
}: {
  usd: number;
  rate: number;
  className?: string;
  rounded?: boolean;
}) {
  const value = toSyp(Number.isFinite(usd) ? usd : 0, rate);
  return (
    <span className={cn("num inline-flex items-baseline gap-1 whitespace-nowrap", className)}>
      <span>{rounded ? num(value) : amount(value)}</span>
      <span className="text-[0.72em] font-bold opacity-55">ل.س</span>
    </span>
  );
}

/* ------------------------------------------------------------ button */

type ButtonVariant =
  | "primary"
  | "dark"
  | "soft"
  | "ghost"
  | "danger"
  | "outline"
  | "violet"
  | "success";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-[0_8px_18px_-8px_rgba(16,148,97,0.65)] hover:bg-brand-700 active:bg-brand-800",
  dark: "bg-ink-900 text-white shadow-[0_8px_18px_-10px_rgba(8,24,48,0.7)] hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-slate-200",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/15",
  ghost:
    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-[0_8px_18px_-10px_rgba(225,29,72,0.6)]",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.07]",
  violet:
    "bg-violet-600 text-white hover:bg-violet-700 shadow-[0_8px_18px_-8px_rgba(124,58,237,0.55)]",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8.5 min-h-[34px] px-3 text-[12px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-[13px] gap-2 rounded-xl",
  lg: "h-12 px-5 text-sm gap-2 rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconEnd?: LucideIcon;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconEnd: IconEnd,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex shrink-0 items-center justify-center font-bold transition-all duration-200 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon className={cn(size === "lg" ? "h-[18px] w-[18px]" : "h-4 w-4")} strokeWidth={2.2} />
      )}
      {children}
      {IconEnd && <IconEnd className="h-4 w-4 opacity-70" strokeWidth={2.2} />}
    </button>
  );
}

/* ------------------------------------------------------------ badges + headers */

type BadgeTone = "green" | "red" | "blue" | "orange" | "violet" | "slate" | "teal" | "amber";

const badgeTones: Record<BadgeTone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/15 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/10",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/15 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
};

export function Badge({
  children,
  tone = "slate",
  className,
  dot,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
        badgeTones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h2 className="text-[15px] font-extrabold text-slate-800 dark:text-white">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-[11.5px] font-medium text-slate-400 dark:text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------ form fields */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input-base", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn("input-base appearance-none pl-8", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  error,
  className,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      <label className="label-base" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-[11px] font-medium text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="focus-ring flex w-full items-center justify-between gap-4 rounded-xl py-1 text-right"
    >
      <span>
        <span className="block text-[13px] font-bold text-slate-700 dark:text-slate-200">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[11px] font-medium leading-relaxed text-slate-400">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-brand-500" : "bg-slate-200 dark:bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200",
            checked ? "right-0.5" : "right-[22px]",
          )}
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------ segmented control */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; icon?: LucideIcon }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      {options.map((option) => {
        const active = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-ring flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all duration-200",
              active
                ? "bg-white text-ink-900 shadow-sm dark:bg-white/15 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ toggle chips */

export function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-all duration-200",
        active
          ? "border-ink-900 bg-ink-900 text-white shadow-sm dark:border-brand-400 dark:bg-brand-500 dark:text-ink-950"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-slate-200",
      )}
    >
      {children}
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px] font-extrabold",
            active ? "bg-white/20" : "bg-slate-100 text-slate-500 dark:bg-white/10",
          )}
        >
          {num(count)}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------ modal */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const widths = {
    sm: "sm:max-w-[430px]",
    md: "sm:max-w-[560px]",
    lg: "sm:max-w-[760px]",
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade bg-ink-950/55 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "animate-pop relative flex max-h-[93dvh] w-full flex-col overflow-hidden rounded-t-[26px] border border-white/10 bg-white shadow-float sm:rounded-3xl dark:bg-[#0b172a]",
          widths[size],
        )}
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5 sm:px-6">
          {Icon && (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
              <Icon className="h-5 w-5" strokeWidth={2.1} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-[11.5px] font-medium leading-relaxed text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 dark:border-white/5 dark:bg-white/[0.02] sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} icon={AlertTriangle} size="sm">
      <p className="text-[13px] font-medium leading-7 text-slate-600 dark:text-slate-300">
        {message}
      </p>
      <div className="mt-6 flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ empty state */

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-slate-50 to-slate-100 text-slate-300 ring-1 ring-slate-100 dark:from-white/[0.04] dark:to-white/[0.02] dark:text-slate-600 dark:ring-white/5">
        <Icon className="h-7 w-7" strokeWidth={1.6} />
      </span>
      <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-[12px] font-medium leading-relaxed text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ stat card */

type Tone = "blue" | "green" | "orange" | "violet" | "teal" | "rose" | "slate" | "indigo";

const tones: Record<
  Tone,
  { wrap: string; icon: string; bar: string; glow: string }
> = {
  blue: {
    wrap: "from-sky-50/90 via-white to-white border-sky-100/80 dark:from-sky-500/[0.09] dark:via-[#0b172a] dark:to-[#0b172a] dark:border-sky-400/15",
    icon: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    bar: "bg-sky-500",
    glow: "bg-sky-400/10",
  },
  green: {
    wrap: "from-emerald-50/90 via-white to-white border-emerald-100/80 dark:from-emerald-500/[0.09] dark:via-[#0b172a] dark:to-[#0b172a] dark:border-emerald-400/15",
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    bar: "bg-emerald-500",
    glow: "bg-emerald-400/10",
  },
  orange: {
    wrap: "from-orange-50/90 via-white to-white border-orange-100/80 dark:from-orange-500/[0.09] dark:via-[#0b172a] dark:to-[#0b172a] dark:border-orange-400/15",
    icon: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
    bar: "bg-orange-500",
    glow: "bg-orange-400/10",
  },
  violet: {
    wrap: "from-violet-50/90 via-white to-white border-violet-100/80 dark:from-violet-500/[0.09] dark:via-[#0b172a] dark:to-[#0b172a] dark:border-violet-400/15",
    icon: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    bar: "bg-violet-500",
    glow: "bg-violet-400/10",
  },
  teal: {
    wrap: "from-teal-50/90 via-white to-white border-teal-100/80 dark:from-teal-500/[0.09] dark:via-[#0b172a] dark:to-[#0b172a] dark:border-teal-400/15",
    icon: "bg-teal-500/10 text-teal-600 dark:text-teal-300",
    bar: "bg-teal-500",
    glow: "bg-teal-400/10",
  },
  rose: {
    wrap: "from-rose-50/90 via-white to-white border-rose-100/80 dark:from-rose-500/[0.09] dark:via-[#0b172a] dark:to-[#0b172a] dark:border-rose-400/15",
    icon: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    bar: "bg-rose-500",
    glow: "bg-rose-400/10",
  },
  slate: {
    wrap: "from-slate-50/90 via-white to-white border-slate-200/80 dark:from-white/[0.05] dark:via-[#0b172a] dark:to-[#0b172a] dark:border-white/10",
    icon: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    bar: "bg-slate-400",
    glow: "bg-slate-400/10",
  },
  indigo: {
    wrap: "from-indigo-50/90 via-white to-white border-indigo-100/80 dark:from-indigo-500/[0.09] dark:via-[#0b172a] dark:to-[#0b172a] dark:border-indigo-400/15",
    icon: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    bar: "bg-indigo-500",
    glow: "bg-indigo-400/10",
  },
};

export function StatCard({
  label,
  valueUsd,
  rate,
  icon: Icon,
  tone = "blue",
  note,
  negativeIsBad = true,
  featured = false,
  valueCount,
  className,
}: {
  label: string;
  valueUsd?: number;
  rate?: number;
  icon: LucideIcon;
  tone?: Tone;
  note?: ReactNode;
  negativeIsBad?: boolean;
  featured?: boolean;
  valueCount?: number;
  className?: string;
}) {
  const t = tones[tone];
  const value = valueUsd ?? 0;
  const negative = value < 0;

  if (featured) {
    const loss = value < 0;
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border p-5 text-white shadow-[0_18px_40px_-20px_rgba(91,33,182,0.8)]",
          loss
            ? "border-rose-500/20 bg-linear-to-br from-[#881337] via-[#be123c] to-[#fb7185] shadow-[0_18px_40px_-20px_rgba(190,18,60,0.8)]"
            : "border-violet-500/20 bg-linear-to-br from-[#5b21b6] via-[#6d28d9] to-[#8b5cf6]",
          className,
        )}
      >
        <div className="pointer-events-none absolute -left-10 -top-14 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div
          className={cn(
            "pointer-events-none absolute -bottom-20 right-10 h-40 w-40 rounded-full blur-2xl",
            loss ? "bg-orange-300/20" : "bg-fuchsia-300/20",
          )}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className={cn("text-[12px] font-bold", loss ? "text-rose-100" : "text-violet-100")}>{label}</p>
            <div className="mt-2 flex items-baseline gap-1.5 text-[27px] font-extrabold leading-none">
              <Usd
                value={value}
                unitClassName={loss ? "text-rose-200 opacity-100" : "text-violet-200 opacity-100"}
              />
            </div>
            {typeof rate === "number" && (
              <Syp
                usd={value}
                rate={rate}
                className={cn(
                  "mt-1.5 text-[11.5px] font-semibold",
                  loss ? "text-rose-100" : "text-violet-200",
                )}
              />
            )}
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20 backdrop-blur">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
        </div>
        {note && (
          <div
            className={cn(
              "relative mt-4 text-[11px] font-semibold",
              loss ? "text-rose-100/90" : "text-violet-100/90",
            )}
          >
            {note}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-linear-to-br p-4 shadow-[0_1px_2px_rgba(15,35,65,0.03)] transition-shadow hover:shadow-card",
        t.wrap,
        className,
      )}
    >
      <span className={cn("absolute inset-x-4 top-0 h-[3px] rounded-b-full", t.bar, "opacity-80")} />
      <div className={cn("pointer-events-none absolute -left-6 -top-8 h-24 w-24 rounded-full blur-2xl", t.glow)} />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", t.icon)}>
          <Icon className="h-4 w-4" strokeWidth={2.1} />
        </span>
      </div>
      <div
        className={cn(
          "relative mt-2 text-[21px] font-extrabold leading-tight text-slate-900 dark:text-white",
          negative && negativeIsBad && "text-rose-600 dark:text-rose-400",
        )}
      >
        {typeof valueCount === "number" ? (
          <span className="num">{num(valueCount)}</span>
        ) : (
          <Usd value={value} />
        )}
      </div>
      {typeof rate === "number" && typeof valueCount !== "number" && (
        <Syp usd={value} rate={rate} className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500" />
      )}
      {note && (
        <div className="relative mt-2.5 flex items-center gap-1 text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">
          {note}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ toast */

type ToastKind = "success" | "error" | "info";
type ShowToast = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ShowToast>(() => undefined);

const toastStyles: Record<ToastKind, { icon: LucideIcon; ring: string; iconBg: string }> = {
  success: {
    icon: CheckCircle2,
    ring: "ring-emerald-400/25",
    iconBg: "bg-emerald-500/15 text-emerald-300",
  },
  error: {
    icon: AlertTriangle,
    ring: "ring-rose-400/25",
    iconBg: "bg-rose-500/15 text-rose-300",
  },
  info: {
    icon: Info,
    ring: "ring-sky-400/25",
    iconBg: "bg-sky-500/15 text-sky-300",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; kind: ToastKind } | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback<ShowToast>((message, kind = "success") => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind });
    timer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const config = toast ? toastStyles[toast.kind] : null;
  const ToastIcon = config?.icon ?? Check;

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex justify-center px-4 lg:bottom-8">
        {toast && config && (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={cn(
              "animate-toast pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-2xl bg-ink-900 px-4 py-2.5 text-[12.5px] font-bold text-white shadow-float ring-1 dark:bg-[#132340]",
              config.ring,
            )}
          >
            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", config.iconBg)}>
              <ToastIcon className="h-3.5 w-3.5" />
            </span>
            {toast.message}
            <button
              type="button"
              className="mr-1 rounded p-0.5 text-white/50 hover:text-white"
              onClick={() => setToast(null)}
              aria-label="إغلاق التنبيه"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
