"use client";

import { toast } from "sonner";
import React, { useState } from "react";
import {
  Download,
  FileKey2,
  Loader2,
  PenLine,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toArrayBuffer, toPem } from "./lib/encoding";
import { findPrivateKey, parseCertificateFile } from "./lib/files";
import {
  exportEncryptedPrivateKey,
  exportPkcs12,
  importEncryptedPrivateKey,
  type SigningIdentity,
} from "./lib/p12";
import {
  createCsr,
  describeCertificate,
  generateKeyPair,
  importPrivateKey,
  keyMatchesCertificate,
  KEY_TYPES,
  orderChain,
  pkijs,
  type KeyType,
  type SubjectFields,
} from "./lib/pki";
import {
  CertificateSummary,
  downloadFile,
  EMPTY_SUBJECT,
  errorMessage,
  FileDrop,
  SubjectForm,
  validateNewPassword,
  validateSubject,
} from "./shared";

export default function RequestCertificate({
  onUseIdentity,
}: {
  onUseIdentity: (identity: SigningIdentity) => void;
}) {
  /* ---------- step 1: CSR ---------- */
  const [subject, setSubject] = useState<SubjectFields>(EMPTY_SUBJECT);
  const [keyType, setKeyType] = useState<KeyType>("RSA-3072");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<{
    csr: string;
    key: string;
    name: string;
  } | null>(null);

  const generate = async () => {
    const problem =
      validateSubject(subject) ?? validateNewPassword(password, confirm);
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      const keys = await generateKeyPair(keyType);
      const csr = await createCsr(subject, keys);
      const key = await exportEncryptedPrivateKey(keys.privateKey, password);
      setGenerated({
        csr: toPem(csr.toSchema().toBER(false), "CERTIFICATE REQUEST"),
        key: toPem(key, "ENCRYPTED PRIVATE KEY"),
        name:
          subject.commonName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-") || "request",
      });
      setPassword("");
      setConfirm("");
      toast.success("Request created – download both files");
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err, "Failed to create the request"));
    } finally {
      setBusy(false);
    }
  };

  /* ---------- step 2: combine ---------- */
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [keyPassword, setKeyPassword] = useState("");
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [p12Password, setP12Password] = useState("");
  const [p12Confirm, setP12Confirm] = useState("");
  const [combining, setCombining] = useState(false);
  const [combined, setCombined] = useState<{
    identity: SigningIdentity;
    p12: ArrayBuffer;
  } | null>(null);

  const combine = async () => {
    if (!keyFile || certFiles.length === 0) {
      toast.error(
        "Choose your private key file and the certificate(s) from your CA.",
      );
      return;
    }
    const problem = validateNewPassword(p12Password, p12Confirm);
    if (problem) {
      toast.error(problem);
      return;
    }
    setCombining(true);
    setCombined(null);
    try {
      const keyEntry = findPrivateKey(
        new Uint8Array(await keyFile.arrayBuffer()),
      );
      if (!keyEntry) throw new Error("No private key found in that file.");
      const keyInfo = keyEntry.encrypted
        ? await importEncryptedPrivateKey(keyEntry.der, keyPassword)
        : pkijs.PrivateKeyInfo.fromBER(toArrayBuffer(keyEntry.der));
      // Extractable so it can be written into the new .p12.
      const privateKey = await importPrivateKey(keyInfo, true);

      const certificates: pkijs.Certificate[] = [];
      for (const file of certFiles) {
        certificates.push(
          ...parseCertificateFile(new Uint8Array(await file.arrayBuffer()))
            .certificates,
        );
      }
      if (certificates.length === 0)
        throw new Error("No certificates found in those files.");

      let leaf: pkijs.Certificate | undefined;
      for (const cert of certificates) {
        if (await keyMatchesCertificate(privateKey, cert)) {
          leaf = cert;
          break;
        }
      }
      if (!leaf) {
        throw new Error(
          "None of these certificates belongs to this private key. Make sure you use the key that was created with your request.",
        );
      }
      const chain = orderChain(leaf, certificates);
      const info = await describeCertificate(leaf);
      const p12 = await exportPkcs12({
        privateKey,
        certificates: chain,
        password: p12Password,
        friendlyName: info.commonName,
      });
      setCombined({
        p12,
        identity: {
          privateKey,
          certificate: leaf,
          chain,
          info,
          source: "combined in this tab",
        },
      });
      setKeyPassword("");
      setP12Password("");
      setP12Confirm("");
      toast.success("Your .p12 is ready");
    } catch (err) {
      console.error(err);
      toast.error(
        errorMessage(err, "Could not combine the key and certificate"),
      );
    } finally {
      setCombining(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">
            1. Create a certificate request (CSR)
          </h3>
          <p className="text-sm text-muted-foreground">
            Use this to get a certificate from a real certificate authority.
            Your private key is created here and never leaves your device – only
            the CSR (which contains your public key and name) goes to the CA.
          </p>
        </div>
        <SubjectForm value={subject} onChange={setSubject} idPrefix="csr" />
        <div className="grid gap-3 sm:grid-cols-3">
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
            <Label htmlFor="csr-password">Password for the private key *</Label>
            <Input
              id="csr-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="csr-confirm">Confirm password *</Label>
            <Input
              id="csr-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={generate} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Create request
        </Button>

        {generated && (
          <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  downloadFile(
                    generated.csr,
                    `${generated.name}.csr`,
                    "application/pkcs10",
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Download request (.csr) – send to CA
              </Button>
              <Button
                onClick={() =>
                  downloadFile(
                    generated.key,
                    `${generated.name}.key`,
                    "application/x-pem-file",
                  )
                }
              >
                <FileKey2 className="mr-2 h-4 w-4" />
                Download private key (.key) – keep secret
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Download the private key now – it only exists in this tab and is
              gone when you close it. The key file is encrypted with your
              password.
            </p>
            <pre className="max-h-40 overflow-auto rounded-md bg-background p-2 text-[11px]">
              {generated.csr}
            </pre>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">
            2. Combine the CA&apos;s certificate with your key
          </h3>
          <p className="text-sm text-muted-foreground">
            When the CA sends your certificate back (.cer/.crt/.pem/.p7b), put
            it together with your private key to get a .p12 file you can sign
            with.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Private key (.key / .pem)</Label>
            {keyFile ? (
              <FileChip name={keyFile.name} onClear={() => setKeyFile(null)} />
            ) : (
              <FileDrop
                compact
                accept=".key,.pem,.der,.p8"
                title="Choose your private key"
                onFiles={([f]) => setKeyFile(f)}
              />
            )}
            <Input
              type="password"
              autoComplete="off"
              placeholder="Private key password"
              value={keyPassword}
              onChange={(e) => setKeyPassword(e.target.value)}
              aria-label="Private key password"
            />
          </div>
          <div className="space-y-2">
            <Label>Certificate(s) from your CA</Label>
            {certFiles.length > 0 ? (
              <div className="space-y-1">
                {certFiles.map((f, i) => (
                  <FileChip
                    key={`${f.name}-${i}`}
                    name={f.name}
                    onClear={() =>
                      setCertFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                  />
                ))}
              </div>
            ) : (
              <FileDrop
                compact
                multiple
                accept=".cer,.crt,.pem,.der,.p7b,.p7c"
                title="Choose certificate files"
                hint="Include intermediate certificates if the CA sent them"
                onFiles={setCertFiles}
              />
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="New password for the .p12"
            value={p12Password}
            onChange={(e) => setP12Password(e.target.value)}
            aria-label="New password for the .p12"
          />
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={p12Confirm}
            onChange={(e) => setP12Confirm(e.target.value)}
            aria-label="Confirm .p12 password"
          />
        </div>
        <Button onClick={combine} disabled={combining}>
          {combining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create .p12
        </Button>

        {combined && (
          <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/40 p-4 dark:border-teal-900 dark:bg-teal-950/20">
            <div className="flex items-center gap-2 font-semibold text-teal-700 dark:text-teal-400">
              <ShieldCheck className="h-5 w-5" />
              Ready to sign
            </div>
            <CertificateSummary info={combined.identity.info} />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  downloadFile(
                    combined.p12,
                    `${combined.identity.info.commonName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "certificate"}.p12`,
                    "application/x-pkcs12",
                  )
                }
              >
                <FileKey2 className="mr-2 h-4 w-4" />
                Download .p12
              </Button>
              <Button
                variant="outline"
                onClick={() => onUseIdentity(combined.identity)}
              >
                <PenLine className="mr-2 h-4 w-4" />
                Sign a PDF with it
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FileChip({ name, onClear }: { name: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2 text-sm">
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        aria-label={`Remove ${name}`}
        onClick={onClear}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
