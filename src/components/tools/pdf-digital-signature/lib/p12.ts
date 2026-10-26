import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

import { randomBytes, toArrayBuffer, utf8 } from "./encoding";
import {
  describeCertificate,
  exportPrivateKeyInfo,
  importPrivateKey,
  keyMatchesCertificate,
  orderChain,
  type CertificateInfo,
} from "./pki";

const BAG = {
  key: "1.2.840.113549.1.12.10.1.1",
  shroudedKey: "1.2.840.113549.1.12.10.1.2",
  cert: "1.2.840.113549.1.12.10.1.3",
  x509Cert: "1.2.840.113549.1.9.22.1",
  friendlyName: "1.2.840.113549.1.9.20",
  localKeyId: "1.2.840.113549.1.9.21",
};

const ITERATIONS = 100_000;

/** A private key plus its certificate chain, ready to sign with. */
export interface SigningIdentity {
  privateKey: CryptoKey;
  certificate: pkijs.Certificate;
  /** Leaf first, then intermediates / root when present. */
  chain: pkijs.Certificate[];
  info: CertificateInfo;
  source: string;
}

export class Pkcs12Error extends Error {
  constructor(
    message: string,
    readonly kind: "password" | "legacy" | "format" | "no-key" | "no-cert",
  ) {
    super(message);
    this.name = "Pkcs12Error";
  }
}

function isLegacyAlgorithmError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  // pbeWithSHAAnd3-KeyTripleDES-CBC / RC2 etc. live under 1.2.840.113549.1.12.1.*
  return /1\.2\.840\.113549\.1\.12\.1\.|Unsupported|not supported|Unknown/i.test(
    message,
  );
}

/**
 * Open a .p12/.pfx file. Supports the modern PBES2 (AES) format written by
 * OpenSSL 3+, Windows 10+, recent macOS and this tool.
 */
