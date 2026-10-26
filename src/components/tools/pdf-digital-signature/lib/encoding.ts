/** Byte / text helpers shared by the PKI and PDF modules. No DOM access. */

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let hex = "";
  for (let i = 0; i < view.length; i++) {
    hex += view[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const even = clean.length % 2 ? clean + "0" : clean;
  const out = new Uint8Array(even.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(even.substr(i * 2, 2), 16);
  }
  return out;
}

export function formatFingerprint(bytes: ArrayBuffer | Uint8Array): string {
  return bytesToHex(bytes).toUpperCase().match(/.{2}/g)?.join(":") ?? "";
}

/** Latin-1 view of bytes, so string offsets equal byte offsets. */
export function bytesToLatin1(bytes: Uint8Array): string {
  let out = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + CHUNK)),
    );
  }
  return out;
}

export function latin1ToBytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

export function utf8(text: string): ArrayBuffer {
  return toArrayBuffer(new TextEncoder().encode(text));
}

function base64Encode(bytes: Uint8Array): string {
  return btoa(bytesToLatin1(bytes));
}

function base64Decode(b64: string): Uint8Array {
  return latin1ToBytes(atob(b64.replace(/\s+/g, "")));
}

export function toPem(der: ArrayBuffer | Uint8Array, label: string): string {
  const bytes = der instanceof Uint8Array ? der : new Uint8Array(der);
  const body =
    base64Encode(bytes)
      .match(/.{1,64}/g)
      ?.join("\n") ?? "";
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----\n`;
}

export interface PemBlock {
  label: string;
  der: Uint8Array;
}

export function parsePemBlocks(text: string): PemBlock[] {
  const blocks: PemBlock[] = [];
  const re = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    blocks.push({ label: match[1], der: base64Decode(match[2]) });
  }
  return blocks;
}

/** PEM text or raw DER bytes → list of DER blobs with their PEM labels. */
export function readDerOrPem(bytes: Uint8Array): PemBlock[] {
  const head = bytesToLatin1(bytes.subarray(0, 64));
  if (head.includes("-----BEGIN")) {
    return parsePemBlocks(new TextDecoder().decode(bytes));
  }
  return [{ label: "", der: bytes }];
}

export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  crypto.getRandomValues(out);
  return out;
}

export async function sha256(data: BufferSource): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", data);
}
