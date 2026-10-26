import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

import {
  formatFingerprint,
  randomBytes,
  toArrayBuffer,
  bytesToHex,
} from "./encoding";

export type KeyType =
  | "RSA-2048"
  | "RSA-3072"
  | "RSA-4096"
  | "ECDSA-P256"
  | "ECDSA-P384";

export const KEY_TYPES: { value: KeyType; label: string; hint: string }[] = [
  { value: "RSA-2048", label: "RSA 2048", hint: "Most compatible" },
  { value: "RSA-3072", label: "RSA 3072", hint: "Recommended" },
  { value: "RSA-4096", label: "RSA 4096", hint: "Strongest RSA, larger" },
  { value: "ECDSA-P256", label: "ECDSA P-256", hint: "Small & fast" },
  { value: "ECDSA-P384", label: "ECDSA P-384", hint: "Small, stronger" },
];

export interface SubjectFields {
  commonName: string;
  email?: string;
  organization?: string;
  organizationalUnit?: string;
  locality?: string;
  state?: string;
  country?: string;
}

/** Issuer used to sign a certificate; omitted for self-signed. */
export interface Issuer {
  certificate: pkijs.Certificate;
  privateKey: CryptoKey;
}

export const OID = {
  data: "1.2.840.113549.1.7.1",
  signedData: "1.2.840.113549.1.7.2",
  contentType: "1.2.840.113549.1.9.3",
  messageDigest: "1.2.840.113549.1.9.4",
  signingTime: "1.2.840.113549.1.9.5",
  signingCertificateV2: "1.2.840.113549.1.9.16.2.47",
  signingCertificate: "1.2.840.113549.1.9.16.2.12",
  timeStampToken: "1.2.840.113549.1.9.16.2.14",
  tstInfo: "1.2.840.113549.1.9.16.1.4",
  sha1: "1.3.14.3.2.26",
  sha256: "2.16.840.1.101.3.4.2.1",
  sha384: "2.16.840.1.101.3.4.2.2",
  sha512: "2.16.840.1.101.3.4.2.3",
  rsaEncryption: "1.2.840.113549.1.1.1",
  ecPublicKey: "1.2.840.10045.2.1",
  basicConstraints: "2.5.29.19",
  keyUsage: "2.5.29.15",
  extKeyUsage: "2.5.29.37",
  subjectKeyIdentifier: "2.5.29.14",
  authorityKeyIdentifier: "2.5.29.35",
  subjectAltName: "2.5.29.17",
  extensionRequest: "1.2.840.113549.1.9.14",
} as const;

const NAME_OIDS: Record<keyof SubjectFields, string> = {
  country: "2.5.4.6",
  state: "2.5.4.8",
  locality: "2.5.4.7",
  organization: "2.5.4.10",
  organizationalUnit: "2.5.4.11",
  commonName: "2.5.4.3",
  email: "1.2.840.113549.1.9.1",
};

const NAME_LABELS: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "2.5.4.5": "serialNumber",
  "2.5.4.4": "SN",
  "2.5.4.42": "GN",
  "2.5.4.12": "T",
  "2.5.4.97": "organizationIdentifier",
  "1.2.840.113549.1.9.1": "E",
};

const CURVES: Record<string, string> = {
  "1.2.840.10045.3.1.7": "P-256",
  "1.3.132.0.34": "P-384",
  "1.3.132.0.35": "P-521",
};

const SIGNATURE_ALGORITHMS: Record<string, string> = {
  "1.2.840.113549.1.1.5": "SHA-1 with RSA",
  "1.2.840.113549.1.1.11": "SHA-256 with RSA",
  "1.2.840.113549.1.1.12": "SHA-384 with RSA",
  "1.2.840.113549.1.1.13": "SHA-512 with RSA",
  "1.2.840.113549.1.1.10": "RSASSA-PSS",
  "1.2.840.113549.1.1.1": "RSA",
  "1.2.840.10045.4.1": "ECDSA with SHA-1",
  "1.2.840.10045.4.3.2": "ECDSA with SHA-256",
  "1.2.840.10045.4.3.3": "ECDSA with SHA-384",
  "1.2.840.10045.4.3.4": "ECDSA with SHA-512",
};

