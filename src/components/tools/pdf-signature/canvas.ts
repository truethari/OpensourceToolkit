import { findOpaqueBounds } from "./utils";

export interface SignatureImage {
  dataUrl: string;
  /** Natural height / width. */
  aspect: number;
}

/** Crop a canvas to its visible pixels (plus padding) and export as PNG. */
export function trimCanvas(
  canvas: HTMLCanvasElement,
  padding = 8,
): SignatureImage | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const { width, height } = canvas;
  const bounds = findOpaqueBounds(
    ctx.getImageData(0, 0, width, height).data,
    width,
    height,
  );
  if (!bounds) return null;

  const x = Math.max(bounds.x - padding, 0);
  const y = Math.max(bounds.y - padding, 0);
  const w = Math.min(bounds.width + padding * 2, width - x);
  const h = Math.min(bounds.height + padding * 2, height - y);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")?.drawImage(canvas, x, y, w, h, 0, 0, w, h);

  return { dataUrl: out.toDataURL("image/png"), aspect: h / w };
}

/** Render a line of text to a tightly cropped transparent PNG. */
export async function renderText(
  text: string,
  fontFamily: string,
  color: string,
  fontSize = 160,
  fontWeight = "400",
): Promise<SignatureImage | null> {
  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  // Web fonts load lazily; make sure the glyphs exist before drawing.
  try {
    await document.fonts.load(font, text);
  } catch {
    // Fall back to whatever the browser has.
  }

  const measureCtx = document.createElement("canvas").getContext("2d");
  if (!measureCtx) return null;
  measureCtx.font = font;
  const measuredWidth = measureCtx.measureText(text).width;

  // Script fonts have long swashes outside their advance width, so draw on a
  // generous canvas and let trimCanvas find the real ink bounds.
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(measuredWidth + fontSize * 2);
  canvas.height = Math.ceil(fontSize * 2.2);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, fontSize, canvas.height / 2);

  return trimCanvas(canvas, Math.round(fontSize * 0.08));
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
