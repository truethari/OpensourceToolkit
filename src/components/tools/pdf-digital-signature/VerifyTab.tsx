"use client";

import { toast } from "sonner";
import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  ShieldQuestion,
  MessageSquareText,
  X,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatBytes } from "../pdf-signature/utils";

import { parseCertificateFile } from "./lib/files";
import type { SigningIdentity } from "./lib/p12";
import {
  describeCertificate,
  isSameCertificate,
  pkijs,
  type CertificateInfo,
} from "./lib/pki";
import {
  extractRevision,
  verifyPdf,
  type SignatureReport,
  type VerifyReport,
} from "./lib/pdfVerify";
import {
  CertificateSummary,
  downloadFile,
  errorMessage,
  FileDrop,
  formatDateTime,
} from "./shared";

interface TrustedCert {
  certificate: pkijs.Certificate;
  info: CertificateInfo;
}

export interface VerifyInput {
  bytes: Uint8Array;
  name: string;
  /** Changes whenever a new file is handed over from another tab. */
  key: number;
}

export default function VerifyTab({
  input,
  identity,
}: {
  input: VerifyInput | null;
  identity: SigningIdentity | null;
}) {
  const [file, setFile] = useState<{ bytes: Uint8Array; name: string } | null>(
    null,
  );
  const [trusted, setTrusted] = useState<TrustedCert[]>([]);
  const [report, setReport] = useState<VerifyReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (input) setFile({ bytes: input.bytes, name: input.name });
  }, [input]);

  // Re-run whenever the file or the trust list changes.
  useEffect(() => {
    if (!file) {
      setReport(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError(null);
    verifyPdf(
      file.bytes,
      trusted.map((t) => t.certificate),
    )
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch((err) => {
        if (!cancelled) {
          setReport(null);
          setError(errorMessage(err, "Could not check this PDF."));
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file, trusted]);

  const addTrusted = useCallback(async (certs: pkijs.Certificate[]) => {
    const infos = await Promise.all(certs.map((c) => describeCertificate(c)));
    setTrusted((prev) => {
      const next = [...prev];
      certs.forEach((certificate, i) => {
        if (!next.some((t) => isSameCertificate(t.certificate, certificate))) {
          next.push({ certificate, info: infos[i] });
        }
      });
      return next;
    });
  }, []);

  const onTrustFiles = async (files: File[]) => {
    try {
      const certs: pkijs.Certificate[] = [];
      for (const f of files) {
        certs.push(
          ...parseCertificateFile(new Uint8Array(await f.arrayBuffer()))
            .certificates,
        );
      }
      if (certs.length === 0)
        throw new Error("No certificates found in those files.");
      await addTrusted(certs);
      toast.success(
        `Trusting ${certs.length} certificate${certs.length === 1 ? "" : "s"}`,
      );
    } catch (err) {
      toast.error(errorMessage(err, "Could not read the certificate"));
    }
  };

  const onPdf = async (f: File) => {
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
      toast.error("Please choose a PDF file");
      return;
    }
    setFile({ bytes: new Uint8Array(await f.arrayBuffer()), name: f.name });
  };

  const sigs = report?.signatures ?? [];
  const allIntact =
    sigs.length > 0 && sigs.every((s) => s.integrity === "valid");
  const allTrusted = allIntact && sigs.every((s) => s.trust === "trusted");
  const lastCoversAll =
    sigs.length > 0 && sigs[sigs.length - 1].coversWholeFile;

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <div className="min-w-0 space-y-6 xl:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Signed PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {file ? (
              <div className="flex items-center gap-2 rounded-lg border p-2.5">
                <FileText className="h-5 w-5 shrink-0 text-red-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(file.bytes.length)}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Remove PDF"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <FileDrop
                accept="application/pdf,.pdf"
                title="Drop a signed PDF"
                hint="Checked entirely on this device"
                onFiles={([f]) => onPdf(f)}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Certificates you trust</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Browsers can&apos;t read your system&apos;s or Adobe&apos;s trust
              lists, so add the certificates you trust: a colleague&apos;s .cer,
              or your organisation&apos;s CA. Kept in memory only.
            </p>
            {trusted.map((t, i) => (
              <div
                key={t.info.sha256}
                className="flex items-start gap-2 rounded-lg border p-2.5"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <div className="min-w-0 flex-1">
                  <CertificateSummary info={t.info} compact />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={`Stop trusting ${t.info.commonName}`}
                  onClick={() =>
                    setTrusted((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <FileDrop
              compact
              multiple
              accept=".cer,.crt,.pem,.der,.p7b,.p7c"
              title="Add trusted certificates"
              hint=".cer, .crt, .pem, .der or .p7b"
              onFiles={onTrustFiles}
            />
            {identity &&
              !trusted.some((t) =>
                isSameCertificate(t.certificate, identity.certificate),
              ) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTrusted(identity.chain)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Trust my loaded certificate ({identity.info.commonName})
                </Button>
              )}
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-4 xl:col-span-3">
        {!file && (
          <Card>
            <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              <ShieldQuestion className="h-10 w-10 opacity-60" />
              <p className="max-w-sm">
                Add a signed PDF to check who signed it, whether it was changed
                afterwards, and when it was signed.
              </p>
            </CardContent>
          </Card>
        )}

        {file && busy && !report && (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 p-10 text-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Checking signatures…
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-300">
            <CardContent className="flex items-start gap-2 p-4 text-sm text-red-600 dark:text-red-400">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              {error}
            </CardContent>
          </Card>
        )}

        {report && (
          <>
            <Card
              className={
                sigs.length === 0
                  ? ""
                  : !allIntact
                    ? "border-red-300 dark:border-red-900"
                    : allTrusted
                      ? "border-teal-300 dark:border-teal-800"
                      : "border-amber-300 dark:border-amber-800"
              }
            >
              <CardContent className="flex items-start gap-3 p-4 sm:p-5">
                {sigs.length === 0 ? (
                  <HelpCircle className="h-7 w-7 shrink-0 text-muted-foreground" />
                ) : !allIntact ? (
                  <XCircle className="h-7 w-7 shrink-0 text-red-600" />
                ) : allTrusted ? (
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-teal-600" />
                ) : (
                  <AlertTriangle className="h-7 w-7 shrink-0 text-amber-500" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold">
                    {sigs.length === 0
                      ? "No digital signatures found"
                      : !allIntact
                        ? "At least one signature is invalid"
                        : allTrusted
                          ? `${sigs.length === 1 ? "Signature is" : `All ${sigs.length} signatures are`} valid and trusted`
                          : `${sigs.length === 1 ? "Signature is" : `All ${sigs.length} signatures are`} intact, but the signer isn't trusted yet`}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sigs.length === 0
                      ? "This PDF has no certificate-based signatures. Pictures of signatures don't count."
                      : !lastCoversAll
                        ? "The file was changed after the last signature."
                        : allTrusted
                          ? "The document hasn't changed since it was signed."
                          : "The document hasn't changed since it was signed. Add the signer's certificate (or their CA) on the left to confirm who they are."}
                  </p>
                  {report.emptySignatureFields.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Unsigned signature fields:{" "}
                      {report.emptySignatureFields.join(", ")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {sigs.map((s, i) => (
              <SignatureCard
                key={`${s.fieldName}-${i}`}
                report={s}
                index={i}
                laterSignatures={sigs.length - 1 - i}
                onDownloadRevision={() =>
                  file &&
                  downloadFile(
                    extractRevision(file.bytes, s),
                    `${file.name.replace(/\.pdf$/i, "")}-as-signed-by-${(s.signer?.commonName ?? `signature-${i + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
                    "application/pdf",
                  )
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function SignatureCard({
  report: s,
  index,
  laterSignatures,
  onDownloadRevision,
}: {
  report: SignatureReport;
  index: number;
  laterSignatures: number;
  onDownloadRevision: () => void;
}) {
  const status =
    s.integrity !== "valid"
      ? "bad"
      : s.trust === "trusted" && s.certValidAtSigning !== false
        ? "good"
        : "warn";

  const signedAt = s.timestamp?.valid ? s.timestamp.time : s.claimedTime;

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-3">
          {status === "good" ? (
            <CheckCircle2 className="h-6 w-6 shrink-0 text-teal-600" />
          ) : status === "warn" ? (
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
          ) : (
            <XCircle className="h-6 w-6 shrink-0 text-red-600" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                {s.isDocumentTimestamp
                  ? "Document time-stamp"
                  : (s.signer?.commonName ?? s.signerName ?? "Unknown signer")}
              </span>
              <Badge variant="outline">#{index + 1}</Badge>
              {s.certificationLevel && (
                <Badge variant="secondary">Certification</Badge>
              )}
              {s.visible ? (
                <Badge variant="outline">
                  Visible{s.pageNumber ? ` · page ${s.pageNumber}` : ""}
                </Badge>
              ) : (
                <Badge variant="outline">Invisible</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Field “{s.fieldName}” · {s.subFilter}
            </div>
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          <Check
            ok={s.integrity === "valid"}
            warn={s.integrity === "unsupported"}
          >
            <strong>Integrity:</strong> {s.integrityMessage}
          </Check>
          {s.integrity === "valid" && (
            <Check ok={s.coversWholeFile} warn={!s.coversWholeFile}>
              <strong>Coverage:</strong>{" "}
              {s.coversWholeFile
                ? "This signature covers the whole file."
                : laterSignatures > 0
                  ? `The file was extended after this signature (${laterSignatures} later signature${laterSignatures === 1 ? "" : "s"} and possibly other changes). Download the exact version this signer signed to compare.`
                  : "Content was added after this signature. Download the exact signed version to see what this signer approved."}
            </Check>
          )}
          {!s.isDocumentTimestamp && (
            <Check ok={s.trust === "trusted"} warn={s.trust !== "trusted"}>
              <strong>Identity:</strong> {s.trustMessage}
            </Check>
          )}
          {s.signer && s.certValidAtSigning !== undefined && (
            <Check ok={s.certValidAtSigning} warn={!s.certValidAtSigning}>
              <strong>Certificate period:</strong>{" "}
              {s.certValidAtSigning
                ? "The certificate was within its validity period at signing time."
                : "The certificate was expired or not yet valid at signing time."}
            </Check>
          )}
        </ul>

        <div className="grid gap-2 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-2">
          <Meta icon={Clock} label="Signed">
            {formatDateTime(signedAt)}
            <span className="block text-xs text-muted-foreground">
              {s.timestamp?.valid
                ? `Trusted time-stamp by ${s.timestamp.authority}`
                : s.timestamp
                  ? "Time-stamp present but couldn't be verified; time is from the signer's device"
                  : "From the signer's device clock (no trusted time-stamp)"}
            </span>
          </Meta>
          {s.reason && (
            <Meta icon={MessageSquareText} label="Reason">
              {s.reason}
            </Meta>
          )}
          {s.location && (
            <Meta icon={MapPin} label="Location">
              {s.location}
            </Meta>
          )}
          {s.contactInfo && (
            <Meta icon={HelpCircle} label="Contact">
              {s.contactInfo}
            </Meta>
          )}
        </div>

        {s.chain.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Certificate chain
            </div>
            {s.chain.map((info, i) => (
              <div
                key={info.sha256}
                className="rounded-lg border p-2.5"
                style={{ marginLeft: `${Math.min(i, 3) * 12}px` }}
              >
                <CertificateSummary info={info} />
              </div>
            ))}
          </div>
        )}

        {s.revisionLength > 0 && !s.coversWholeFile && (
          <Button variant="outline" size="sm" onClick={onDownloadRevision}>
            <Download className="mr-2 h-4 w-4" />
            Download the version this signer signed
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Check({
  ok,
  warn,
  children,
}: {
  ok: boolean;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
      ) : warn ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
      )}
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 break-words">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div>{children}</div>
      </div>
    </div>
  );
}