export async function importPkcs12(
  data: ArrayBuffer,
  password: string,
  source: string,
): Promise<SigningIdentity> {
  const pw = utf8(password);
  let pfx: pkijs.PFX;
  try {
    pfx = pkijs.PFX.fromBER(data);
  } catch {
    throw new Pkcs12Error(
      "This file is not a valid .p12 / .pfx certificate file.",
      "format",
    );
  }

  try {
    await pfx.parseInternalValues({ password: pw, checkIntegrity: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (/integrity|MAC/i.test(message)) {
      throw new Pkcs12Error(
        "Wrong password for this certificate file.",
        "password",
      );
    }
    throw new Pkcs12Error(
      `Could not open the certificate file (${message || "unknown error"}).`,
      "format",
    );
  }

  const safe = pfx.parsedValue?.authenticatedSafe;
  if (!safe) {
    throw new Pkcs12Error("The certificate file is empty.", "format");
  }

  try {
    await safe.parseInternalValues({
      safeContents: safe.safeContents.map(() => ({ password: pw })),
    });
  } catch (err) {
    if (isLegacyAlgorithmError(err)) {
      throw new Pkcs12Error(
        "This file uses old encryption (3DES/RC2) that browsers can't decrypt. Convert it to the modern format first – see the limitations section.",
        "legacy",
      );
    }
    throw new Pkcs12Error(
      "Wrong password for this certificate file.",
      "password",
    );
  }

  const keyInfos: pkijs.PrivateKeyInfo[] = [];
  const certificates: pkijs.Certificate[] = [];

  for (const content of safe.parsedValue.safeContents as {
    value: pkijs.SafeContents;
  }[]) {
    for (const bag of content.value.safeBags) {
      if (bag.bagId === BAG.shroudedKey) {
        const shrouded = bag.bagValue as pkijs.PKCS8ShroudedKeyBag;
        try {
          // parseInternalValues is protected in the typings but public at runtime.
          await (
            shrouded as unknown as {
              parseInternalValues(p: { password: ArrayBuffer }): Promise<void>;
            }
          ).parseInternalValues({ password: pw });
        } catch (err) {
          if (isLegacyAlgorithmError(err)) {
            throw new Pkcs12Error(
              "This file uses old encryption (3DES/RC2) that browsers can't decrypt. Convert it to the modern format first – see the limitations section.",
              "legacy",
            );
          }
          throw new Pkcs12Error(
            "Wrong password for this certificate file.",
            "password",
          );
        }
        if (shrouded.parsedValue) keyInfos.push(shrouded.parsedValue);
      } else if (bag.bagId === BAG.key) {
        keyInfos.push(bag.bagValue as unknown as pkijs.PrivateKeyInfo);
      } else if (bag.bagId === BAG.cert) {
        const certBag = bag.bagValue as pkijs.CertBag;
        if (certBag.parsedValue instanceof pkijs.Certificate) {
          certificates.push(certBag.parsedValue);
        }
      }
    }
  }

  if (keyInfos.length === 0) {
    throw new Pkcs12Error(
      "This file has no private key. To sign you need the .p12/.pfx that includes your private key, not just the certificate.",
      "no-key",
    );
  }
  if (certificates.length === 0) {
    throw new Pkcs12Error("This file has no certificate.", "no-cert");
  }

  const privateKey = await importPrivateKey(keyInfos[0]);
  let leaf: pkijs.Certificate | undefined;
  for (const cert of certificates) {
    if (await keyMatchesCertificate(privateKey, cert)) {
      leaf = cert;
      break;
    }
  }
  if (!leaf) {
    throw new Pkcs12Error(
      "The private key in this file doesn't match any of its certificates.",
      "no-cert",
    );
  }

  const chain = orderChain(leaf, certificates);
  return {
    privateKey,
    certificate: leaf,
    chain,
    info: await describeCertificate(leaf),
    source,
  };
}

export interface ExportPkcs12Options {
  privateKey: CryptoKey;
  /** Leaf first. */
  certificates: pkijs.Certificate[];
  password: string;
  friendlyName?: string;
}

/** Write a modern PKCS#12 (PBES2 AES-256-CBC, PBKDF2/HMAC-SHA-256 MAC). */
export async function exportPkcs12({
  privateKey,
  certificates,
  password,
  friendlyName,
}: ExportPkcs12Options): Promise<ArrayBuffer> {
  const pw = utf8(password);
  const keyInfo = await exportPrivateKeyInfo(privateKey);
  const localKeyId = toArrayBuffer(randomBytes(20));

  const attrs = (withKeyId: boolean) => {
    const list: pkijs.Attribute[] = [];
    if (friendlyName) {
      list.push(
        new pkijs.Attribute({
          type: BAG.friendlyName,
          values: [new asn1js.BmpString({ value: friendlyName })],
        }),
      );
    }
    if (withKeyId) {
      list.push(
        new pkijs.Attribute({
          type: BAG.localKeyId,
          values: [new asn1js.OctetString({ valueHex: localKeyId })],
        }),
      );
    }
    return list;
  };

  const keyBag = new pkijs.SafeBag({
    bagId: BAG.shroudedKey,
    bagValue: new pkijs.PKCS8ShroudedKeyBag({ parsedValue: keyInfo }),
    bagAttributes: attrs(true),
  });
  const certBags = certificates.map(
    (cert, i) =>
      new pkijs.SafeBag({
        bagId: BAG.cert,
        bagValue: new pkijs.CertBag({ parsedValue: cert }),
        bagAttributes: i === 0 ? attrs(true) : [],
      }),
  );

  const encryption = {
    password: pw,
    contentEncryptionAlgorithm: {
      name: "AES-CBC",
      length: 256,
    } as pkijs.ContentEncryptionAlgorithm,
    hmacHashAlgorithm: "SHA-256",
    iterationCount: ITERATIONS,
  };

  await (keyBag.bagValue as pkijs.PKCS8ShroudedKeyBag).makeInternalValues(
    encryption,
  );

  const pfx = new pkijs.PFX({
    parsedValue: {
      integrityMode: 0,
      authenticatedSafe: new pkijs.AuthenticatedSafe({
        parsedValue: {
          safeContents: [
            {
              privacyMode: 0,
              value: new pkijs.SafeContents({ safeBags: [keyBag] }),
            },
            {
              privacyMode: 1,
              value: new pkijs.SafeContents({ safeBags: certBags }),
            },
          ],
        },
      }),
    },
  });

  await pfx.parsedValue!.authenticatedSafe!.makeInternalValues({
    safeContents: [{}, encryption],
  });
  await pfx.makeInternalValues({
    password: pw,
    iterations: ITERATIONS,
    pbkdf2HashAlgorithm: "SHA-256" as unknown as Algorithm,
    hmacHashAlgorithm: "SHA-256",
  });

  return pfx.toSchema().toBER(false);
}

/* ------------------------------------------------------------------ */
/* Encrypted PKCS#8 – the private key that goes with a CSR             */
/* ------------------------------------------------------------------ */

/** Password-encrypted PKCS#8 (PBES2/AES-256), i.e. "ENCRYPTED PRIVATE KEY". */
export async function exportEncryptedPrivateKey(
  privateKey: CryptoKey,
  password: string,
): Promise<ArrayBuffer> {
  const bag = new pkijs.PKCS8ShroudedKeyBag({
    parsedValue: await exportPrivateKeyInfo(privateKey),
  });
  await bag.makeInternalValues({
    password: utf8(password),
    contentEncryptionAlgorithm: {
      name: "AES-CBC",
      length: 256,
    } as pkijs.ContentEncryptionAlgorithm,
    hmacHashAlgorithm: "SHA-256",
    iterationCount: ITERATIONS,
  });
  return bag.toSchema().toBER(false);
}

export async function importEncryptedPrivateKey(
  der: Uint8Array,
  password: string,
): Promise<pkijs.PrivateKeyInfo> {
  let bag: pkijs.PKCS8ShroudedKeyBag;
  try {
    bag = pkijs.PKCS8ShroudedKeyBag.fromBER(toArrayBuffer(der));
  } catch {
    throw new Pkcs12Error("Not a valid encrypted private key file.", "format");
  }
  try {
    await (
      bag as unknown as {
        parseInternalValues(p: { password: ArrayBuffer }): Promise<void>;
      }
    ).parseInternalValues({ password: utf8(password) });
  } catch (err) {
    if (isLegacyAlgorithmError(err)) {
      throw new Pkcs12Error(
        "This key uses old encryption that browsers can't decrypt.",
        "legacy",
      );
    }
    throw new Pkcs12Error("Wrong password for this private key.", "password");
  }
  if (!bag.parsedValue) {
    throw new Pkcs12Error("Wrong password for this private key.", "password");
  }
  return bag.parsedValue;
}

export { importPrivateKey };
