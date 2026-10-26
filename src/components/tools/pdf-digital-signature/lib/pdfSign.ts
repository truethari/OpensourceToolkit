import {
  PDFArray,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFRef,
  PDFString,
  type PDFDocument,
  type PDFObject,
} from "pdf-lib";

import { toPdfRect, type Box } from "../../pdf-signature/utils";

import { createCadesSignature } from "./cms";
import {
  bytesToHex,
  bytesToLatin1,
  concatBytes,
  latin1ToBytes,
  randomBytes,
  sha256,
} from "./encoding";
import type { SigningIdentity } from "./p12";
import {
  certificationLevel,
  listFields,
  lookupArray,
  lookupDict,
  openPdf,
  pdfDate,
  readXrefInfo,
} from "./pdfStructure";

const BYTE_RANGE_PLACEHOLDER = "**********";
/** Width of "/**********" – each ByteRange number is padded to this. */
const BYTE_RANGE_SLOT = BYTE_RANGE_PLACEHOLDER.length + 1;

export interface SignatureAppearance {
  pageIndex: number;
  /** Position in fractions of the page as displayed (after /Rotate). */
  box: Box;
  /** PNG of the visible signature block. */
  png: Uint8Array;
}

export interface SignPdfOptions {
  pdf: Uint8Array;
  identity: SigningIdentity;
  reason?: string;
  location?: string;
  contactInfo?: string;
  /** Name shown by viewers; defaults to the certificate's common name. */
  signerName?: string;
  appearance?: SignatureAppearance;
  /** Defaults to now (from this device's clock). */
  signingTime?: Date;
}

export class SignPdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignPdfError";
  }
}

function serialize(obj: PDFObject): Uint8Array {
  const out = new Uint8Array(obj.sizeInBytes());
  obj.copyBytesInto(out, 0);
  return out;
}

function nextFieldName(doc: PDFDocument): string {
  const names = new Set(listFields(doc).map((f) => f.name));
  let n = 1;
  while (names.has(`Signature${n}`)) n++;
  return `Signature${n}`;
}

function textValue(text: string) {
  return PDFHexString.fromText(text);
}

/**
 * Sign a PDF with an incremental update: the original bytes are kept intact
 * and the signature, its field and the few objects that must change are
 * appended. Earlier signatures therefore stay valid.
 */
