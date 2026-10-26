"use client";

import React, { useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  KeyRound,
  Loader2,
  ShieldAlert,
  Upload,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { importPkcs12, type SigningIdentity } from "./lib/p12";
import type { CertificateInfo, SubjectFields } from "./lib/pki";

/* ------------------------------------------------------------------ */

export function downloadFile(
  data: BlobPart,
  fileName: string,
  type = "application/octet-stream",
) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function formatDateTime(date: Date | undefined): string {
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

/* ------------------------------------------------------------------ */

interface FileDropProps {
  accept: string;
  title: string;
  hint?: string;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  onFiles: (files: File[]) => void;
}

export function FileDrop({
  accept,
  title,
  hint,
  multiple,
  disabled,
  loading,
  compact,
  onFiles,
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const files = Array.from(e.dataTransfer.files ?? []);
          if (files.length) onFiles(multiple ? files : files.slice(0, 1));
        }}
        className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center transition disabled:opacity-60 ${
          compact ? "p-4" : "min-h-40 p-6"
        } ${
          over
            ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30"
            : "border-gray-300 hover:border-teal-400 dark:border-gray-700"
        }`}
      >
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
        ) : (
          <Upload className="h-7 w-7 text-teal-600" />
        )}
        <span className="text-sm font-semibold">{title}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </button>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function CertificateSummary({
  info,
  compact,
}: {
  info: CertificateInfo;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const expired = info.notAfter < now;
  const notYet = info.notBefore > now;

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 truncate font-semibold">
          {info.commonName}
        </span>
        {info.isCA && <Badge variant="secondary">CA</Badge>}
        {info.selfIssued && <Badge variant="outline">Self-signed</Badge>}
        {expired && <Badge className="bg-red-600 text-white">Expired</Badge>}
        {notYet && (
          <Badge className="bg-amber-500 text-white">Not yet valid</Badge>
        )}
      </div>
      {!compact && (
        <div className="text-xs text-muted-foreground">
          Issued by {info.issuer.CN ?? info.issuerText} · valid{" "}
          {formatDate(info.notBefore)} – {formatDate(info.notAfter)} ·{" "}
          {info.keyDescription}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
        />
        {open ? "Hide" : "Show"} certificate details
      </button>
      {open && (
        <dl className="grid gap-x-4 gap-y-1.5 rounded-lg border bg-muted/40 p-3 text-xs sm:grid-cols-[9rem_1fr]">
          <Row label="Subject" value={info.subjectText} />
          <Row label="Issuer" value={info.issuerText} />
          <Row label="Valid from" value={formatDateTime(info.notBefore)} />
          <Row label="Valid until" value={formatDateTime(info.notAfter)} />
          <Row label="Key" value={info.keyDescription} />
          <Row label="Signature algorithm" value={info.signatureAlgorithm} />
          <Row label="Serial number" value={info.serialHex} mono />
          {info.keyUsage.length > 0 && (
            <Row label="Key usage" value={info.keyUsage.join(", ")} />
          )}
          {info.extKeyUsage.length > 0 && (
            <Row label="Extended usage" value={info.extKeyUsage.join(", ")} />
          )}
          <Row label="SHA-256 fingerprint" value={info.sha256} mono />
          <Row label="SHA-1 fingerprint" value={info.sha1} mono />
        </dl>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd
        className={`min-w-0 break-all ${mono ? "font-mono text-[11px]" : ""}`}
      >
        {value}
      </dd>
    </>
  );
}

/* ------------------------------------------------------------------ */

interface IdentityLoaderProps {
  identity: SigningIdentity | null;
  onChange: (identity: SigningIdentity | null) => void;
  title?: string;
  requireCA?: boolean;
}

/** Pick a .p12/.pfx, unlock it with its password, show who it belongs to. */
export function IdentityLoader({
  identity,
  onChange,
  title = "Your certificate (.p12 / .pfx)",
  requireCA,
}: IdentityLoaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (identity) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-teal-200 bg-teal-50/60 p-3 dark:border-teal-900 dark:bg-teal-950/30">
        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
        <div className="min-w-0 flex-1">
          <CertificateSummary info={identity.info} />
          <div className="mt-1 truncate text-xs text-muted-foreground">
            From {identity.source}
            {identity.chain.length > 1 &&
              ` · includes ${identity.chain.length - 1} issuer certificate${identity.chain.length > 2 ? "s" : ""}`}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          aria-label="Remove certificate"
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const unlock = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const loaded = await importPkcs12(
        await file.arrayBuffer(),
        password,
        file.name,
      );
      if (requireCA && !loaded.info.isCA) {
        setError(
          "This certificate isn't a certificate authority (CA), so it can't issue certificates.",
        );
        return;
      }
      setPassword("");
      setFile(null);
      onChange(loaded);
    } catch (err) {
      setError(errorMessage(err, "Could not open this certificate file."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{title}</Label>
      {file ? (
        <div className="flex items-center gap-2 rounded-lg border p-2 text-sm">
          <KeyRound className="h-4 w-4 shrink-0 text-teal-600" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Choose a different file"
            onClick={() => {
              setFile(null);
              setError(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <FileDrop
          compact
          accept=".p12,.pfx,application/x-pkcs12"
          title="Choose a .p12 / .pfx file"
          hint="Contains your certificate and private key"
          onFiles={([f]) => {
            setFile(f);
            setError(null);
          }}
        />
      )}
      {file && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            unlock();
          }}
        >
          <Input
            type="password"
            autoComplete="off"
            placeholder="Certificate password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Certificate password"
          />
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
          </Button>
        </form>
      )}
      {error && (
        <p className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export const EMPTY_SUBJECT: SubjectFields = {
  commonName: "",
  email: "",
  organization: "",
  organizationalUnit: "",
  locality: "",
  state: "",
  country: "",
};

export function SubjectForm({
  value,
  onChange,
  idPrefix,
}: {
  value: SubjectFields;
  onChange: (value: SubjectFields) => void;
  idPrefix: string;
}) {
  const field = (
    key: keyof SubjectFields,
    label: string,
    placeholder: string,
    extra?: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${idPrefix}-${key}`}>{label}</Label>
      <Input
        id={`${idPrefix}-${key}`}
        value={value[key] ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        {...extra}
      />
    </div>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {field("commonName", "Full name *", "Jane Doe", { maxLength: 64 })}
      {field("email", "Email", "jane@example.com", {
        type: "email",
        maxLength: 128,
      })}
      {field("organization", "Organization", "Example Ltd", { maxLength: 64 })}
      {field("organizationalUnit", "Department", "Legal", { maxLength: 64 })}
      {field("locality", "City", "Colombo", { maxLength: 64 })}
      <div className="grid grid-cols-2 gap-3">
        {field("state", "State / Province", "Western", { maxLength: 64 })}
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-country`}>Country</Label>
          <Input
            id={`${idPrefix}-country`}
            value={value.country ?? ""}
            placeholder="LK"
            maxLength={2}
            onChange={(e) =>
              onChange({
                ...value,
                country: e.target.value.replace(/[^a-z]/gi, "").toUpperCase(),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

export function validateSubject(subject: SubjectFields): string | null {
  if (!subject.commonName.trim()) return "Enter a name for the certificate.";
  if (subject.country && !/^[A-Z]{2}$/.test(subject.country)) {
    return "Country must be a 2-letter code like US, GB or LK.";
  }
  if (subject.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subject.email)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validateNewPassword(
  password: string,
  confirm: string,
): string | null {
  if (password.length < 8) return "Use a password of at least 8 characters.";
  if (password !== confirm) return "The passwords don't match.";
  return null;
}
