import { useId } from "react";
import { cn } from "@/utils/cn";

export function DuckMark({ className }: { className?: string }) {
  const raw = useId();
  const id = raw.replace(/[:]/g, "");
  const duckId = `duck-${id}`;
  const beakId = `beak-${id}`;
  const bgId = `bg-${id}`;
  return (
    <svg
      viewBox="0 0 512 512"
      className={cn("h-10 w-10", className)}
      role="img"
      aria-label="بطة خضراء — شعار بَطّة"
    >
      <defs>
        <linearGradient id={duckId} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#3ed598" />
          <stop offset="0.55" stopColor="#1cb878" />
          <stop offset="1" stopColor="#0f8f5f" />
        </linearGradient>
        <linearGradient id={beakId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffbe45" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7fdf9" />
          <stop offset="1" stopColor="#e6f7ee" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="#ffffff" />
      <rect x="18" y="18" width="476" height="476" rx="102" fill={`url(#${bgId})`} />
      <circle cx="256" cy="246" r="166" fill="#d8f2e4" opacity="0.7" />
      <path
        d="M352 272c30-26 60-28 80-12-21 1-35 14-45 32-10 17-24 25-40 20-12-4-14-22 5-40Z"
        fill="#0f8f5f"
      />
      <path
        d="M112 318c0-72 63-128 147-128 70 0 121 38 137 96 4 16 14 22 30 24 16 2 20 16 8 24-16 11-46 16-80 14-27 21-61 32-101 32-80 0-141-25-141-62Z"
        fill={`url(#${duckId})`}
      />
      <path
        d="M286 214c0-52 38-92 88-92s88 40 88 92c0 46-32 82-76 90-20 3-34 9-48 20-20 16-46 8-54-16-6-18-2-40 2-54 1-13 0-27 0-40Z"
        fill={`url(#${duckId})`}
      />
      <path
        d="M172 302c34-38 101-44 142-10-10 44-58 76-112 66-27-5-40-31-30-56Z"
        fill="#0d7f54"
        opacity="0.92"
      />
      <path
        d="M197 311c30-25 73-27 102-11"
        fill="none"
        stroke="#8ae9c0"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M413 179c40-10 72 0 76 20-3 21-38 34-79 24-12-3-16-11-14-22 2-11 7-19 17-22Z"
        fill={`url(#${beakId})`}
      />
      <path
        d="M416 203c20 4 44 1 62-6-9 14-34 22-58 17-7-2-9-7-4-11Z"
        fill="#d97706"
        opacity="0.55"
      />
      <circle cx="370" cy="167" r="12" fill="#0a1b33" />
      <circle cx="374" cy="163" r="4" fill="#ffffff" />
      <path
        d="M96 407c31-16 63-16 94 0s63 16 94 0 63-16 94 0 63 16 94 0"
        fill="none"
        stroke="#8fd4f4"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M155 445c24-11 48-11 72 0s48 11 72 0 48-11 72 0"
        fill="none"
        stroke="#bfe6f8"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  withText = false,
  subtitle = "جرد وإدارة المحل",
}: {
  className?: string;
  markClassName?: string;
  withText?: boolean;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-white p-0.5 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.45)] ring-1 ring-black/5">
        <DuckMark className={cn("h-11 w-11 rounded-[13px]", markClassName)} />
      </span>
      {withText && (
        <div className="min-w-0 text-right leading-tight">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-white">بَطّة</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-300">
              Y.A.M
            </span>
          </div>
          <p className="truncate text-[11px] font-medium text-slate-400">{subtitle}</p>
        </div>
      )}
    </div>
  );
}
