import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { PDFName, PDFNumber, PDFRef } from "pdf-lib";

import {
  bytesToHex,
  bytesToLatin1,
  concatBytes,
  hexToBytes,
  toArrayBuffer,
} from "./encoding";
import {
  describeCertificate,
  isSameCertificate,
  OID,
  orderChain,
  type CertificateInfo,
} from "./pki";
import {
  listFields,
  lookupArray,
  lookupDict,
  openPdf,
  parsePdfDate,
  readNumber,
  readText,
} from "./pdfStructure";

export type IntegrityStatus = "valid" | "invalid" | "unsupported";
export type TrustStatus = "trusted" | "self-signed" | "unknown";

export interface TimestampInfo {
  time: Date;
  authority: string;
  valid: boolean;
}

export interface SignatureReport {
  fieldName: string;
  pageNumber?: number;
  visible: boolean;
  subFilter: string;
  isDocumentTimestamp: boolean;
  signerName?: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  /** Time claimed by the signer's own device (/M or signingTime). */
  claimedTime?: Date;
  timestamp?: TimestampInfo;
  byteRange: number[];
  /** Bytes [0, revisionLength) are what this signature covers. */
  revisionLength: number;
  coversWholeFile: boolean;
  integrity: IntegrityStatus;
  integrityMessage: string;
  signer?: CertificateInfo;
  chain: CertificateInfo[];
  certValidAtSigning?: boolean;
  trust: TrustStatus;
  trustMessage: string;
  /** DocMDP level for certification signatures. */
  certificationLevel?: number;
  digestAlgorithm?: string;
}

export interface VerifyReport {
  signatures: SignatureReport[];
  emptySignatureFields: string[];
  fileSize: number;
}

const DIGESTS: Record<string, string> = {
  [OID.sha1]: "SHA-1",
  [OID.sha256]: "SHA-256",
  [OID.sha384]: "SHA-384",
  [OID.sha512]: "SHA-512",
};

function parseCms(bytes: Uint8Array): pkijs.SignedData {
  const asn = asn1js.fromBER(toArrayBuffer(bytes));
  if (asn.offset === -1) throw new Error("Signature data is not valid ASN.1");
  const contentInfo = new pkijs.ContentInfo({ schema: asn.result });
  if (contentInfo.contentType !== OID.signedData) {
    throw new Error("Signature is not a CMS SignedData structure");
  }
  return new pkijs.SignedData({ schema: contentInfo.content });
}

function findAttribute(
  attrs: pkijs.SignedAndUnsignedAttributes | undefined,
  oid: string,
) {
  return attrs?.attributes.find((a) => a.type === oid);
}

function certificatesOf(signedData: pkijs.SignedData): pkijs.Certificate[] {
  return (signedData.certificates ?? []).filter(
    (c): c is pkijs.Certificate => c instanceof pkijs.Certificate,
  );
}

async function verifySignedData(
  signedData: pkijs.SignedData,
  data?: ArrayBuffer,
): Promise<{
  ok: boolean;
  message: string;
  signer: pkijs.Certificate | null;
}> {
  try {
    const result = await signedData.verify({
      signer: 0,
      data,
      extendedMode: true,
      checkChain: false,
    });
    return {
      ok: Boolean(result.signatureVerified),
      message: result.signatureVerified
        ? "The document has not been modified since it was signed."
        : result.message || "Signature check failed.",
      signer: result.signerCertificate ?? null,
    };
  } catch (err) {
    const e = err as pkijs.SignedDataVerifyError;
    const raw = e?.message || "Signature check failed.";
    const message = /digest/i.test(raw)
      ? "The signed content was changed after signing (hash mismatch)."
      : raw;
    return { ok: false, message, signer: e?.signerCertificate ?? null };
  }
}