export async function signPdf(options: SignPdfOptions): Promise<Uint8Array> {
  const { pdf: original, identity } = options;
  const doc = await openPdf(original);
  const { context } = doc;

  const mdp = certificationLevel(doc);
  if (mdp === 1) {
    throw new SignPdfError(
      "This PDF is certified with “no changes allowed”. Adding another signature would invalidate it.",
    );
  }

  const xref = readXrefInfo(original);
  const firstNewObject = Math.max(xref.size, context.largestObjectNumber + 1);
  context.largestObjectNumber = firstNewObject - 1;

  const modified = new Map<string, PDFRef>();
  const markModified = (ref: PDFRef) => modified.set(ref.toString(), ref);

  /* ---------- signature dictionary with placeholders ---------- */

  const certBytes = identity.chain.reduce(
    (n, c) => n + c.toSchema().toBER(false).byteLength,
    0,
  );
  // Room for the CMS structure: certificates + signature + attributes + slack.
  const capacity = certBytes + 6144;

  const signingTime = options.signingTime ?? new Date();
  const sigDict = context.obj({
    Type: "Sig",
    Filter: "Adobe.PPKLite",
    SubFilter: "ETSI.CAdES.detached",
    ByteRange: [
      0,
      PDFName.of(BYTE_RANGE_PLACEHOLDER),
      PDFName.of(BYTE_RANGE_PLACEHOLDER),
      PDFName.of(BYTE_RANGE_PLACEHOLDER),
    ],
    Contents: PDFHexString.of("0".repeat(capacity * 2)),
    M: PDFString.of(pdfDate(signingTime)),
  });
  const signerName = options.signerName?.trim() || identity.info.commonName;
  sigDict.set(PDFName.of("Name"), textValue(signerName));
  if (options.reason?.trim()) {
    sigDict.set(PDFName.of("Reason"), textValue(options.reason.trim()));
  }
  if (options.location?.trim()) {
    sigDict.set(PDFName.of("Location"), textValue(options.location.trim()));
  }
  if (options.contactInfo?.trim()) {
    sigDict.set(
      PDFName.of("ContactInfo"),
      textValue(options.contactInfo.trim()),
    );
  }
  sigDict.set(
    PDFName.of("Prop_Build"),
    context.obj({ App: { Name: "OpenSourceToolkit" } }),
  );
  const sigRef = context.register(sigDict);

  /* ---------- appearance + widget ---------- */

  const pages = doc.getPages();
  const pageIndex = Math.min(
    Math.max(options.appearance?.pageIndex ?? 0, 0),
    pages.length - 1,
  );
  const page = pages[pageIndex];

  let rect = [0, 0, 0, 0];
  let apRef: PDFRef;

  if (options.appearance) {
    const cropBox = page.getCropBox();
    const draw = toPdfRect(
      options.appearance.box,
      cropBox,
      page.getRotation().angle,
    );
    const image = await doc.embedPng(options.appearance.png);
    await image.embed();

    const r = (draw.rotate * Math.PI) / 180;
    const cos = Math.round(Math.cos(r));
    const sin = Math.round(Math.sin(r));
    const corners = [
      [0, 0],
      [draw.width, 0],
      [0, draw.height],
      [draw.width, draw.height],
    ].map(([lx, ly]) => [
      draw.x + lx * cos - ly * sin,
      draw.y + lx * sin + ly * cos,
    ]);
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    rect = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];

    const w = draw.width.toFixed(3);
    const h = draw.height.toFixed(3);
    // The form's Matrix counter-rotates the page /Rotate so it reads upright.
    const appearance = context.flateStream(`q ${w} 0 0 ${h} 0 0 cm /Img Do Q`, {
      Type: "XObject",
      Subtype: "Form",
      BBox: [0, 0, draw.width, draw.height],
      Matrix: [cos, sin, -sin, cos, 0, 0],
      Resources: { XObject: { Img: image.ref } },
    });
    apRef = context.register(appearance);
  } else {
    apRef = context.register(
      context.stream("", {
        Type: "XObject",
        Subtype: "Form",
        BBox: [0, 0, 0, 0],
      }),
    );
  }

  const fieldName = nextFieldName(doc);
  const widget = context.obj({
    Type: "Annot",
    Subtype: "Widget",
    FT: "Sig",
    F: 132, // Print + Locked
    Rect: rect,
    V: sigRef,
    P: page.ref,
    AP: { N: apRef },
  });
  widget.set(PDFName.of("T"), textValue(fieldName));
  const widgetRef = context.register(widget);

  /* ---------- hook the widget into the page and AcroForm ---------- */

  const annotsKey = PDFName.of("Annots");
  const annots = page.node.get(annotsKey);
  if (annots instanceof PDFRef) {
    const arr = lookupArray(doc, annots);
    if (!arr) throw new SignPdfError("Page annotations are malformed.");
    arr.push(widgetRef);
    markModified(annots);
  } else if (annots instanceof PDFArray) {
    annots.push(widgetRef);
    markModified(page.ref);
  } else {
    page.node.set(annotsKey, context.obj([widgetRef]));
    markModified(page.ref);
  }

  const rootRef = context.trailerInfo.Root as PDFRef;
  const acroKey = PDFName.of("AcroForm");
  const acroValue = doc.catalog.get(acroKey);
  let acroForm: PDFDict;
  if (acroValue instanceof PDFRef) {
    const dict = lookupDict(doc, acroValue);
    if (!dict) throw new SignPdfError("The PDF form dictionary is malformed.");
    acroForm = dict;
    markModified(acroValue);
  } else if (acroValue instanceof PDFDict) {
    acroForm = acroValue;
    markModified(rootRef);
  } else {
    acroForm = context.obj({ Fields: [] });
    doc.catalog.set(acroKey, context.register(acroForm));
    markModified(rootRef);
  }

  const fieldsKey = PDFName.of("Fields");
  const fields = acroForm.get(fieldsKey);
  if (fields instanceof PDFRef) {
    const arr = lookupArray(doc, fields);
    if (!arr) throw new SignPdfError("The PDF form field list is malformed.");
    arr.push(widgetRef);
    markModified(fields);
  } else if (fields instanceof PDFArray) {
    fields.push(widgetRef);
  } else {
    acroForm.set(fieldsKey, context.obj([widgetRef]));
  }
  acroForm.set(PDFName.of("SigFlags"), context.obj(3));

  /* ---------- serialize the incremental update ---------- */

  const objects: [PDFRef, PDFObject][] = [];
  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (ref.objectNumber >= firstNewObject) objects.push([ref, obj]);
  }
  for (const ref of modified.values()) {
    if (ref.objectNumber >= firstNewObject) continue;
    const obj = context.lookup(ref);
    if (obj) objects.push([ref, obj]);
  }
  objects.sort((a, b) => a[0].objectNumber - b[0].objectNumber);

  const last = original[original.length - 1];
  const lead =
    last === 0x0a || last === 0x0d ? new Uint8Array() : latin1ToBytes("\n");

  const chunks: Uint8Array[] = [original, lead];
  let offset = original.length + lead.length;
  const offsets = new Map<number, { offset: number; gen: number }>();
  let sigObjectStart = -1;
  let sigObjectEnd = -1;

  const push = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  for (const [ref, obj] of objects) {
    offsets.set(ref.objectNumber, { offset, gen: ref.generationNumber });
    if (ref === sigRef) sigObjectStart = offset;
    push(latin1ToBytes(`${ref.objectNumber} ${ref.generationNumber} obj\n`));
    push(serialize(obj));
    push(latin1ToBytes("\nendobj\n"));
    if (ref === sigRef) sigObjectEnd = offset;
  }

  const trailer = context.trailerInfo;
  const idArray = trailer.ID instanceof PDFArray ? trailer.ID : undefined;
  const firstId =
    idArray?.get(0)?.toString() ?? `<${bytesToHex(randomBytes(16))}>`;
  const newId = `<${bytesToHex(randomBytes(16))}>`;
  const infoPart = trailer.Info ? ` /Info ${trailer.Info.toString()}` : "";

  if (xref.isStream) {
    const xrefNumber = context.largestObjectNumber + 1;
    const xrefOffset = offset;
    offsets.set(xrefNumber, { offset: xrefOffset, gen: 0 });

    const numbers = [...offsets.keys()].sort((a, b) => a - b);
    const index: number[] = [];
    const entries: number[] = [];
    for (let i = 0; i < numbers.length; i++) {
      if (i === 0 || numbers[i] !== numbers[i - 1] + 1)
        index.push(numbers[i], 0);
      index[index.length - 1]++;
      const { offset: off, gen } = offsets.get(numbers[i])!;
      entries.push(
        1,
        (off >>> 24) & 255,
        (off >>> 16) & 255,
        (off >>> 8) & 255,
        off & 255,
      );
      entries.push((gen >>> 8) & 255, gen & 255);
    }
    const data = new Uint8Array(entries);
    push(
      latin1ToBytes(
        `${xrefNumber} 0 obj\n<< /Type /XRef /Size ${xrefNumber + 1} /W [1 4 2] ` +
          `/Index [${index.join(" ")}] /Root ${rootRef.toString()}${infoPart} ` +
          `/ID [${firstId} ${newId}] /Prev ${xref.startXref} /Length ${data.length} >>\nstream\n`,
      ),
    );
    push(data);
    push(
      latin1ToBytes(`\nendstream\nendobj\nstartxref\n${xrefOffset}\n%%EOF\n`),
    );
  } else {
    const xrefOffset = offset;
    const numbers = [...offsets.keys()].sort((a, b) => a - b);
    let table = "xref\n";
    let i = 0;
    while (i < numbers.length) {
      let j = i;
      while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++;
      table += `${numbers[i]} ${j - i + 1}\n`;
      for (let k = i; k <= j; k++) {
        const { offset: off, gen } = offsets.get(numbers[k])!;
        table += `${String(off).padStart(10, "0")} ${String(gen).padStart(5, "0")} n\r\n`;
      }
      i = j + 1;
    }
    table +=
      `trailer\n<< /Size ${context.largestObjectNumber + 1} /Root ${rootRef.toString()}${infoPart} ` +
      `/ID [${firstId} ${newId}] /Prev ${xref.startXref} >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    push(latin1ToBytes(table));
  }

  const output = concatBytes(...chunks);

  /* ---------- fill in ByteRange and Contents ---------- */

  const sigText = bytesToLatin1(output.subarray(sigObjectStart, sigObjectEnd));
  const contentsRel = sigText.indexOf(`<${"0".repeat(64)}`);
  if (contentsRel < 0)
    throw new SignPdfError("Signature placeholder not found.");
  const contentsStart = sigObjectStart + contentsRel;
  const contentsEnd = contentsStart + capacity * 2 + 2;

  const byteRange = [
    0,
    contentsStart,
    contentsEnd,
    output.length - contentsEnd,
  ];
  let searchFrom = 0;
  for (const value of byteRange.slice(1)) {
    const rel = sigText.indexOf(`/${BYTE_RANGE_PLACEHOLDER}`, searchFrom);
    if (rel < 0) throw new SignPdfError("ByteRange placeholder not found.");
    output.set(
      latin1ToBytes(String(value).padEnd(BYTE_RANGE_SLOT, " ")),
      sigObjectStart + rel,
    );
    searchFrom = rel + BYTE_RANGE_SLOT;
  }

  const signedBytes = concatBytes(
    output.subarray(0, contentsStart),
    output.subarray(contentsEnd),
  );
  const digest = await sha256(signedBytes);
  const cms = await createCadesSignature({
    digest,
    privateKey: identity.privateKey,
    chain: identity.chain,
  });
  const cmsHex = bytesToHex(cms);
  if (cmsHex.length > capacity * 2) {
    throw new SignPdfError(
      "The signature is larger than the space reserved for it.",
    );
  }
  output.set(latin1ToBytes(cmsHex), contentsStart + 1);

  return output;
}
