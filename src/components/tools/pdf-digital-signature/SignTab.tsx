"use client";

import { toast } from "sonner";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  EyeOff,
  FileText,
  Loader2,
  MousePointerClick,
  PenLine,
  Plus,
  ShieldCheck,
  Signature,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import PdfPageView from "../pdf-signature/PdfPageView";
import SignatureCreator, {
  type SavedSignature,
} from "../pdf-signature/SignatureCreator";
import { SIGNATURE_FONTS } from "../pdf-signature/fonts";
import { loadPdfJs, type PDFDocumentProxy } from "../pdf-signature/pdfjs";
import {
  clampBox,
  formatBytes,
  heightForWidth,
  type Box,
  type Placement,
} from "../pdf-signature/utils";

import { renderAppearance, type RenderedAppearance } from "./appearance";
import type { SigningIdentity } from "./lib/p12";
import { signPdf } from "./lib/pdfSign";
import {
  verifyPdf,
  type SignatureReport,
  type VerifyReport,
} from "./lib/pdfVerify";
import { downloadFile, errorMessage, FileDrop, IdentityLoader } from "./shared";

interface WorkingPdf {
  name: string;
  bytes: Uint8Array;
  doc: PDFDocumentProxy;
  pageSizes: { width: number; height: number }[];
  existing: SignatureReport[];
}

interface SignResult {
  bytes: Uint8Array;
  fileName: string;
  report: VerifyReport;
}

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const REASONS = [
  "I approve this document",
  "I am the author of this document",
  "I have reviewed this document",
  "I agree to the terms of this document",
];

function signedName(name: string) {
  const base = name.replace(/\.pdf$/i, "").replace(/-signed(-\d+)?$/i, "");
  return `${base || "document"}-signed.pdf`;
}

interface SignTabProps {
  identity: SigningIdentity | null;
  onIdentityChange: (identity: SigningIdentity | null) => void;
  onCreateCertificate: () => void;
  onVerify: (bytes: Uint8Array, name: string) => void;
}

