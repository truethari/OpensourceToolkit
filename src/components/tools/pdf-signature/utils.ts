import { degrees, PDFDocument } from "pdf-lib";

/** A placed item, positioned in fractions (0–1) of the page as displayed. */
export interface Placement {
  id: string;
  pageIndex: number;
  /** PNG data URL of the signature / stamp. */
  dataUrl: string;
  /** Natural image height / width, used to keep the aspect ratio on resize. */
  aspect: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfDrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
}

export const MIN_PLACEMENT_WIDTH = 0.04;

export function normalizeRotation(angle: number): 0 | 90 | 180 | 270 {
  const r = (((Math.round(angle / 90) * 90) % 360) + 360) % 360;
  return r as 0 | 90 | 180 | 270;
}

/**
 * Convert a box given in fractions of the *displayed* page (top-left origin,
 * after /Rotate is applied) into pdf-lib drawImage arguments in user space.
 *
 * The image is anchored at the box's visual bottom-left corner and rotated
 * counter-clockwise by the page rotation, so it reads upright in a viewer.
 */
export function toPdfRect(
  box: Box,
  cropBox: Box,
  pageRotation: number,
): PdfDrawRect {
  const rotation = normalizeRotation(pageRotation);
  const sideways = rotation === 90 || rotation === 270;
  const viewW = sideways ? cropBox.height : cropBox.width;
  const viewH = sideways ? cropBox.width : cropBox.height;

  // Visual bottom-left of the box, in displayed-page points.
  const u = box.x * viewW;
  const v = (box.y + box.height) * viewH;
  const { x: cx, y: cy, width: cw, height: ch } = cropBox;

  let px: number;
  let py: number;
  switch (rotation) {
    case 90:
      px = cx + v;
      py = cy + u;
      break;
    case 180:
      px = cx + cw - u;
      py = cy + v;
      break;
    case 270:
      px = cx + cw - v;
      py = cy + ch - u;
      break;
    default:
      px = cx + u;
      py = cy + ch - v;
  }

  return {
    x: px,
    y: py,
    width: box.width * viewW,
    height: box.height * viewH,
    rotate: rotation,
  };
}

/** Keep a box fully inside the page. */
export function clampBox(box: Box): Box {
  const width = Math.min(Math.max(box.width, 0), 1);
  const height = Math.min(Math.max(box.height, 0), 1);
  return {
    width,
    height,
    x: Math.min(Math.max(box.x, 0), 1 - width),
    y: Math.min(Math.max(box.y, 0), 1 - height),
  };
}

/**
 * Height fraction for a given width fraction so the image keeps its natural
 * aspect ratio on a page whose displayed size is pageW × pageH.
 */
export function heightForWidth(
  widthFraction: number,
  aspect: number,
  pageW: number,
  pageH: number,
): number {
  return (widthFraction * aspect * pageW) / pageH;
}

/**
 * Resize from the bottom-right handle, keeping aspect ratio and the top-left
 * corner fixed, and never growing past the page edges.
 */
export function resizeBox(
  box: Box,
  requestedWidth: number,
  aspect: number,
  pageW: number,
  pageH: number,
): Box {
  const ratio = heightForWidth(1, aspect, pageW, pageH);
  const maxWidth = Math.min(1 - box.x, (1 - box.y) / ratio);
  const width = Math.min(
    Math.max(requestedWidth, MIN_PLACEMENT_WIDTH),
    maxWidth,
  );
  return { ...box, width, height: width * ratio };
}

/** Bounding box of pixels whose alpha exceeds the threshold, or null if empty. */
export function findOpaqueBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  alphaThreshold = 8,
): Box | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Make near-white pixels transparent so a photographed/scanned signature
 * sits cleanly on the page. Pixels between `threshold - feather` and
 * `threshold` fade out to avoid jagged edges. Mutates `data` in place.
 */
export function removeLightBackground(
  data: Uint8ClampedArray,
  threshold = 225,
  feather = 30,
): void {
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum >= threshold) {
      data[i + 3] = 0;
    } else if (lum > threshold - feather) {
      const keep = (threshold - lum) / feather;
      data[i + 3] = Math.round(data[i + 3] * keep);
    }
  }
}

/** Recolor every visible pixel, keeping its alpha (for ink color changes). */
export function tintOpaquePixels(data: Uint8ClampedArray, hex: string): void {
  const [r, g, b] = hexToRgb(hex);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function signedFileName(name: string): string {
  const base = name.replace(/\.pdf$/i, "");
  return `${base || "document"}-signed.pdf`;
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Stamp every placement onto a copy of the PDF and return the new bytes. */
export async function applyPlacements(
  pdfBytes: ArrayBuffer | Uint8Array,
  placements: Placement[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();

  // Identical signatures placed several times are embedded once.
  const embedded = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>();

  for (const placement of placements) {
    const page = pages[placement.pageIndex];
    if (!page) continue;

    let image = embedded.get(placement.dataUrl);
    if (!image) {
      image = await doc.embedPng(dataUrlToBytes(placement.dataUrl));
      embedded.set(placement.dataUrl, image);
    }

    const rect = toPdfRect(
      placement,
      page.getCropBox(),
      page.getRotation().angle,
    );
    page.drawImage(image, {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      rotate: degrees(rect.rotate),
    });
  }

  doc.setModificationDate(new Date());
  return doc.save();
}

export type DateFormat = "long" | "iso" | "dmy" | "mdy";

export const DATE_FORMATS: { value: DateFormat; label: string }[] = [
  { value: "long", label: "Month D, YYYY" },
  { value: "iso", label: "YYYY-MM-DD" },
  { value: "dmy", label: "DD/MM/YYYY" },
  { value: "mdy", label: "MM/DD/YYYY" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatDate(date: Date, format: DateFormat): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (format) {
    case "iso":
      return `${y}-${pad(m + 1)}-${pad(d)}`;
    case "dmy":
      return `${pad(d)}/${pad(m + 1)}/${y}`;
    case "mdy":
      return `${pad(m + 1)}/${pad(d)}/${y}`;
    default:
      return `${MONTHS[m]} ${d}, ${y}`;
  }
}
