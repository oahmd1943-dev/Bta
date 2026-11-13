import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export function PageIntro({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
          )}
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
            {eyebrow}
          </span>
        </div>
        <h1 className="mt-1.5 text-[23px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[27px]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-[12px] font-medium leading-relaxed text-slate-400 dark:text-slate-500">
          {description}
        </p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