export default function SignTab({
  identity,
  onIdentityChange,
  onCreateCertificate,
  onVerify,
}: SignTabProps) {
  const [pdf, setPdf] = useState<WorkingPdf | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const [signerName, setSignerName] = useState("");
  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");

  const [visible, setVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [handwritten, setHandwritten] = useState<SavedSignature | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [preview, setPreview] = useState<RenderedAppearance | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [viewPage, setViewPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState<SignResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      pdf?.doc.destroy();
    };
  }, [pdf]);

  const effectiveName =
    signerName.trim() || identity?.info.commonName || "Your name";

  const loadPdf = useCallback(async (bytes: Uint8Array, name: string) => {
    setLoadingPdf(true);
    try {
      const report = await verifyPdf(bytes);
      const pdfjs = await loadPdfJs();
      const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
      const pageSizes: WorkingPdf["pageSizes"] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const vp = (await doc.getPage(i)).getViewport({ scale: 1 });
        pageSizes.push({ width: vp.width, height: vp.height });
      }
      setPdf({ name, bytes, doc, pageSizes, existing: report.signatures });
      setViewPage(doc.numPages - 1);
      setPlacement(null);
      setResult(null);
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err, "Could not open this PDF"));
    } finally {
      setLoadingPdf(false);
    }
  }, []);

  const onPdfFile = async (file: File) => {
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      toast.error("Please choose a PDF file");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error("PDF is larger than 50 MB");
      return;
    }
    await loadPdf(new Uint8Array(await file.arrayBuffer()), file.name);
  };

  // Re-render the visible signature preview whenever its content changes.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    renderAppearance({
      signerName: effectiveName,
      date: new Date(),
      reason,
      location,
      handwritten,
      showDetails,
      scriptFont: SIGNATURE_FONTS[0].family,
    })
      .then((rendered) => {
        if (!cancelled) setPreview(rendered);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [visible, effectiveName, reason, location, handwritten, showDetails]);

  const sizeOf = useCallback(
    (pageIndex: number) =>
      pdf?.pageSizes[pageIndex] ?? { width: 612, height: 792 },
    [pdf],
  );

  // Create or resize the placement to follow the preview's proportions.
  useEffect(() => {
    if (!pdf || !preview || !visible) return;
    setPlacement((prev) => {
      const pageIndex = prev?.pageIndex ?? pdf.pageSizes.length - 1;
      const size = sizeOf(pageIndex);
      const width = prev?.width ?? 0.4;
      let height = heightForWidth(
        width,
        preview.aspect,
        size.width,
        size.height,
      );
      let w = width;
      if (height > 0.4) {
        w = (width * 0.4) / height;
        height = 0.4;
      }
      const box = clampBox(
        prev
          ? { x: prev.x, y: prev.y, width: w, height }
          : { x: 0.95 - w, y: 0.93 - height, width: w, height },
      );
      return {
        id: "signature",
        pageIndex,
        dataUrl: preview.dataUrl,
        aspect: preview.aspect,
        label: "Signature",
        ...box,
      };
    });
  }, [pdf, preview, visible, sizeOf]);

  const moveToPage = (pageIndex: number) => {
    if (!placement || !preview) return;
    const size = sizeOf(pageIndex);
    const height = heightForWidth(
      placement.width,
      preview.aspect,
      size.width,
      size.height,
    );
    setPlacement({
      ...placement,
      pageIndex,
      ...clampBox({ ...placement, height }),
    });
  };

  const certified = pdf?.existing.find((s) => s.certificationLevel === 1);
  const canSign = Boolean(
    identity && pdf && !certified && (!visible || placement),
  );

  const sign = async () => {
    if (!identity || !pdf) return;
    setSigning(true);
    try {
      const signingTime = new Date();
      let appearance;
      if (visible && placement) {
        const rendered = await renderAppearance({
          signerName: effectiveName,
          date: signingTime,
          reason,
          location,
          handwritten,
          showDetails,
          scriptFont: SIGNATURE_FONTS[0].family,
        });
        const box: Box = {
          x: placement.x,
          y: placement.y,
          width: placement.width,
          height: placement.height,
        };
        appearance = { pageIndex: placement.pageIndex, box, png: rendered.png };
      }
      const bytes = await signPdf({
        pdf: pdf.bytes,
        identity,
        reason,
        location,
        contactInfo: contact,
        signerName: signerName.trim() || undefined,
        appearance,
        signingTime,
      });
      // Check our own output before handing it over.
      const report = await verifyPdf(bytes, [identity.certificate]);
      setResult({ bytes, fileName: signedName(pdf.name), report });
      toast.success("PDF signed");
      setTimeout(
        () =>
          resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          }),
        50,
      );
    } catch (err) {
      console.error(err);
      toast.error(errorMessage(err, "Signing failed"));
    } finally {
      setSigning(false);
    }
  };

  const newest = result?.report.signatures[result.report.signatures.length - 1];
  const selfCheckOk = Boolean(
    result &&
      newest?.integrity === "valid" &&
      newest.coversWholeFile &&
      result.report.signatures.every((s) => s.integrity === "valid"),
  );

  const pageCount = pdf?.pageSizes.length ?? 0;

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      {/* ---------------- settings ---------------- */}
      <div className="min-w-0 space-y-6 xl:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Step n={1} /> Certificate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <IdentityLoader identity={identity} onChange={onIdentityChange} />
            {!identity && (
              <p className="text-sm text-muted-foreground">
                Don&apos;t have one?{" "}
                <button
                  type="button"
                  onClick={onCreateCertificate}
                  className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                >
                  Create a certificate
                </button>{" "}
                in a few seconds.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Step n={2} /> PDF document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pdf ? (
              <div className="flex items-center gap-2 rounded-lg border p-2.5">
                <FileText className="h-5 w-5 shrink-0 text-red-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{pdf.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(pdf.bytes.length)} · {pageCount} page
                    {pageCount === 1 ? "" : "s"}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Remove PDF"
                  onClick={() => {
                    setPdf(null);
                    setResult(null);
                    setPlacement(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <FileDrop
                accept="application/pdf,.pdf"
                title="Drop a PDF or click to browse"
                hint="Up to 50 MB · stays on this device"
                loading={loadingPdf}
                onFiles={([f]) => onPdfFile(f)}
              />
            )}

            {pdf && pdf.existing.length > 0 && (
              <div className="rounded-lg bg-muted/60 p-3 text-sm">
                <div className="font-medium">
                  Already signed {pdf.existing.length} time
                  {pdf.existing.length === 1 ? "" : "s"}
                </div>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {pdf.existing.map((s, i) => (
                    <li key={i} className="truncate">
                      {s.signer?.commonName ?? s.signerName ?? s.fieldName} ·{" "}
                      {s.integrity === "valid" ? "intact" : "problem"}
                    </li>
                  ))}
                </ul>
                {!certified && (
                  <p className="mt-2 text-xs">
                    Your signature is added as an incremental update, so these
                    signatures stay valid.
                  </p>
                )}
              </div>
            )}
            {certified && (
              <p className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                This PDF is certified with “no changes allowed”. Any new
                signature would break that certification, so it can&apos;t be
                signed.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Step n={3} /> Signature details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sign-name">Name shown</Label>
              <Input
                id="sign-name"
                value={signerName}
                placeholder={
                  identity?.info.commonName ?? "From your certificate"
                }
                maxLength={80}
                onChange={(e) => setSignerName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sign-reason">Reason</Label>
              <Input
                id="sign-reason"
                list="sign-reasons"
                value={reason}
                placeholder="I approve this document"
                maxLength={120}
                onChange={(e) => setReason(e.target.value)}
              />
              <datalist id="sign-reasons">
                {REASONS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sign-location">Location</Label>
                <Input
                  id="sign-location"
                  value={location}
                  placeholder="City, Country"
                  maxLength={80}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sign-contact">Contact</Label>
                <Input
                  id="sign-contact"
                  value={contact}
                  placeholder="Email or phone"
                  maxLength={80}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Step n={4} /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                active={visible}
                onClick={() => setVisible(true)}
                icon={Signature}
                title="Visible"
                text="A signature block on the page"
              />
              <ModeButton
                active={!visible}
                onClick={() => setVisible(false)}
                icon={EyeOff}
                title="Invisible"
                text="Only in the reader's signature panel"
              />
            </div>
            {visible && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="show-details" className="text-sm">
                    Show name, date &amp; reason
                  </Label>
                  <Switch
                    id="show-details"
                    checked={showDetails}
                    onCheckedChange={setShowDetails}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="block text-sm">
                    Handwritten signature (optional)
                  </Label>
                  {handwritten ? (
                    <div className="flex items-center gap-2 rounded-lg border bg-white p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={handwritten.dataUrl}
                        alt="Handwritten signature"
                        className="h-10 min-w-0 flex-1 object-contain"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-500"
                        aria-label="Remove handwritten signature"
                        onClick={() => setHandwritten(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreatorOpen(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Draw, type or upload
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------- preview + sign ---------------- */}
      <div className="min-w-0 space-y-6 xl:col-span-3">
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {!pdf ? (
              <Empty icon={FileText} text="Add a PDF to see it here." />
            ) : !visible ? (
              <Empty
                icon={EyeOff}
                text="Invisible signature: nothing is drawn on the page. PDF readers list it in their Signatures panel and show whether the document was changed."
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Previous page"
                    disabled={viewPage === 0}
                    onClick={() => setViewPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm tabular-nums">
                    Page {viewPage + 1} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Next page"
                    disabled={viewPage >= pageCount - 1}
                    onClick={() => setViewPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {placement && placement.pageIndex !== viewPage && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moveToPage(viewPage)}
                    >
                      <MousePointerClick className="mr-1 h-4 w-4" />
                      Put signature on this page
                    </Button>
                  )}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {placement
                    ? placement.pageIndex === viewPage
                      ? "Drag the signature into place and resize it from the corner."
                      : `The signature is on page ${placement.pageIndex + 1}.`
                    : "Preparing signature…"}
                </p>
                <div className="rounded-lg bg-muted/60 p-3 sm:p-6">
                  <div className="mx-auto max-w-2xl">
                    <PdfPageView
                      pdf={pdf.doc}
                      pageIndex={viewPage}
                      placements={
                        placement && placement.pageIndex === viewPage
                          ? [placement]
                          : []
                      }
                      selectedId={selected}
                      onSelect={setSelected}
                      onChange={(_, box) =>
                        setPlacement((p) => (p ? { ...p, ...box } : p))
                      }
                      onRemove={() => setVisible(false)}
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              size="lg"
              className="w-full bg-teal-600 text-white hover:bg-teal-700"
              disabled={!canSign || signing}
              onClick={sign}
            >
              {signing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <PenLine className="mr-2 h-5 w-5" />
              )}
              {signing ? "Signing…" : "Sign PDF"}
            </Button>
            {!identity && pdf && (
              <p className="text-center text-xs text-muted-foreground">
                Load a certificate in step 1 to sign.
              </p>
            )}
          </CardContent>
        </Card>

        {result && (
          <div ref={resultRef}>
            <Card
              className={
                selfCheckOk
                  ? "border-teal-300 dark:border-teal-800"
                  : "border-red-300"
              }
            >
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  {selfCheckOk ? (
                    <CheckCircle2 className="h-7 w-7 shrink-0 text-teal-600" />
                  ) : (
                    <AlertTriangle className="h-7 w-7 shrink-0 text-red-600" />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {selfCheckOk
                        ? "Signed and verified"
                        : "Signed, but the self-check found a problem"}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selfCheckOk
                        ? `We re-checked the output: ${result.report.signatures.length === 1 ? "the signature is" : `all ${result.report.signatures.length} signatures are`} intact.`
                        : "Open the Verify tab for details before sending this file."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      downloadFile(
                        result.bytes,
                        result.fileName,
                        "application/pdf",
                      )
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download {result.fileName}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => loadPdf(result.bytes, result.fileName)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add another signature
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onVerify(result.bytes, result.fileName)}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verify
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">PAdES (ETSI.CAdES.detached)</Badge>
                  <Badge variant="outline">SHA-256</Badge>
                  <Badge variant="outline">
                    {identity?.info.keyDescription}
                  </Badge>
                  <Badge variant="outline">
                    {formatBytes(result.bytes.length)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <SignatureCreator
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        onCreate={(sig) => setHandwritten(sig)}
      />
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
      {n}
    </span>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Signature;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 p-3 text-left transition ${
        active
          ? "border-teal-500 bg-teal-50/60 dark:bg-teal-950/30"
          : "border-transparent bg-muted/50 hover:border-muted-foreground/30"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{text}</div>
    </button>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof FileText; text: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">
      <Icon className="h-10 w-10 opacity-60" />
      <p className="max-w-sm">{text}</p>
    </div>
  );
}