const EKU_NAMES: Record<string, string> = {
  "1.3.6.1.5.5.7.3.1": "TLS server",
  "1.3.6.1.5.5.7.3.2": "TLS client",
  "1.3.6.1.5.5.7.3.3": "Code signing",
  "1.3.6.1.5.5.7.3.4": "Email protection",
  "1.3.6.1.5.5.7.3.8": "Time stamping",
  "1.3.6.1.5.5.7.3.9": "OCSP signing",
  "1.3.6.1.5.5.7.3.36": "Document signing",
  "1.3.6.1.4.1.311.10.3.12": "Document signing (Microsoft)",
  "1.2.840.113583.1.1.5": "PDF signing (Adobe)",
};

const KEY_USAGE_BITS = [
  "Digital signature",
  "Non-repudiation",
  "Key encipherment",
  "Data encipherment",
  "Key agreement",
  "Certificate signing",
  "CRL signing",
  "Encipher only",
  "Decipher only",
];

/* ------------------------------------------------------------------ */
/* Keys                                                                */
/* ------------------------------------------------------------------ */

export function hashForKey(key: CryptoKey): "SHA-256" | "SHA-384" {
  const algo = key.algorithm as EcKeyAlgorithm;
  return algo.name === "ECDSA" && algo.namedCurve === "P-384"
    ? "SHA-384"
    : "SHA-256";
}

export async function generateKeyPair(type: KeyType): Promise<CryptoKeyPair> {
  if (type.startsWith("RSA")) {
    return crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: Number(type.split("-")[1]),
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );
  }
  return crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: type === "ECDSA-P384" ? "P-384" : "P-256" },
    true,
    ["sign", "verify"],
  );
}

/** Import a PKCS#8 private key for signing, detecting RSA vs EC. */
export async function importPrivateKey(
  keyInfo: pkijs.PrivateKeyInfo,
  extractable = false,
): Promise<CryptoKey> {
  const der = keyInfo.toSchema().toBER(false);
  const oid = keyInfo.privateKeyAlgorithm.algorithmId;

  if (oid === OID.rsaEncryption) {
    return crypto.subtle.importKey(
      "pkcs8",
      der,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      extractable,
      ["sign"],
    );
  }
  if (oid === OID.ecPublicKey) {
    const params = keyInfo.privateKeyAlgorithm.algorithmParams;
    const curveOid =
      params instanceof asn1js.ObjectIdentifier
        ? params.valueBlock.toString()
        : "";
    const namedCurve = CURVES[curveOid];
    if (!namedCurve) {
      throw new Error("Unsupported elliptic curve in private key");
    }
    return crypto.subtle.importKey(
      "pkcs8",
      der,
      { name: "ECDSA", namedCurve },
      extractable,
      ["sign"],
    );
  }
  throw new Error(
    "Unsupported private key type. Only RSA and ECDSA (P-256/P-384/P-521) keys are supported.",
  );
}

export async function exportPrivateKeyInfo(
  key: CryptoKey,
): Promise<pkijs.PrivateKeyInfo> {
  const der = await crypto.subtle.exportKey("pkcs8", key);
  return pkijs.PrivateKeyInfo.fromBER(der);
}

