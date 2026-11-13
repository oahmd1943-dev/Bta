/**
 * Batta image pipeline.
 *
 * - On a native Capacitor build the Camera plugin opens the device camera or photo
 *   library (installed: @capacitor/core + @capacitor/camera).
 * - In the browser/PWA we fall back to a normal <input type="file"> so the feature
 *   works everywhere (mobile Chrome / desktop), with `capture` for the camera.
 * - Every picked photo is resized + re-encoded to a small JPEG data URL before it is
 *   stored, which keeps localStorage usage low on phones.
 */

export type PhotoSource = "camera" | "gallery";

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  /** Soft size budget in bytes; the image is shrunk again when exceeded. */
  maxBytes?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 420,
  quality: 0.72,
  maxBytes: 80 * 1024,
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("تعذّرت قراءة الصورة"));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("صيغة الصورة غير مدعومة على هذا الجهاز"));
    image.src = src;
  });
}

function drawToJpeg(
  image: HTMLImageElement,
  maxDimension: number,
  quality: number,
): string {
  const naturalWidth = image.naturalWidth || image.width || 1;
  const naturalHeight = image.naturalHeight || image.height || 1;
  const ratio = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * ratio));
  const height = Math.max(1, Math.round(naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذّر تجهيز الصورة");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.round((base64.length * 3) / 4);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 ك.ب";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

/**
 * Resizes an image (Blob/File or data URL) to a compressed JPEG data URL.
 * Typical result: 15–60 KB, suitable for a full inventory stored on-device.
 */
export async function compressImage(
  source: Blob | string,
  options: CompressOptions = {},
): Promise<string> {
  const { maxDimension, quality, maxBytes } = { ...DEFAULTS, ...options };
  const original = typeof source === "string" ? source : await blobToDataUrl(source);
  const image = await loadImage(original);

  let result = drawToJpeg(image, maxDimension, quality);
  if (dataUrlBytes(result) > maxBytes) {
    result = drawToJpeg(image, Math.round(maxDimension * 0.72), Math.max(0.5, quality - 0.1));
  }
  if (dataUrlBytes(result) > maxBytes * 1.6) {
    result = drawToJpeg(image, Math.round(maxDimension * 0.5), 0.55);
  }
  return result;
}

/**
 * Tries the native Capacitor Camera plugin. Returns `null` in a browser so the
 * caller can fall back to a file input; returns `undefined` when the user cancels.
 */
export async function captureNativePhoto(
  source: PhotoSource,
): Promise<string | null | undefined> {
  if (typeof window === "undefined") return null;
  try {
    const core = await import("@capacitor/core");
    if (!core.Capacitor?.isNativePlatform?.()) return null;
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      width: 1200,
      correctOrientation: true,
      resultType: CameraResultType.DataUrl,
      source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
      promptLabelHeader: "صورة الصنف",
      promptLabelPhoto: "من المعرض",
      promptLabelPicture: "الكاميرا",
      promptLabelCancel: "إلغاء",
    });
    return photo.dataUrl ?? undefined;
  } catch (error) {
    const message = String((error as { message?: string })?.message || error).toLowerCase();
    if (message.includes("cancel")) return undefined;
    // Plugin missing / permission denied / web: let the <input type=file> handle it.
    return null;
  }
}

export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}
