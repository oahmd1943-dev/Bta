import { useId } from "react";
import { amount, compact, num } from "@/lib/format";
import { cn } from "@/utils/cn";

export interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

/** RTL-safe vertical bar chart with support for negative values. */
export function DistributionChart({
  data,
  className,
}: {
  data: ChartDatum[];
  className?: string;
}) {
  const width = 460;
  const height = 236;
  const top = 22;
  const bottom = 186;
  const plotHeight = bottom - top;
  const positive = Math.max(0, ...data.map((d) => d.value));
  const negative = Math.max(0, ...data.map((d) => -d.value));
  const totalRange = Math.max(positive + negative, 1);
  const zeroY = top + (positive / totalRange) * plotHeight;
  const scale = (value: number) => (Math.abs(value) / totalRange) * plotHeight;
  const slot = width / Math.max(data.length, 1);
  const barWidth = Math.min(60, slot * 0.52);

  const gridLines = [0, 0.5, 1].map((ratio) => top + ratio * plotHeight);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={`رسم بياني: ${data.map((d) => `${d.label} ${amount(d.value)} دولار`).join("، ")}`}
    >
      {gridLines.map((y, i) => (
        <line
          key={i}
          x1="8"
          y1={y}
          x2={width - 8}
          y2={y}
          stroke="currentColor"
          strokeOpacity={i === 2 ? 0.14 : 0.06}
          strokeDasharray={i === 2 ? "0" : "4 6"}
          strokeWidth="1"
        />
      ))}
      <line
        x1="8"
        y1={zeroY}
        x2={width - 8}
        y2={zeroY}
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      {data.map((datum, index) => {
        const isNegative = datum.value < 0;
        const barHeight = Math.max(scale(datum.value), datum.value === 0 ? 2.5 : 3);
        const x = index * slot + (slot - barWidth) / 2;
        const y = isNegative ? zeroY : zeroY - barHeight;
        const labelY = isNegative ? y + barHeight + 13 : y - 7;
        return (
          <g key={datum.label}>
            <rect
              x={x}
              y={zeroY - 2}
              width={barWidth}
              height={2}
              rx="1"
              fill={datum.color}
              opacity="0.18"
            />
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="8"
              fill={datum.color}
              opacity="0.95"
              className="bar-grow"
              style={{
                animationDelay: `${index * 80}ms`,
                transformOrigin: `${x + barWidth / 2}px ${zeroY}px`,
              }}
            />
            <text
              x={x + barWidth / 2}
              y={labelY}
              textAnchor="middle"
              fill={datum.color}
              fontSize="11.5"
              fontWeight="800"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {datum.value < 0 ? "−" : ""}
              {compact(Math.abs(datum.value))}$
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 18}
              textAnchor="middle"
              fill="currentColor"
              fillOpacity="0.55"
              fontSize="11.5"
              fontWeight="700"
            >
              {datum.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function CompositionDonut({
  slices,
  centerLabel,
  centerValue,
  centerSub,
  className,
}: {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  centerSub?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5", className)}>
      <div className="relative h-[150px] w-[150px] shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <defs>
            <filter id={`glow-${id}`}>
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="14"
          />
          {total > 0 &&
            slices.map((slice) => {
              const value = Math.max(0, slice.value);
              const fraction = value / total;
              const length = fraction * circumference;
              const currentOffset = offset;
              offset += length;
              if (value <= 0) return null;
              return (
                <circle
                  key={slice.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="14"
                  strokeLinecap="butt"
                  strokeDasharray={`${Math.max(length - 2.5, 0)} ${circumference}`}
                  strokeDashoffset={-currentOffset}
                  filter={`url(#glow-${id})`}
                  opacity="0.95"
                />
              );
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[9.5px] font-bold text-slate-400">{centerLabel}</span>
          <span className="num mt-0.5 text-[17px] font-extrabold leading-none text-slate-900 dark:text-white">
            {centerValue}
          </span>
          {centerSub && (
            <span className="num mt-1 text-[9px] font-bold text-slate-400">{centerSub}</span>
          )}
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2">
        {slices.map((slice) => {
          const value = Math.max(0, slice.value);
          const percentage = total > 0 ? (value / total) * 100 : 0;
          return (
            <li key={slice.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="flex-1 text-[11.5px] font-bold text-slate-600 dark:text-slate-300">
                {slice.label}
              </span>
              <span className="num text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
                {amount(value)}$
              </span>
              <span className="num w-9 text-left text-[10px] font-bold text-slate-400">
                {num(percentage)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ProgressRing({
  percentage,
  label,
  sub,
  tone = "emerald",
}: {
  percentage: number;
  label: string;
  sub?: string;
  tone?: "emerald" | "violet" | "sky";
}) {
  const id = useId().replace(/:/g, "");
  const safe = Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const colors = {
    emerald: ["#10b981", "#34d399"],
    violet: ["#7c3aed", "#a78bfa"],
    sky: ["#0284c7", "#38bdf8"],
  } as const;
  const [from, to] = colors[tone];
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={from} />
              <stop offset="1" stopColor={to} />
            </linearGradient>
          </defs>
          <circle cx="38" cy="38" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.09" strokeWidth="7" />
          <circle
            cx="38"
            cy="38"
            r={radius}
            fill="none"
            stroke={`url(#ring-${id})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(safe / 100) * circumference} ${circumference}`}
          />
        </svg>
        <span className="num absolute inset-0 flex items-center justify-center text-[12px] font-extrabold text-slate-800 dark:text-white">
          {num(safe)}%
        </span>
      </div>
      <div>
        <p className="text-[11.5px] font-extrabold text-slate-700 dark:text-slate-200">{label}</p>
        {sub && <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}
