"use client";

import { toast } from "sonner";
import React, { useState } from "react";
import {
  AlertTriangle,
  Download,
  FileKey2,
  Loader2,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toPem } from "./lib/encoding";
import { exportPkcs12, type SigningIdentity } from "./lib/p12";
import {
  certificateToDer,
  createCertificate,
  describeCertificate,
  generateKeyPair,
  KEY_TYPES,
  type KeyType,
  type SubjectFields,
} from "./lib/pki";
import {
  CertificateSummary,
  downloadFile,
  EMPTY_SUBJECT,
  errorMessage,
  IdentityLoader,
  SubjectForm,
  validateNewPassword,
  validateSubject,
} from "./shared";

type Kind = "self" | "ca" | "issued";

const KINDS: { value: Kind; title: string; text: string }[] = [
  {
    value: "self",
    title: "Self-signed signing certificate",
    text: "Quickest. Proves a document wasn't changed; others must trust your certificate manually.",
  },
  {
    value: "ca",
    title: "Certificate authority (CA)",
    text: "For teams: create one CA, issue signing certificates from it, and everyone trusts just the CA.",
  },
  {
    value: "issued",
    title: "Signing certificate issued by my CA",
    text: "Uses a CA you created earlier (its .p12) to issue a certificate for a person.",
  },
];

const VALIDITY = [1, 2, 3, 5, 10];

interface Created {
  identity: SigningIdentity;
  p12: ArrayBuffer;
  kind: Kind;
}

function slug(text: string) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "certificate"
  );
}

export default function CreateCertificate({
  onUseIdentity,
}: {
  onUseIdentity: (identity: SigningIdentity) => void;
}) {
  const [kind, setKind] = useState<Kind>("self");
  const [ca, setCa] = useState<SigningIdentity | null>(null);
  const [subject, setSubject] = useState<SubjectFields>(EMPTY_SUBJECT);
  const [keyType, setKeyType] = useState<KeyType>("RSA-3072");
  const [years, setYears] = useState(kind === "ca" ? 10 : 2);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);

  const create = async () => {
    const problem =
      validateSubject(subject) ??
      validateNewPassword(password, confirm) ??
      (kind === "issued" && !ca ? "Load your CA's .p12 file first." : null);
    if (problem) {
      toast.error(problem);
      return;
    }

    setBusy(true);
    setCreated(null);
    try {
      const keys = await generateKeyPair(keyType);
      const certificate = await createCertificate({
        subject,
        keys,
        kind: kind === "ca" ? "ca" : "signing",
        validityDays: Math.round(years * 365.25),
        issuer:
          kind === "issued" && ca
            ? { certificate: ca.certificate, privateKey: ca.privateKey }
            : undefined,
      });
      const chain =
        kind === "issued" && ca ? [certificate, ...ca.chain] : [certificate];
      const p12 = await exportPkcs12({
        privateKey: keys.privateKey,
        certificates: chain,
        password,
        friendlyName: subject.commonName.trim(),
      });
      setCreated({
        kind,
        p12,
        identity: {
          privateKey: keys.privateKey,
          certificate,
          chain,
          info: await describeCertificate(certificate),
          source: "created in this tab",
        },
      });
      setPassword("");
      setConfirm("");
      toast.success("Certificate created");
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err, "Failed to create the certificate"));
    } finally {
      setBusy(false);
    }
  };

  const name = slug(created?.identity.info.commonName ?? "");

  return (
    <div className="space-y-5">
      <div className="grid gap-2 md:grid-cols-3">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => {
              setKind(k.value);
              setYears(k.value === "ca" ? 10 : 2);
              setCreated(null);
            }}
            className={`rounded-lg border-2 p-3 text-left transition ${
              kind === k.value
                ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30"
                : "border-transparent bg-muted/50 hover:border-muted-foreground/30"
            }`}
          >
            <div className="text-sm font-semibold">{k.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{k.text}</div>
          </button>
        ))}
      </div>

      {kind === "issued" && (
        <IdentityLoader
          identity={ca}
          onChange={setCa}
          requireCA
          title="Your CA certificate (.p12 / .pfx)"
        />
      )}

      <SubjectForm value={subject} onChange={setSubject} idPrefix="create" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Key type</Label>
          <Select
            value={keyType}
            onValueChange={(v) => setKeyType(v as KeyType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KEY_TYPES.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label} — {k.hint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Valid for</Label>
          <Select
            value={String(years)}
            onValueChange={(v) => setYears(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALIDITY.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y} year{y === 1 ? "" : "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create-password">Password for the .p12 file *</Label>
          <Input
            id="create-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="create-confirm">Confirm password *</Label>
          <Input
            id="create-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        There is no password recovery. If you forget it, the .p12 file can never
        be opened again.
      </p>

      <Button
        onClick={create}
        disabled={busy}
        className="bg-teal-600 text-white hover:bg-teal-700"
      >
        {busy ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {busy ? "Generating keys…" : "Create certificate"}
      </Button>

      {created && (
        <div className="space-y-4 rounded-xl border border-teal-200 bg-teal-50/40 p-4 dark:border-teal-900 dark:bg-teal-950/20">
          <div className="flex items-center gap-2 font-semibold text-teal-700 dark:text-teal-400">
            <ShieldCheck className="h-5 w-5" />
            Your {created.kind === "ca" ? "CA" : "certificate"} is ready
          </div>
          <CertificateSummary info={created.identity.info} />

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                downloadFile(created.p12, `${name}.p12`, "application/x-pkcs12")
              }
            >
              <FileKey2 className="mr-2 h-4 w-4" />
              Download .p12 (private)
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                downloadFile(
                  toPem(
                    certificateToDer(created.identity.certificate),
                    "CERTIFICATE",
                  ),
                  `${name}.cer`,
                  "application/x-x509-ca-cert",
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Download certificate (.cer, public)
            </Button>
            {created.kind === "ca" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setCa(created.identity);
                  setKind("issued");
                  setYears(2);
                  setSubject(EMPTY_SUBJECT);
                  setCreated(null);
                  toast.success("CA loaded – now issue a signing certificate");
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Issue a certificate with this CA
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => onUseIdentity(created.identity)}
              >
                <PenLine className="mr-2 h-4 w-4" />
                Sign a PDF with it
              </Button>
            )}
          </div>

          <Alert>
            <AlertDescription className="space-y-1 text-xs">
              <p>
                <strong>.p12</strong> = your certificate{" "}
                <em>and private key</em>. Keep it secret and backed up. Anyone
                with this file and its password can sign as you.
              </p>
              <p>
                <strong>.cer</strong> = public certificate only.{" "}
                {created.kind === "ca"
                  ? "Give it to everyone who should trust certificates issued by this CA."
                  : "Send it to people who need to verify your signatures, so they can mark it as trusted."}
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