/** True when the private key belongs to the certificate's public key. */
export async function keyMatchesCertificate(
  privateKey: CryptoKey,
  certificate: pkijs.Certificate,
): Promise<boolean> {
  const algo = privateKey.algorithm as RsaHashedKeyAlgorithm & EcKeyAlgorithm;
  const challenge = randomBytes(32);
  try {
    const importAlgo =
      algo.name === "ECDSA"
        ? { name: "ECDSA", namedCurve: algo.namedCurve }
        : { name: algo.name, hash: "SHA-256" };
    const signAlgo =
      algo.name === "ECDSA"
        ? { name: "ECDSA", hash: "SHA-256" }
        : { name: algo.name };
    const publicKey = await crypto.subtle.importKey(
      "spki",
      certificate.subjectPublicKeyInfo.toSchema().toBER(false),
      importAlgo,
      false,
      ["verify"],
    );
    const signature = await crypto.subtle.sign(signAlgo, privateKey, challenge);
    return crypto.subtle.verify(signAlgo, publicKey, signature, challenge);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Names                                                               */
/* ------------------------------------------------------------------ */

export function buildName(
  fields: SubjectFields,
): pkijs.RelativeDistinguishedNames {
  const rdns: asn1js.Set[] = [];
  (Object.keys(NAME_OIDS) as (keyof SubjectFields)[]).forEach((key) => {
    const value = fields[key]?.trim();
    if (!value) return;
    let asn: asn1js.BaseStringBlock;
    if (key === "country") asn = new asn1js.PrintableString({ value });
    else if (key === "email") asn = new asn1js.IA5String({ value });
    else asn = new asn1js.Utf8String({ value });
    rdns.push(
      new asn1js.Set({
        value: [
          new pkijs.AttributeTypeAndValue({
            type: NAME_OIDS[key],
            value: asn,
          }).toSchema(),
        ],
      }),
    );
  });
  // pkijs would put every attribute into one multi-valued RDN when building
  // from scratch ("C=.. + O=.. + CN=.."); encoding one SET per attribute and
  // parsing it back keeps the conventional one-attribute-per-RDN layout.
  return pkijs.RelativeDistinguishedNames.fromBER(
    new asn1js.Sequence({ value: rdns }).toBER(false),
  );
}

export type NameMap = Record<string, string>;

export function readName(name: pkijs.RelativeDistinguishedNames): NameMap {
  const out: NameMap = {};
  for (const tv of name.typesAndValues) {
    const label = NAME_LABELS[tv.type] ?? tv.type;
    const block = tv.value as unknown as { valueBlock?: { value?: unknown } };
    const value =
      typeof block.valueBlock?.value === "string"
        ? block.valueBlock.value
        : String(tv.value);
    out[label] = out[label] ? `${out[label]}, ${value}` : value;
  }
  return out;
}

export function nameToString(name: NameMap): string {
  const order = ["CN", "E", "OU", "O", "L", "ST", "C"];
  const keys = [
    ...order.filter((k) => k in name),
    ...Object.keys(name).filter((k) => !order.includes(k)),
  ];
  return keys.map((k) => `${k}=${name[k]}`).join(", ");
}

/* ------------------------------------------------------------------ */
/* Certificate creation                                                */
/* ------------------------------------------------------------------ */

function bitString(bits: number[]): asn1js.BitString {
  // bits are KeyUsage positions (0 = MSB of the first byte).
  const byteCount = Math.floor(Math.max(...bits) / 8) + 1;
  const bytes = new Uint8Array(byteCount);
  for (const bit of bits) bytes[Math.floor(bit / 8)] |= 0x80 >> bit % 8;
  const last = bytes[byteCount - 1];
  let unusedBits = 0;
  while (unusedBits < 7 && !(last & (1 << unusedBits))) unusedBits++;
  return new asn1js.BitString({
    valueHex: toArrayBuffer(bytes),
    unusedBits,
  });
}

async function keyIdentifier(publicKeyInfo: pkijs.PublicKeyInfo) {
  return crypto.subtle.digest(
    "SHA-1",
    publicKeyInfo.subjectPublicKey.valueBlock.valueHexView,
  );
}

function getExtension(cert: pkijs.Certificate, oid: string) {
  return cert.extensions?.find((e) => e.extnID === oid);
}

export type CertificateKind = "signing" | "ca";

export interface CreateCertificateOptions {
  subject: SubjectFields;
  keys: CryptoKeyPair;
  kind: CertificateKind;
  validityDays: number;
  /** Sign with this CA instead of self-signing. */
  issuer?: Issuer;
}

export async function createCertificate({
  subject,
  keys,
  kind,
  validityDays,
  issuer,
}: CreateCertificateOptions): Promise<pkijs.Certificate> {
  const cert = new pkijs.Certificate();
  cert.version = 2;

  const serial = randomBytes(16);
  serial[0] = (serial[0] & 0x7f) | 0x40; // positive, no leading zero
  cert.serialNumber = new asn1js.Integer({ valueHex: toArrayBuffer(serial) });

  const subjectName = buildName(subject);
  cert.subject = subjectName;
  cert.issuer = issuer ? issuer.certificate.subject : buildName(subject);

  const now = new Date();
  // Backdate a little so freshly made certificates aren't "not yet valid"
  // on a verifier whose clock is slightly behind.
  cert.notBefore.value = new Date(now.getTime() - 5 * 60 * 1000);
  cert.notAfter.value = new Date(now.getTime() + validityDays * 86400 * 1000);

  await cert.subjectPublicKeyInfo.importKey(keys.publicKey);

  const ski = await keyIdentifier(cert.subjectPublicKeyInfo);
  const authorityKeyId = issuer
    ? ((
        getExtension(issuer.certificate, OID.subjectKeyIdentifier)
          ?.parsedValue as asn1js.OctetString | undefined
      )?.valueBlock.valueHexView ??
      new Uint8Array(
        await keyIdentifier(issuer.certificate.subjectPublicKeyInfo),
      ))
    : new Uint8Array(ski);

  const isCA = kind === "ca";
  const extensions: pkijs.Extension[] = [
    new pkijs.Extension({
      extnID: OID.basicConstraints,
      critical: true,
      extnValue: new pkijs.BasicConstraints(
        isCA ? { cA: true, pathLenConstraint: 0 } : { cA: false },
      )
        .toSchema()
        .toBER(false),
    }),
    new pkijs.Extension({
      extnID: OID.keyUsage,
      critical: true,
      // CA: keyCertSign + cRLSign (+ digitalSignature). Signer: digitalSignature + nonRepudiation.
      extnValue: bitString(isCA ? [0, 5, 6] : [0, 1]).toBER(false),
    }),
    new pkijs.Extension({
      extnID: OID.subjectKeyIdentifier,
      extnValue: new asn1js.OctetString({ valueHex: ski }).toBER(false),
    }),
    new pkijs.Extension({
      extnID: OID.authorityKeyIdentifier,
      extnValue: new pkijs.AuthorityKeyIdentifier({
        keyIdentifier: new asn1js.OctetString({
          valueHex: toArrayBuffer(new Uint8Array(authorityKeyId)),
        }),
      })
        .toSchema()
        .toBER(false),
    }),
  ];

  if (!isCA) {
    extensions.push(
      new pkijs.Extension({
        extnID: OID.extKeyUsage,
        extnValue: new pkijs.ExtKeyUsage({
          keyPurposes: [
            "1.3.6.1.5.5.7.3.36", // id-kp-documentSigning (RFC 9336)
            "1.3.6.1.5.5.7.3.4", // emailProtection – widely recognised by PDF readers
            "1.2.840.113583.1.1.5", // Adobe Authentic Documents Trust
          ],
        })
          .toSchema()
          .toBER(false),
      }),
    );
  }

  if (subject.email?.trim()) {
    extensions.push(
      new pkijs.Extension({
        extnID: OID.subjectAltName,
        extnValue: new pkijs.GeneralNames({
          names: [
            new pkijs.GeneralName({ type: 1, value: subject.email.trim() }),
          ],
        })
          .toSchema()
          .toBER(false),
      }),
    );
  }

  cert.extensions = extensions;

  const signingKey = issuer ? issuer.privateKey : keys.privateKey;
  await cert.sign(signingKey, hashForKey(signingKey));
  return cert;
}

/** PKCS#10 certificate signing request for submission to a real CA. */
export async function createCsr(
  subject: SubjectFields,
  keys: CryptoKeyPair,
): Promise<pkijs.CertificationRequest> {
  const csr = new pkijs.CertificationRequest();
  csr.version = 0;
  csr.subject = buildName(subject);
  await csr.subjectPublicKeyInfo.importKey(keys.publicKey);

  const requested = new pkijs.Extensions({
    extensions: [
      new pkijs.Extension({
        extnID: OID.keyUsage,
        critical: true,
        extnValue: bitString([0, 1]).toBER(false),
      }),
      new pkijs.Extension({
        extnID: OID.extKeyUsage,
        extnValue: new pkijs.ExtKeyUsage({
          keyPurposes: ["1.3.6.1.5.5.7.3.36", "1.3.6.1.5.5.7.3.4"],
        })
          .toSchema()
          .toBER(false),
      }),
    ],
  });
  csr.attributes = [
    new pkijs.Attribute({
      type: OID.extensionRequest,
      values: [requested.toSchema()],
    }),
  ];

  await csr.sign(keys.privateKey, hashForKey(keys.privateKey));
  return csr;
}

/* ------------------------------------------------------------------ */
/* Inspection                                                          */
/* ------------------------------------------------------------------ */

export interface CertificateInfo {
  subject: NameMap;
  issuer: NameMap;
  subjectText: string;
  issuerText: string;
  commonName: string;
  serialHex: string;
  notBefore: Date;
  notAfter: Date;
  keyDescription: string;
  signatureAlgorithm: string;
  sha256: string;
  sha1: string;
  isCA: boolean;
  selfIssued: boolean;
  keyUsage: string[];
  extKeyUsage: string[];
}

export function describeKey(spki: pkijs.PublicKeyInfo): string {
  const oid = spki.algorithm.algorithmId;
  if (oid === OID.rsaEncryption) {
    const parsed = spki.parsedKey as pkijs.RSAPublicKey | undefined;
    let bytes = parsed?.modulus.valueBlock.valueHexView ?? new Uint8Array();
    while (bytes.length && bytes[0] === 0) bytes = bytes.subarray(1);
    return `RSA ${bytes.length * 8}-bit`;
  }
  if (oid === OID.ecPublicKey) {
    const params = spki.algorithm.algorithmParams;
    const curve =
      params instanceof asn1js.ObjectIdentifier
        ? CURVES[params.valueBlock.toString()]
        : undefined;
    return `ECDSA ${curve ?? "(unknown curve)"}`;
  }
  return oid;
}

export async function describeCertificate(
  cert: pkijs.Certificate,
): Promise<CertificateInfo> {
  const der = cert.toSchema().toBER(false);
  const [sha256, sha1] = await Promise.all([
    crypto.subtle.digest("SHA-256", der),
    crypto.subtle.digest("SHA-1", der),
  ]);

  const subject = readName(cert.subject);
  const issuer = readName(cert.issuer);

  const basic = getExtension(cert, OID.basicConstraints)?.parsedValue as
    | pkijs.BasicConstraints
    | undefined;
  const ku = getExtension(cert, OID.keyUsage)?.parsedValue as
    | asn1js.BitString
    | undefined;
  const eku = getExtension(cert, OID.extKeyUsage)?.parsedValue as
    | pkijs.ExtKeyUsage
    | undefined;

  const keyUsage: string[] = [];
  if (ku) {
    const view = ku.valueBlock.valueHexView;
    KEY_USAGE_BITS.forEach((label, bit) => {
      const byte = view[Math.floor(bit / 8)] ?? 0;
      if (byte & (0x80 >> bit % 8)) keyUsage.push(label);
    });
  }

  return {
    subject,
    issuer,
    subjectText: nameToString(subject),
    issuerText: nameToString(issuer),
    commonName: subject.CN ?? subject.O ?? subject.E ?? "(no name)",
    serialHex: bytesToHex(
      cert.serialNumber.valueBlock.valueHexView,
    ).toUpperCase(),
    notBefore: cert.notBefore.value,
    notAfter: cert.notAfter.value,
    keyDescription: describeKey(cert.subjectPublicKeyInfo),
    signatureAlgorithm:
      SIGNATURE_ALGORITHMS[cert.signatureAlgorithm.algorithmId] ??
      cert.signatureAlgorithm.algorithmId,
    sha256: formatFingerprint(sha256),
    sha1: formatFingerprint(sha1),
    isCA: Boolean(basic?.cA),
    selfIssued: cert.subject.isEqual(cert.issuer),
    keyUsage,
    extKeyUsage: (eku?.keyPurposes ?? []).map((p) => EKU_NAMES[p] ?? p),
  };
}

export interface CsrInfo {
  subject: NameMap;
  subjectText: string;
  keyDescription: string;
  signatureValid: boolean;
}

export async function describeCsr(
  csr: pkijs.CertificationRequest,
): Promise<CsrInfo> {
  const subject = readName(csr.subject);
  let signatureValid = false;
  try {
    signatureValid = await csr.verify();
  } catch {
    signatureValid = false;
  }
  return {
    subject,
    subjectText: nameToString(subject),
    keyDescription: describeKey(csr.subjectPublicKeyInfo),
    signatureValid,
  };
}

export function certificateToDer(cert: pkijs.Certificate): ArrayBuffer {
  return cert.toSchema().toBER(false);
}

export function parseCertificate(der: Uint8Array): pkijs.Certificate {
  return pkijs.Certificate.fromBER(toArrayBuffer(der));
}

/** Order certificates leaf → root, starting from the signer. */
export function orderChain(
  leaf: pkijs.Certificate,
  others: pkijs.Certificate[],
): pkijs.Certificate[] {
  const chain = [leaf];
  const pool = others.filter((c) => c !== leaf);
  let current = leaf;
  while (!current.subject.isEqual(current.issuer)) {
    const idx = pool.findIndex((c) => c.subject.isEqual(current.issuer));
    if (idx < 0) break;
    current = pool.splice(idx, 1)[0];
    chain.push(current);
  }
  return chain;
}

export function isSameCertificate(a: pkijs.Certificate, b: pkijs.Certificate) {
  return (
    a.issuer.isEqual(b.issuer) &&
    bytesToHex(a.serialNumber.valueBlock.valueHexView) ===
      bytesToHex(b.serialNumber.valueBlock.valueHexView)
  );
}

export { asn1js, pkijs };
