import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

import { sha256 } from "./encoding";
import { OID } from "./pki";

/**
 * ESS signing-certificate-v2 attribute (RFC 5035). PAdES requires it so the
 * signer certificate can't be swapped for another one with the same key.
 */
async function signingCertificateV2(cert: pkijs.Certificate) {
  const certHash = await sha256(cert.toSchema().toBER(false));
  const issuerSerial = new asn1js.Sequence({
    value: [
      new pkijs.GeneralNames({
        names: [new pkijs.GeneralName({ type: 4, value: cert.issuer })],
      }).toSchema(),
      new asn1js.Integer({
        valueHex: cert.serialNumber.valueBlock.valueHexView.slice().buffer,
      }),
    ],
  });
  // ESSCertIDv2 with the default hash algorithm (SHA-256) omitted.
  const essCertIdV2 = new asn1js.Sequence({
    value: [new asn1js.OctetString({ valueHex: certHash }), issuerSerial],
  });
  return new pkijs.Attribute({
    type: OID.signingCertificateV2,
    values: [
      new asn1js.Sequence({
        value: [new asn1js.Sequence({ value: [essCertIdV2] })],
      }),
    ],
  });
}

export interface CmsSignOptions {
  /** SHA-256 digest of the signed PDF byte ranges. */
  digest: ArrayBuffer;
  privateKey: CryptoKey;
  /** Leaf first; all are embedded so verifiers can build the chain. */
  chain: pkijs.Certificate[];
}

/** Detached CAdES signature suitable for /SubFilter /ETSI.CAdES.detached (PAdES B-B). */
export async function createCadesSignature({
  digest,
  privateKey,
  chain,
}: CmsSignOptions): Promise<ArrayBuffer> {
  const [leaf] = chain;

  const signedData = new pkijs.SignedData({
    version: 1,
    encapContentInfo: new pkijs.EncapsulatedContentInfo({
      eContentType: OID.data,
    }),
    signerInfos: [
      new pkijs.SignerInfo({
        version: 1,
        sid: new pkijs.IssuerAndSerialNumber({
          issuer: leaf.issuer,
          serialNumber: leaf.serialNumber,
        }),
        signedAttrs: new pkijs.SignedAndUnsignedAttributes({
          type: 0,
          attributes: [
            new pkijs.Attribute({
              type: OID.contentType,
              values: [new asn1js.ObjectIdentifier({ value: OID.data })],
            }),
            new pkijs.Attribute({
              type: OID.messageDigest,
              values: [new asn1js.OctetString({ valueHex: digest })],
            }),
            await signingCertificateV2(leaf),
          ],
        }),
      }),
    ],
    certificates: chain,
  });

  await signedData.sign(privateKey, 0, "SHA-256");

  const contentInfo = new pkijs.ContentInfo({
    contentType: OID.signedData,
    content: signedData.toSchema(true),
  });
  return contentInfo.toSchema().toBER(false);
}
