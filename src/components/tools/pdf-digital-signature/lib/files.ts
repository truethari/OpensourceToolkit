import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

import { readDerOrPem, toArrayBuffer } from "./encoding";
import { OID } from "./pki";

export interface ParsedCertificateFile {
  certificates: pkijs.Certificate[];
  requests: pkijs.CertificationRequest[];
}

function certsFromPkcs7(der: Uint8Array): pkijs.Certificate[] {
  const asn = asn1js.fromBER(toArrayBuffer(der));
  const info = new pkijs.ContentInfo({ schema: asn.result });
  if (info.contentType !== OID.signedData) return [];
  const signed = new pkijs.SignedData({ schema: info.content });
  return (signed.certificates ?? []).filter(
    (c): c is pkijs.Certificate => c instanceof pkijs.Certificate,
  );
}

/**
 * Read certificates and certificate requests from PEM or DER files:
 * .cer/.crt/.pem/.der, PKCS#7 bundles (.p7b/.p7c) and CSRs.
 */
export function parseCertificateFile(bytes: Uint8Array): ParsedCertificateFile {
  const out: ParsedCertificateFile = { certificates: [], requests: [] };

  for (const block of readDerOrPem(bytes)) {
    const label = block.label;
    if (
      label === "CERTIFICATE" ||
      label === "X509 CERTIFICATE" ||
      label === "TRUSTED CERTIFICATE"
    ) {
      out.certificates.push(
        pkijs.Certificate.fromBER(toArrayBuffer(block.der)),
      );
      continue;
    }
    if (
      label === "CERTIFICATE REQUEST" ||
      label === "NEW CERTIFICATE REQUEST"
    ) {
      out.requests.push(
        pkijs.CertificationRequest.fromBER(toArrayBuffer(block.der)),
      );
      continue;
    }
    if (label === "PKCS7" || label === "CMS") {
      out.certificates.push(...certsFromPkcs7(block.der));
      continue;
    }
    if (label) continue; // keys etc. – not certificates

    // Raw DER: try each structure in turn.
    try {
      out.certificates.push(
        pkijs.Certificate.fromBER(toArrayBuffer(block.der)),
      );
      continue;
    } catch {
      /* not a certificate */
    }
    try {
      out.requests.push(
        pkijs.CertificationRequest.fromBER(toArrayBuffer(block.der)),
      );
      continue;
    } catch {
      /* not a CSR */
    }
    try {
      out.certificates.push(...certsFromPkcs7(block.der));
    } catch {
      /* not PKCS#7 */
    }
  }
  return out;
}

export interface PrivateKeyFile {
  encrypted: boolean;
  der: Uint8Array;
}

/** Find a PKCS#8 private key (encrypted or not) in a PEM/DER file. */
export function findPrivateKey(bytes: Uint8Array): PrivateKeyFile | null {
  for (const block of readDerOrPem(bytes)) {
    if (block.label === "ENCRYPTED PRIVATE KEY")
      return { encrypted: true, der: block.der };
    if (block.label === "PRIVATE KEY")
      return { encrypted: false, der: block.der };
    if (block.label === "RSA PRIVATE KEY" || block.label === "EC PRIVATE KEY") {
      throw new Error(
        "This key is in the old OpenSSL format. Convert it first with: openssl pkcs8 -topk8 -in old.key -out new.key",
      );
    }
    if (!block.label) {
      // DER: guess encrypted vs plain by trying the plain structure first.
      try {
        pkijs.PrivateKeyInfo.fromBER(toArrayBuffer(block.der));
        return { encrypted: false, der: block.der };
      } catch {
        return { encrypted: true, der: block.der };
      }
    }
  }
  return null;
}

export function isPkcs12Name(name: string): boolean {
  return /\.(p12|pfx)$/i.test(name);
}
