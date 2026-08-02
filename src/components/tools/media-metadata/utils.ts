/**
 * Pure helpers for the media metadata viewer. Nothing here touches the network:
 * every value is derived from bytes the user already has on their machine.
 */

export type MediaKind = "image" | "video" | "audio" | "pdf" | "other";

export interface MetaField {
  label: string;
  value: string;
  /** Free-form copy shown under the value, e.g. what a tag actually means. */
  hint?: string;
}

export interface MetaSection {
  title: string;
  fields: MetaField[];
}

export interface GpsPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
}

/** Bytes → human units. Uses binary units, which is what file managers show. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : value >= 100 ? 0 : 1)} ${units[i]}`;
}

/** Seconds → h:mm:ss (or m:ss below an hour). */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Bits per second → readable rate. */
export function formatBitrate(bps: number): string {
  if (!Number.isFinite(bps) || bps <= 0) return "—";
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  return `${Math.round(bps / 1000)} kbps`;
}

/** Reduce a width/height pair to its simplest ratio, e.g. 1920x1080 → 16:9. */
export function aspectRatio(width: number, height: number): string {
  if (!width || !height) return "—";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  return `${width / d}:${height / d}`;
}

/** Decimal degrees → degrees/minutes/seconds, the form most maps display. */
export function toDMS(value: number, isLatitude: boolean): string {
  const hemisphere = isLatitude
    ? value >= 0
      ? "N"
      : "S"
    : value >= 0
      ? "E"
      : "W";
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;
  return `${deg}° ${min}' ${sec.toFixed(2)}" ${hemisphere}`;
}

/**
 * Build an OpenStreetMap URL for a coordinate pair.
 *
 * Only ever surfaced as a link the user chooses to click — the tool never
 * fetches it, so a photo's location stays local unless they act.
 */
export function mapUrl(pos: GpsPosition): string {
  const { latitude, longitude } = pos;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
}

export function classifyFile(file: File): MediaKind {
  const type = file.type.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "pdf";

  // Some browsers report an empty type for less common containers.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "avif",
      "heic",
      "heif",
      "tif",
      "tiff",
      "bmp",
      "svg",
    ].includes(ext)
  )
    return "image";
  if (
    ["mp4", "mov", "mkv", "webm", "avi", "m4v", "mpg", "mpeg", "3gp"].includes(
      ext,
    )
  )
    return "video";
  if (
    [
      "mp3",
      "wav",
      "flac",
      "aac",
      "ogg",
      "oga",
      "m4a",
      "opus",
      "wma",
      "aiff",
      "aif",
    ].includes(ext)
  )
    return "audio";
  if (ext === "pdf") return "pdf";
  return "other";
}

/** Hash a file with WebCrypto. Fast enough for large media without chunking. */
export async function hashBuffer(
  buffer: ArrayBuffer,
  algorithm: "SHA-1" | "SHA-256" | "SHA-512",
): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, buffer);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Turn a raw EXIF/tag value into something printable.
 *
 * Parser output is deliberately loose — dates, byte arrays, nested objects and
 * rational triplets all appear — so anything unrenderable is dropped rather
 * than shown as "[object Object]".
 */
export function stringifyTagValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number")
    return Number.isInteger(value)
      ? String(value)
      : value.toFixed(4).replace(/\.?0+$/, "");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    // Long binary arrays (thumbnails, colour tables) are noise.
    if (value.length > 24) return `[${value.length} values]`;
    const parts = value
      .map((v) => stringifyTagValue(v))
      .filter((v): v is string => v !== null);
    return parts.length ? parts.join(", ") : null;
  }

  if (typeof value === "object") {
    if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
      const len = value instanceof Uint8Array ? value.length : value.byteLength;
      return `[binary, ${formatBytes(len)}]`;
    }
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return null;
    if (entries.length > 8) return `[${entries.length} fields]`;
    const parts = entries
      .map(([k, v]) => {
        const s = stringifyTagValue(v);
        return s === null ? null : `${k}: ${s}`;
      })
      .filter((v): v is string => v !== null);
    return parts.length ? parts.join(", ") : null;
  }

  return null;
}

/** Human-readable explanations for the EXIF tags people actually ask about. */
const TAG_HINTS: Record<string, string> = {
  FNumber: "Aperture — lower means more light and shallower depth of field",
  ExposureTime: "Shutter speed in seconds",
  ISO: "Sensor sensitivity — higher means brighter but noisier",
  FocalLength: "Lens focal length in millimetres",
  Orientation: "How the camera was held; viewers rotate the image to match",
  ColorSpace: "Colour interpretation, usually sRGB",
};

export function tagHint(label: string): string | undefined {
  return TAG_HINTS[label];
}

/** Insert spaces into PascalCase EXIF tag names for display. */
export function humanizeTag(tag: string): string {
  return tag
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

/** Tags already surfaced in dedicated sections, so skip them in the raw dump. */
export const HANDLED_EXIF_TAGS = new Set([
  "latitude",
  "longitude",
  "GPSLatitude",
  "GPSLongitude",
  "GPSLatitudeRef",
  "GPSLongitudeRef",
  "GPSAltitude",
  "GPSAltitudeRef",
  "ImageWidth",
  "ImageHeight",
  "ExifImageWidth",
  "ExifImageHeight",
  "Make",
  "Model",
  "LensModel",
  "DateTimeOriginal",
  "CreateDate",
  "ModifyDate",
  "FNumber",
  "ExposureTime",
  "ISO",
  "FocalLength",
]);

/** Serialise everything on screen to a JSON report. */
export function buildExport(fileName: string, sections: MetaSection[]): string {
  const payload = {
    file: fileName,
    extractedAt: new Date().toISOString(),
    sections: sections.map((s) => ({
      title: s.title,
      fields: Object.fromEntries(s.fields.map((f) => [f.label, f.value])),
    })),
  };
  return JSON.stringify(payload, null, 2);
}
