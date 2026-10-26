import { loadImage } from "../pdf-signature/canvas";
import { dataUrlToBytes } from "../pdf-signature/utils";

export interface AppearanceOptions {
  signerName: string;
  date: Date;
  reason?: string;
  location?: string;
  /** Handwritten signature image from the signature pad. */
  handwritten?: { dataUrl: string; aspect: number } | null;
  showDetails: boolean;
  scriptFont: string;
}

export interface RenderedAppearance {
  dataUrl: string;
  png: Uint8Array;
  /** Height / width. */
  aspect: number;
}

const WIDTH = 1200;
const HEIGHT = 400;
const INK = "#111827";
const SANS = "Helvetica, Arial, sans-serif";

/** Adobe-style date: 2026.10.26 14:05:09 +05'30' */
export function appearanceDate(date: Date): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return (
    `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ` +
    `${sign}${pad(Math.trunc(offset / 60))}'${pad(offset % 60)}'`
  );
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

/** Render the visible signature block to a transparent PNG. */
export async function renderAppearance(
  options: AppearanceOptions,
): Promise<RenderedAppearance> {
  const { handwritten, showDetails } = options;

  // Only the handwritten image: use it as-is, at its natural proportions.
  if (handwritten && !showDetails) {
    return {
      dataUrl: handwritten.dataUrl,
      png: dataUrlToBytes(handwritten.dataUrl),
      aspect: handwritten.aspect,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = showDetails ? HEIGHT : HEIGHT * 0.6;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const leftWidth = showDetails ? WIDTH * 0.46 : WIDTH;
  const pad = 24;

  // Left: handwritten signature, or the name in a script font.
  if (handwritten) {
    const img = await loadImage(handwritten.dataUrl);
    const boxW = leftWidth - pad * 2;
    const boxH = canvas.height - pad * 2;
    const scale = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, pad + (boxW - w) / 2, pad + (boxH - h) / 2, w, h);
  } else {
    let size = 130;
    const font = () => `500 ${size}px ${options.scriptFont}`;
    try {
      await document.fonts.load(font(), options.signerName);
    } catch {
      /* fall back to whatever is available */
    }
    ctx.font = font();
    while (
      size > 40 &&
      ctx.measureText(options.signerName).width > leftWidth - pad * 2
    ) {
      size -= 6;
      ctx.font = font();
    }
    ctx.fillStyle = INK;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(options.signerName, leftWidth / 2, canvas.height / 2);
  }

  // Right: who/when/why.
  if (showDetails) {
    const x = leftWidth + pad;
    const maxWidth = WIDTH - x - pad;
    const lines: { text: string; bold?: boolean }[] = [
      { text: "Digitally signed by" },
      { text: options.signerName, bold: true },
      { text: `Date: ${appearanceDate(options.date)}` },
    ];
    if (options.reason?.trim())
      lines.push({ text: `Reason: ${options.reason.trim()}` });
    if (options.location?.trim())
      lines.push({ text: `Location: ${options.location.trim()}` });

    const lineHeight = Math.min(64, (HEIGHT - pad * 2) / lines.length);
    let fontSize = Math.round(lineHeight * 0.72);
    // Shrink so name and date always fit; only free-text lines get "…".
    const widest = Math.max(
      ...lines.slice(0, 3).map((line) => {
        ctx.font = `${line.bold ? "700" : "400"} ${fontSize}px ${SANS}`;
        return ctx.measureText(line.text).width;
      }),
    );
    if (widest > maxWidth) {
      fontSize = Math.max(18, Math.floor((fontSize * maxWidth) / widest));
    }
    const startY = (HEIGHT - lineHeight * lines.length) / 2 + lineHeight / 2;

    ctx.fillStyle = INK;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    lines.forEach((line, i) => {
      ctx.font = `${line.bold ? "700" : "400"} ${fontSize}px ${SANS}`;
      ctx.fillText(
        fitText(ctx, line.text, maxWidth),
        x,
        startY + i * lineHeight,
      );
    });

    // Thin divider between the two halves.
    ctx.strokeStyle = "rgba(17,24,39,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftWidth, pad * 1.5);
    ctx.lineTo(leftWidth, HEIGHT - pad * 1.5);
    ctx.stroke();
  }

  const dataUrl = canvas.toDataURL("image/png");
  return {
    dataUrl,
    png: dataUrlToBytes(dataUrl),
    aspect: canvas.height / canvas.width,
  };
}
