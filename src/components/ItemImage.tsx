import { useRef, useState } from "react";
import { Camera, ImageIcon, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import {
  captureNativePhoto,
  compressImage,
  dataUrlBytes,
  formatBytes,
  isNativePlatform,
  type PhotoSource,
} from "@/lib/image";
import { cn } from "@/utils/cn";
import { Button } from "./ui";

const TONES = [
  "from-sky-400/20 to-sky-500/5 text-sky-600 dark:text-sky-300",
  "from-emerald-400/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-300",
  "from-orange-400/20 to-orange-500/5 text-orange-600 dark:text-orange-300",
  "from-violet-400/20 to-violet-500/5 text-violet-600 dark:text-violet-300",
  "from-rose-400/20 to-rose-500/5 text-rose-600 dark:text-rose-300",
  "from-teal-400/20 to-teal-500/5 text-teal-600 dark:text-teal-300",
];

function toneFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return TONES[hash % TONES.length];
}

const SIZES = {
  xs: "h-7 w-7 rounded-md text-[10px]",
  sm: "h-9 w-9 rounded-xl text-[12px]",
  md: "h-11 w-11 rounded-xl text-[14px]",
  lg: "h-14 w-14 rounded-2xl text-[17px]",
  xl: "h-20 w-20 rounded-2xl text-[24px]",
} as const;

/** Product thumbnail: the saved photo when available, otherwise a clean initial tile. */
export function ItemThumb({
  item,
  size = "sm",
  className,
  imgClassName,
}: {
  item: { name: string; image?: string };
  size?: keyof typeof SIZES;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/70 bg-white ring-1 ring-black/[0.02] dark:border-white/10 dark:bg-white/[0.04]",
        SIZES[size],
        className,
      )}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={`صورة ${item.name}`}
          loading="lazy"
          decoding="async"
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center bg-linear-to-br font-extrabold",
            toneFor(item.name),
          )}
          aria-hidden="true"
        >
          {item.name.trim().charAt(0) || "؟"}
        </span>
      )}
    </span>
  );
}

function fileToCompressed(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("الملف المختار ليس صورة");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("الصورة كبيرة جداً (الحد 25 م.ب)");
  }
  return compressImage(file);
}

/** Camera + gallery picker with automatic resizing/compression before saving. */
export function ImagePicker({
  value,
  onChange,
  compact = false,
}: {
  value?: string;
  onChange: (dataUrl?: string) => void;
  compact?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<string>("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const compressed = await fileToCompressed(file);
      onChange(compressed);
      setInfo(`صورة مضغوطة · ${formatBytes(dataUrlBytes(compressed))}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّرت معالجة الصورة");
    } finally {
      setBusy(false);
    }
  };

  const pickNative = async (source: PhotoSource) => {
    setBusy(true);
    setError("");
    try {
      const dataUrl = await captureNativePhoto(source);
      if (typeof dataUrl === "string" && dataUrl) {
        const compressed = await compressImage(dataUrl);
        onChange(compressed);
        setInfo(`صورة مضغوطة · ${formatBytes(dataUrlBytes(compressed))}`);
      } else if (dataUrl === null) {
        // Native plugin unavailable/permission issue: fall back to the WebView picker.
        setError("تعذّر فتح الكاميرا الأصلية — تم فتح منتقي الملفات بدلاً منها");
        if (source === "camera") cameraRef.current?.click();
        else galleryRef.current?.click();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر فتح الكاميرا");
    } finally {
      setBusy(false);
    }
  };

  const launch = (source: PhotoSource) => {
    setError("");
    // Native Capacitor build: use the Camera plugin. Browser/PWA: file input (camera or library).
    if (isNativePlatform()) {
      void pickNative(source);
      return;
    }
    if (source === "camera") cameraRef.current?.click();
    else galleryRef.current?.click();
  };

  const shownSize = value ? formatBytes(dataUrlBytes(value)) : "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-start gap-3">
        <div className="relative">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white text-slate-300 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-600",
              compact ? "h-16 w-16" : "h-20 w-20",
            )}
          >
            {value ? (
              <img src={value} alt="معاينة صورة الصنف" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-7 w-7" strokeWidth={1.5} />
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setInfo("");
                setError("");
              }}
              aria-label="إزالة صورة الصنف"
              className="absolute -left-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-rose-600 text-white shadow-md transition hover:bg-rose-700 dark:border-[#0b172a]"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-sm dark:bg-ink-950/60">
              <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-300" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200">
            صورة الصنف <span className="font-medium text-slate-400">(اختياري)</span>
          </p>
          <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-slate-400">
            صوّر البضاعة بالكاميرا أو اختر صورة من المعرض — تُصغَّر تلقائياً لتوفير مساحة الجهاز.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="dark"
              icon={Camera}
              disabled={busy}
              onClick={() => launch("camera")}
            >
              الكاميرا
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={ImagePlus}
              disabled={busy}
              onClick={() => launch("gallery")}
            >
              المعرض
            </Button>
            {value && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={Upload}
                disabled={busy}
                onClick={() => launch("gallery")}
                className="text-slate-400"
              >
                استبدال
              </Button>
            )}
          </div>
          {(info || shownSize) && (
            <p className="mt-1.5 text-[9.5px] font-bold text-brand-600 dark:text-brand-400">
              {info || `محفوظة · ${shownSize}`}
            </p>
          )}
          {error && <p className="mt-1.5 text-[10px] font-bold text-rose-600">{error}</p>}
        </div>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        aria-label="التقاط صورة بالكاميرا"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        aria-label="اختيار صورة من المعرض"
      />
    </div>
  );
}