/** Verify an RFC 3161 token and return its time if it matches `imprintData`. */
async function readTimestamp(
  tokenBytes: ArrayBuffer,
  imprintData: Uint8Array,
): Promise<TimestampInfo | undefined> {
  try {
    const signedData = parseCms(new Uint8Array(tokenBytes));
    const eContent = signedData.encapContentInfo.eContent;
    if (!eContent) return undefined;
    const tstInfo = pkijs.TSTInfo.fromBER(eContent.getValue());

    const hashName = DIGESTS[tstInfo.messageImprint.hashAlgorithm.algorithmId];
    let imprintOk = false;
    if (hashName) {
      const hash = await crypto.subtle.digest(hashName, imprintData);
      imprintOk =
        bytesToHex(hash) ===
        bytesToHex(
          tstInfo.messageImprint.hashedMessage.valueBlock.valueHexView,
        );
    }
    // For TSTInfo content pkijs checks the imprint against `data` itself.
    const sig = await verifySignedData(signedData, toArrayBuffer(imprintData));
    const tsaCert = sig.signer;
    const authority = tsaCert
      ? (await describeCertificate(tsaCert)).commonName
      : "Unknown time-stamp authority";
    return { time: tstInfo.genTime, authority, valid: imprintOk && sig.ok };
  } catch {
    return undefined;
  }
}

/** Walk leaf → root and see whether any certificate is one the user trusts. */
async function evaluateTrust(
  chain: pkijs.Certificate[],
  trusted: pkijs.Certificate[],
): Promise<{ status: TrustStatus; message: string }> {
  const leaf = chain[0];
  const selfSigned =
    leaf.subject.isEqual(leaf.issuer) &&
    (await leaf.verify().catch(() => false));

  for (let i = 0; i < chain.length; i++) {
    const cert = chain[i];
    if (trusted.some((t) => isSameCertificate(t, cert))) {
      // Make sure every link below the trusted cert really is signed by the next.
      let linksOk = true;
      for (let k = 0; k < i; k++) {
        if (!(await chain[k].verify(chain[k + 1]).catch(() => false))) {
          linksOk = false;
          break;
        }
      }
      if (linksOk) {
        return {
          status: "trusted",
          message:
            i === 0
              ? "The signer's certificate is in your trusted list."
              : "The signer's certificate chains to a certificate you trust.",
        };
      }
    }
  }

  // The chain may stop below a trusted root that wasn't embedded.
  const top = chain[chain.length - 1];
  for (const t of trusted) {
    if (
      top.issuer.isEqual(t.subject) &&
      (await top.verify(t).catch(() => false))
    ) {
      return {
        status: "trusted",
        message: "The signer's certificate chains to a certificate you trust.",
      };
    }
  }

  if (selfSigned) {
    return {
      status: "self-signed",
      message:
        "Self-signed certificate: the document is intact, but anyone can create a certificate with this name. Add the signer's certificate to your trusted list if you received it from them directly.",
    };
  }
  return {
    status: "unknown",
    message:
      "The issuer of this certificate isn't in your trusted list, so the signer's identity can't be confirmed here. Add the issuing CA's certificate to trust it.",
  };
}

