export interface Limitation {
  title: string;
  detail: string;
  /** Optional command or workaround shown in a code block. */
  workaround?: string;
}

/** What a browser-only signing tool genuinely can't do – shown to users as-is. */
export const LIMITATIONS: Limitation[] = [
  {
    title: "No automatic trust (no Adobe or system trust lists)",
    detail:
      "Web pages can't read your operating system's or Adobe's list of trusted certificate authorities. This verifier only treats a signer as trusted if you add their certificate or their CA's certificate yourself. Adobe Reader and other PDF apps use their own lists when your recipients open the file.",
  },
  {
    title: "Self-signed certificates show as “identity unknown” to others",
    detail:
      "A self-signed or own-CA certificate proves the document wasn't changed, but recipients' PDF readers will warn that the signer's identity can't be confirmed until they choose to trust your certificate. For automatic trust in Adobe Reader you need a certificate from an Adobe-approved (AATL) provider.",
  },
  {
    title: "No revocation checks (OCSP / CRL)",
    detail:
      "Checking whether a certificate has been revoked requires contacting the certificate authority's servers, which block requests from web pages. A revoked certificate will still show as valid here.",
  },
  {
    title: "No trusted time-stamps when signing",
    detail:
      "Time-stamp authorities (TSAs) don't accept requests from browsers, so the signing time comes from your device's clock and can't be independently proven. Existing time-stamps in PDFs you verify are checked.",
  },
  {
    title: "No long-term validation (LTV) data",
    detail:
      "Revocation data and time-stamps aren't embedded, so readers may report a signature as “not LTV-enabled”, and validating it after the certificate expires is harder.",
  },
  {
    title:
      "Only .p12 / .pfx files – no USB tokens, smart cards or cloud signing",
    detail:
      "Web pages can't talk to hardware tokens, national ID cards or remote signing services. Most commercial Adobe-trusted certificates are issued on such hardware, so they can't be used here.",
  },
  {
    title: "Old-style .p12 files need converting",
    detail:
      "Files exported by older Windows or macOS versions are often encrypted with 3DES/RC2, which browsers can't decrypt. Convert them to the modern AES format with OpenSSL 3, then delete the temporary file, which holds your unencrypted key:",
    workaround:
      "openssl pkcs12 -in old.p12 -legacy -nodes -out temp.pem\nopenssl pkcs12 -export -in temp.pem -out new.p12\nrm temp.pem",
  },
  {
    title: "Password-protected PDFs aren't supported",
    detail:
      "Encrypted PDFs can't be signed or verified. Remove the password protection first.",
  },
  {
    title: "Changes after signing aren't classified",
    detail:
      "If a document was changed after someone signed it, the verifier tells you and lets you download the exact version they signed. It doesn't judge whether the later changes were permitted (form filling vs. content edits) the way Adobe Acrobat does.",
  },
  {
    title: "No certification (document locking) signatures",
    detail:
      "You can't create “certify” signatures that lock a document, and PDFs certified as “no changes allowed” can't be signed.",
  },
  {
    title: "Some legacy signature formats can't be checked",
    detail:
      "Very old signatures using adbe.x509.rsa_sha1 are reported as unsupported. RSA-PSS keys and keys on curves other than P-256/P-384/P-521 can't be used for signing.",
  },
  {
    title: "Not a qualified electronic signature",
    detail:
      "Some legal systems (for example eIDAS “qualified” signatures in the EU) require a qualified certificate on a certified device. Whether a signature made here is legally sufficient depends on your country and use case.",
  },
];

export const PRIVACY_POINTS: { title: string; text: string }[] = [
  {
    title: "Nothing is uploaded",
    text: "Your PDFs, certificates, private keys and passwords are processed entirely by your browser. They are never sent to our servers or to anyone else.",
  },
  {
    title: "Nothing is stored",
    text: "Nothing you add here is written to cookies, local storage or any database. It lives only in this tab's memory and is gone when you close or reload the page.",
  },
  {
    title: "Imported keys stay locked",
    text: "Private keys loaded from a .p12 file are held as non-exportable Web Crypto keys: the page can sign with them but can't read them back out.",
  },
  {
    title: "You can check it yourself",
    text: "Open your browser's developer tools, go to the Network tab and sign or verify a file: no request carries your files, keys or passwords.",
  },
];

/** Site-wide behaviour, disclosed so the privacy claims above stay honest. */
export const SITE_PRIVACY_NOTE =
  "For transparency: like the rest of this site, this page loads Google Analytics for anonymous page-view statistics, and the site remembers your recently used and favourite tools in your browser. Neither ever receives your documents, certificates, keys or passwords.";
