"use client";

import { toast } from "sonner";
import React, { useState } from "react";
import { FileSearch, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { isPkcs12Name, parseCertificateFile } from "./lib/files";
import { importPkcs12 } from "./lib/p12";
import {
  describeCertificate,
  describeCsr,
  type CertificateInfo,
  type CsrInfo,
} from "./lib/pki";
import { CertificateSummary, errorMessage, FileDrop } from "./shared";

interface Inspected {
  fileName: string;
  certificates: CertificateInfo[];
  requests: CsrInfo[];
  hasPrivateKey: boolean;
}

export default function InspectCertificate() {
  const [pending, setPending] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Inspected | null>(null);

  const inspect = async (file: File, pw?: string) => {
    setBusy(true);
    setResult(null);
    try {
      if (isPkcs12Name(file.name)) {
        if (pw === undefined) {
          setPending(file);
          return;
        }
        const identity = await importPkcs12(
          await file.arrayBuffer(),
          pw,
          file.name,
        );
        setResult({
          fileName: file.name,
          certificates: await Promise.all(
            identity.chain.map((c) => describeCertificate(c)),
          ),
          requests: [],
          hasPrivateKey: true,
        });
        setPending(null);
        setPassword("");
        return;
      }
      const parsed = parseCertificateFile(
        new Uint8Array(await file.arrayBuffer()),
      );
      if (parsed.certificates.length === 0 && parsed.requests.length === 0) {
        throw new Error(
          "No certificates or certificate requests found in this file.",
        );
      }
      setResult({
        fileName: file.name,
        certificates: await Promise.all(
          parsed.certificates.map((c) => describeCertificate(c)),
        ),
        requests: await Promise.all(parsed.requests.map((r) => describeCsr(r))),
        hasPrivateKey: false,
      });
    } catch (err) {
      toast.error(errorMessage(err, "Could not read this file"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        See what&apos;s inside a certificate file: who it belongs to, who issued
        it, when it expires and its fingerprints. Works with .cer, .crt, .pem,
        .der, .p7b, .csr and (with the password) .p12 / .pfx.
      </p>

      {pending ? (
        <form
          className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            inspect(pending, password);
          }}
        >
          <span className="min-w-0 flex-1 truncate text-sm">
            {pending.name}
          </span>
          <Input
            type="password"
            autoComplete="off"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="sm:w-56"
            aria-label="Certificate file password"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Open"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPending(null);
                setPassword("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <FileDrop
          compact
          accept=".cer,.crt,.pem,.der,.p7b,.p7c,.csr,.req,.p12,.pfx"
          title="Choose a certificate file"
          loading={busy}
          onFiles={([f]) => inspect(f)}
        />
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <FileSearch className="h-4 w-4 text-teal-600" />
            <span className="font-medium">{result.fileName}</span>
            {result.hasPrivateKey && (
              <Badge className="bg-amber-500 text-white">
                Contains a private key
              </Badge>
            )}
          </div>
          {result.certificates.map((info, i) => (
            <div key={info.sha256} className="rounded-lg border p-3">
              {result.certificates.length > 1 && (
                <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {i === 0 && result.hasPrivateKey
                    ? "Your certificate"
                    : `Certificate ${i + 1}`}
                </div>
              )}
              <CertificateSummary info={info} />
            </div>
          ))}
          {result.requests.map((csr, i) => (
            <div key={i} className="space-y-1 rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Certificate request</span>
                <Badge
                  variant={csr.signatureValid ? "secondary" : "destructive"}
                >
                  {csr.signatureValid ? "Signature OK" : "Bad signature"}
                </Badge>
              </div>
              <div className="break-all text-xs text-muted-foreground">
                {csr.subjectText}
              </div>
              <div className="text-xs text-muted-foreground">
                {csr.keyDescription}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
