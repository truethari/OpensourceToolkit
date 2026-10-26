import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFString,
  type PDFObject,
} from "pdf-lib";

import { bytesToLatin1 } from "./encoding";

/** Helpers for reading PDF structure that both signing and verifying need. */

export class PdfOpenError extends Error {
  constructor(
    message: string,
    readonly kind: "encrypted" | "damaged",
  ) {
    super(message);
    this.name = "PdfOpenError";
  }
}

export async function openPdf(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, {
      updateMetadata: false,
      throwOnInvalidObject: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/encrypt/i.test(message)) {
      throw new PdfOpenError(
        "This PDF is password-protected (encrypted). Remove the protection first, then try again.",
        "encrypted",
      );
    }
    throw new PdfOpenError(
      "Could not read this PDF. The file may be damaged.",
      "damaged",
    );
  }
}

export function lookupDict(
  doc: PDFDocument,
  obj: PDFObject | undefined,
): PDFDict | undefined {
  const resolved = obj instanceof PDFRef ? doc.context.lookup(obj) : obj;
  return resolved instanceof PDFDict ? resolved : undefined;
}

export function lookupArray(
  doc: PDFDocument,
  obj: PDFObject | undefined,
): PDFArray | undefined {
  const resolved = obj instanceof PDFRef ? doc.context.lookup(obj) : obj;
  return resolved instanceof PDFArray ? resolved : undefined;
}

export function readText(
  doc: PDFDocument,
  obj: PDFObject | undefined,
): string | undefined {
  const resolved = obj instanceof PDFRef ? doc.context.lookup(obj) : obj;
  if (resolved instanceof PDFString || resolved instanceof PDFHexString) {
    return resolved.decodeText();
  }
  if (resolved instanceof PDFName) return resolved.decodeText();
  return undefined;
}

export function readNumber(
  doc: PDFDocument,
  obj: PDFObject | undefined,
): number | undefined {
  const resolved = obj instanceof PDFRef ? doc.context.lookup(obj) : obj;
  return resolved instanceof PDFNumber ? resolved.asNumber() : undefined;
}

export interface FieldEntry {
  dict: PDFDict;
  ref?: PDFRef;
  /** Fully qualified name, e.g. "form.sig1". */
  name: string;
  /** Field type, inherited from parents when not set locally. */
  type?: string;
}

/** Walk the AcroForm field tree (fields + kids). */
export function listFields(doc: PDFDocument): FieldEntry[] {
  const acroForm = lookupDict(doc, doc.catalog.get(PDFName.of("AcroForm")));
  const fields = lookupArray(doc, acroForm?.get(PDFName.of("Fields")));
  if (!fields) return [];

  const out: FieldEntry[] = [];
  const seen = new Set<string>();

  const visit = (
    obj: PDFObject,
    parentName: string,
    parentType: string | undefined,
    depth: number,
  ) => {
    if (depth > 32) return;
    const ref = obj instanceof PDFRef ? obj : undefined;
    if (ref) {
      const key = ref.toString();
      if (seen.has(key)) return;
      seen.add(key);
    }
    const dict = lookupDict(doc, obj);
    if (!dict) return;

    const partial = readText(doc, dict.get(PDFName.of("T")));
    const name = partial
      ? parentName
        ? `${parentName}.${partial}`
        : partial
      : parentName;
    const ft = dict.get(PDFName.of("FT"));
    const type = ft instanceof PDFName ? ft.decodeText() : parentType;

    const kids = lookupArray(doc, dict.get(PDFName.of("Kids")));
    const hasFieldKids =
      kids?.asArray().some((k) => {
        const kid = lookupDict(doc, k);
        return kid?.has(PDFName.of("T"));
      }) ?? false;

    if (partial || !hasFieldKids) out.push({ dict, ref, name, type });
    if (kids && hasFieldKids) {
      for (const kid of kids.asArray()) visit(kid, name, type, depth + 1);
    }
  };

  for (const field of fields.asArray()) visit(field, "", undefined, 0);
  return out;
}

/** DocMDP permission (1 = no changes, 2 = form fill & sign, 3 = + annotations). */
export function certificationLevel(doc: PDFDocument): number | undefined {
  const perms = lookupDict(doc, doc.catalog.get(PDFName.of("Perms")));
  const sig = lookupDict(doc, perms?.get(PDFName.of("DocMDP")));
  if (!sig) return undefined;
  const refs = lookupArray(doc, sig.get(PDFName.of("Reference")));
  for (const item of refs?.asArray() ?? []) {
    const ref = lookupDict(doc, item);
    const params = lookupDict(doc, ref?.get(PDFName.of("TransformParams")));
    const p = readNumber(doc, params?.get(PDFName.of("P")));
    return p ?? 2;
  }
  return 2;
}

export interface XrefInfo {
  /** Byte offset of the last cross-reference section. */
  startXref: number;
  /** True for a PDF 1.5+ cross-reference stream, false for a classic table. */
  isStream: boolean;
  /** /Size of the last trailer. */
  size: number;
}

export function readXrefInfo(bytes: Uint8Array): XrefInfo {
  // startxref normally sits in the last few hundred bytes; fall back to a
  // full scan for files with trailing junk.
  let text = bytesToLatin1(bytes.subarray(Math.max(0, bytes.length - 4096)));
  let idx = text.lastIndexOf("startxref");
  if (idx < 0) {
    text = bytesToLatin1(bytes);
    idx = text.lastIndexOf("startxref");
    if (idx < 0)
      throw new PdfOpenError("No cross-reference table found.", "damaged");
  }
  const match = /startxref\s+(\d+)/.exec(text.slice(idx));
  if (!match) throw new PdfOpenError("Invalid startxref.", "damaged");
  const startXref = Number(match[1]);

  // Read a window at the xref location to classify it and find /Size.
  const windowText = bytesToLatin1(
    bytes.subarray(startXref, Math.min(bytes.length, startXref + 64)),
  );
  const isStream = !/^\s*xref/.test(windowText);

  let size = 0;
  if (isStream) {
    const head = bytesToLatin1(
      bytes.subarray(startXref, Math.min(bytes.length, startXref + 4096)),
    );
    const dictEnd = head.indexOf("stream");
    const sizeMatch = /\/Size\s+(\d+)/.exec(
      dictEnd > 0 ? head.slice(0, dictEnd) : head,
    );
    size = sizeMatch ? Number(sizeMatch[1]) : 0;
  } else {
    const after = bytesToLatin1(bytes.subarray(startXref));
    const trailerIdx = after.indexOf("trailer");
    const sizeMatch =
      trailerIdx >= 0 ? /\/Size\s+(\d+)/.exec(after.slice(trailerIdx)) : null;
    size = sizeMatch ? Number(sizeMatch[1]) : 0;
  }

  return { startXref, isStream, size };
}

export function pdfDate(date: Date): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return (
    `D:${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}` +
    `${sign}${pad(Math.trunc(offset / 60))}'${pad(offset % 60)}'`
  );
}

export function parsePdfDate(text: string | undefined): Date | undefined {
  if (!text) return undefined;
  const m =
    /^D?:?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([Zz+-])?(\d{2})?'?(\d{2})?/.exec(
      text.trim(),
    );
  if (!m) return undefined;
  const [, y, mo = "01", d = "01", h = "00", mi = "00", s = "00", tz, th, tm] =
    m;
  let iso = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
  if (!tz || tz === "Z" || tz === "z") iso += "Z";
  else iso += `${tz}${th ?? "00"}:${tm ?? "00"}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