export async function verifyPdf(
  bytes: Uint8Array,
  trustedCertificates: pkijs.Certificate[] = [],
): Promise<VerifyReport> {
  const doc = await openPdf(bytes);
  const pageRefs = doc.getPages().map((p) => p.ref.toString());
  const signatures: SignatureReport[] = [];
  const emptySignatureFields: string[] = [];

  for (const field of listFields(doc)) {
    if (field.type !== "Sig") continue;
    const sigDict = lookupDict(doc, field.dict.get(PDFName.of("V")));
    if (!sigDict) {
      emptySignatureFields.push(field.name || "(unnamed)");
      continue;
    }

    const subFilterObj = sigDict.get(PDFName.of("SubFilter"));
    const subFilter =
      subFilterObj instanceof PDFName ? subFilterObj.decodeText() : "unknown";
    const isDocumentTimestamp = subFilter === "ETSI.RFC3161";

    const br = lookupArray(doc, sigDict.get(PDFName.of("ByteRange")));
    const byteRange =
      br?.asArray().map((n) => (n instanceof PDFNumber ? n.asNumber() : NaN)) ??
      [];

    const rectArr = lookupArray(doc, field.dict.get(PDFName.of("Rect")));
    const rect = rectArr?.asArray().map((n) => readNumber(doc, n) ?? 0) ?? [];
    const visible =
      rect.length === 4 &&
      Math.abs(rect[2] - rect[0]) > 1 &&
      Math.abs(rect[3] - rect[1]) > 1;

    let pageNumber: number | undefined;
    const pRef = field.dict.get(PDFName.of("P"));
    if (pRef instanceof PDFRef) {
      const idx = pageRefs.indexOf(pRef.toString());
      if (idx >= 0) pageNumber = idx + 1;
    }
    if (pageNumber === undefined && field.ref) {
      const target = field.ref.toString();
      doc.getPages().forEach((p, i) => {
        const annots = lookupArray(doc, p.node.get(PDFName.of("Annots")));
        if (
          annots
            ?.asArray()
            .some((a) => a instanceof PDFRef && a.toString() === target)
        ) {
          pageNumber = i + 1;
        }
      });
    }

    let certificationLevel: number | undefined;
    const refs = lookupArray(doc, sigDict.get(PDFName.of("Reference")));
    for (const item of refs?.asArray() ?? []) {
      const ref = lookupDict(doc, item);
      const method = ref?.get(PDFName.of("TransformMethod"));
      if (method instanceof PDFName && method.decodeText() === "DocMDP") {
        const params = lookupDict(doc, ref?.get(PDFName.of("TransformParams")));
        certificationLevel = readNumber(doc, params?.get(PDFName.of("P"))) ?? 2;
      }
    }

    const report: SignatureReport = {
      fieldName: field.name || "(unnamed)",
      pageNumber,
      visible,
      subFilter,
      isDocumentTimestamp,
      signerName: readText(doc, sigDict.get(PDFName.of("Name"))),
      reason: readText(doc, sigDict.get(PDFName.of("Reason"))),
      location: readText(doc, sigDict.get(PDFName.of("Location"))),
      contactInfo: readText(doc, sigDict.get(PDFName.of("ContactInfo"))),
      claimedTime: parsePdfDate(readText(doc, sigDict.get(PDFName.of("M")))),
      byteRange,
      revisionLength: 0,
      coversWholeFile: false,
      integrity: "invalid",
      integrityMessage: "",
      chain: [],
      trust: "unknown",
      trustMessage: "",
      certificationLevel,
    };
    signatures.push(report);

    // ---- byte range sanity ----
    const [a, b, c, d] = byteRange;
    const rangeOk =
      byteRange.length === 4 &&
      byteRange.every((n) => Number.isInteger(n) && n >= 0) &&
      a === 0 &&
      b < c &&
      c + d <= bytes.length &&
      bytes[b] === 0x3c && // "<"
      bytes[c - 1] === 0x3e; // ">"
    if (!rangeOk) {
      report.integrityMessage =
        "The signature's byte range is malformed or points outside the file.";
      continue;
    }
    report.revisionLength = c + d;
    report.coversWholeFile = c + d === bytes.length;

    const signedData = concatBytes(
      bytes.subarray(a, a + b),
      bytes.subarray(c, c + d),
    );
    const contents = hexToBytes(bytesToLatin1(bytes.subarray(b + 1, c - 1)));

    if (subFilter === "adbe.x509.rsa_sha1") {
      report.integrity = "unsupported";
      report.integrityMessage =
        "This legacy signature format (adbe.x509.rsa_sha1) can't be checked by this tool.";
      continue;
    }

    let cms: pkijs.SignedData;
    try {
      cms = parseCms(contents);
    } catch (err) {
      report.integrityMessage =
        err instanceof Error
          ? err.message
          : "Could not read the signature data.";
      continue;
    }

    const certs = certificatesOf(cms);
    const signerInfo = cms.signerInfos[0];
    report.digestAlgorithm = DIGESTS[signerInfo?.digestAlgorithm.algorithmId];

    if (isDocumentTimestamp) {
      const ts = await readTimestamp(toArrayBuffer(contents), signedData);
      if (ts) {
        report.timestamp = ts;
        report.integrity = ts.valid ? "valid" : "invalid";
        report.integrityMessage = ts.valid
          ? "Document time-stamp is intact."
          : "The document changed after it was time-stamped.";
      } else {
        report.integrityMessage = "Could not read the document time-stamp.";
      }
    } else if (subFilter === "adbe.pkcs7.sha1") {
      const sig = await verifySignedData(cms);
      const eContent = cms.encapContentInfo.eContent?.getValue();
      const sha1 = await crypto.subtle.digest("SHA-1", signedData);
      const hashOk = !!eContent && bytesToHex(eContent) === bytesToHex(sha1);
      report.integrity = sig.ok && hashOk ? "valid" : "invalid";
      report.integrityMessage =
        sig.ok && hashOk
          ? "The document has not been modified since it was signed."
          : "The document was changed after signing.";
      if (sig.signer) certs.unshift(sig.signer);
    } else {
      const sig = await verifySignedData(cms, toArrayBuffer(signedData));
      report.integrity = sig.ok ? "valid" : "invalid";
      report.integrityMessage = sig.message;
      if (sig.signer && !certs.includes(sig.signer)) certs.unshift(sig.signer);
    }

    // ---- signer / chain ----
    let leaf: pkijs.Certificate | undefined;
    const sid = signerInfo?.sid;
    if (sid instanceof pkijs.IssuerAndSerialNumber) {
      leaf = certs.find(
        (cert) =>
          cert.issuer.isEqual(sid.issuer) &&
          bytesToHex(cert.serialNumber.valueBlock.valueHexView) ===
            bytesToHex(sid.serialNumber.valueBlock.valueHexView),
      );
    }
    leaf ??= certs[0];

    if (leaf) {
      const chain = orderChain(leaf, certs);
      report.signer = await describeCertificate(leaf);
      report.chain = await Promise.all(
        chain.map((cert) => describeCertificate(cert)),
      );
      const trust = await evaluateTrust(chain, trustedCertificates);
      report.trust = trust.status;
      report.trustMessage = trust.message;
    } else {
      report.trustMessage =
        "The signature doesn't include the signer's certificate.";
    }

    // ---- times ----
    const signingTimeAttr = findAttribute(
      signerInfo?.signedAttrs,
      OID.signingTime,
    );
    const attrTime = signingTimeAttr?.values[0] as
      | asn1js.UTCTime
      | asn1js.GeneralizedTime
      | undefined;
    if (attrTime?.toDate) report.claimedTime = attrTime.toDate();

    const tokenAttr = findAttribute(
      signerInfo?.unsignedAttrs,
      OID.timeStampToken,
    );
    if (tokenAttr && signerInfo) {
      const token = (tokenAttr.values[0] as asn1js.Sequence).toBER(false);
      report.timestamp = await readTimestamp(
        token,
        signerInfo.signature.valueBlock.valueHexView,
      );
    }

    const when = report.timestamp?.valid
      ? report.timestamp.time
      : report.claimedTime;
    if (report.signer && when) {
      report.certValidAtSigning =
        when >= report.signer.notBefore && when <= report.signer.notAfter;
    }
  }

  // Order by how much of the file each signature covers (= signing order).
  signatures.sort((x, y) => x.revisionLength - y.revisionLength);

  return { signatures, emptySignatureFields, fileSize: bytes.length };
}

/** The exact bytes a signature covers – the document as it was signed. */
export function extractRevision(bytes: Uint8Array, report: SignatureReport) {
  return bytes.slice(0, report.revisionLength);
}

/** Parse .cer/.crt/.pem files (possibly several certs) for the trust list. */
export function parseCertificates(blobs: Uint8Array[]): pkijs.Certificate[] {
  return blobs.map((der) => pkijs.Certificate.fromBER(toArrayBuffer(der)));
}
