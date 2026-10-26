"use client";

import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Info,
  Loader2,
  LocateFixed,
  Plus,
  Signature,
  Trash2,
  Type,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

import PdfPageView from "./PdfPageView";
import { renderText, type SignatureImage } from "./canvas";
import { loadPdfJs, type PDFDocumentProxy } from "./pdfjs";
import SignatureCreator, {
  INK_COLORS,
  type SavedSignature,
} from "./SignatureCreator";
import {
  applyPlacements,
  clampBox,
  DATE_FORMATS,
  formatBytes,
  formatDate,
  heightForWidth,
  signedFileName,
  type Box,
  type DateFormat,
  type Placement,
} from "./utils";

interface LoadedPdf {
  file: File;
  bytes: Uint8Array;
  doc: PDFDocumentProxy;
  /** Displayed size of every page in points, after /Rotate. */
  pageSizes: { width: number; height: number }[];
}

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const STAMP_FONT = "Helvetica, Arial, sans-serif";
/** Visual height of date/text stamps, in PDF points (~11pt type). */
const STAMP_HEIGHT_PT = 16;

export default function PdfSignature() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  const [signatures, setSignatures] = useState<SavedSignature[]>([]);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [dateFormat, setDateFormat] = useState<DateFormat>("long");
  const [stampText, setStampText] = useState("");
  const [stampColor, setStampColor] = useState(INK_COLORS[0].value);

  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Release the pdf.js document (and its worker-side memory) when replaced.
  useEffect(() => {
    return () => {
      pdf?.doc.destroy();
    };
  }, [pdf]);

  const loadFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      toast.error("Please choose a PDF file");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error("PDF is larger than 50 MB");
      return;
    }

    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());

      // pdf-lib writes the signed copy, so make sure it can open the file
      // before the user spends time placing signatures.
      await PDFDocument.load(bytes, { updateMetadata: false });

      const pdfjs = await loadPdfJs();
      // pdf.js transfers the buffer to its worker, so hand it a copy.
      const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;

      const pageSizes: LoadedPdf["pageSizes"] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const viewport = (await doc.getPage(i)).getViewport({ scale: 1 });
        pageSizes.push({ width: viewport.width, height: viewport.height });
      }

      setPdf({ file, bytes, doc, pageSizes });
      setPageIndex(0);
      setPlacements([]);
      setSelectedId(null);
      toast.success(
        `Loaded ${file.name} (${doc.numPages} page${doc.numPages === 1 ? "" : "s"})`,
      );
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      const name = err instanceof Error ? err.name : "";
      if (/encrypt/i.test(message) || name === "PasswordException") {
        toast.error(
          "This PDF is password-protected. Remove the password first, then try again.",
        );
      } else {
        toast.error("Could not open this PDF. The file may be damaged.");
      }
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const clearDocument = () => {
    setPdf(null);
    setPlacements([]);
    setSelectedId(null);
    setPageIndex(0);
  };

  const pageCount = pdf?.doc.numPages ?? 0;
  const currentSize = pdf?.pageSizes[pageIndex] ?? {
    width: 612,
    height: 792,
  };

  /** Drop an image in the middle of the current page and select it. */
  const placeImage = (
    image: SignatureImage,
    label: string,
    box: Pick<Box, "width">,
  ) => {
    if (!pdf) {
      toast.error("Upload a PDF first");
      return;
    }

    let width = box.width;
    let height = heightForWidth(
      width,
      image.aspect,
      currentSize.width,
      currentSize.height,
    );
    if (height > 0.5) {
      width *= 0.5 / height;
      height = 0.5;
    }

    // Cascade new items so repeated clicks don't stack exactly.
    const onPage = placements.filter((p) => p.pageIndex === pageIndex).length;
    const offset = (onPage % 6) * 0.03;
    const placed: Placement = {
      id: crypto.randomUUID(),
      pageIndex,
      dataUrl: image.dataUrl,
      aspect: image.aspect,
      label,
      ...clampBox({
        x: (1 - width) / 2 + offset,
        y: (1 - height) / 2 + offset,
        width,
        height,
      }),
    };
    setPlacements((prev) => [...prev, placed]);
    setSelectedId(placed.id);
  };

  const placeSignature = (sig: SavedSignature) => {
    placeImage(sig, sig.kind === "initials" ? "Initials" : "Signature", {
      width: sig.kind === "initials" ? 0.12 : 0.28,
    });
  };

  const placeStamp = async (text: string, label: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Enter some text first");
      return;
    }
    const image = await renderText(trimmed, STAMP_FONT, stampColor, 120);
    if (!image) {
      toast.error("Could not render text");
      return;
    }
    // Size by height so stamps read like ~11pt type regardless of length.
    const width = STAMP_HEIGHT_PT / (image.aspect * currentSize.width);
    placeImage(image, label, { width: Math.min(width, 0.9) });
  };

  const updatePlacement = useCallback((id: string, box: Box) => {
    setPlacements((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...box } : p)),
    );
  }, []);

  const removePlacement = useCallback((id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const copyToAllPages = (source: Placement) => {
    if (!pdf) return;
    const copies: Placement[] = [];
    pdf.pageSizes.forEach((size, i) => {
      if (i === source.pageIndex) return;
      copies.push({
        ...source,
        id: crypto.randomUUID(),
        pageIndex: i,
        ...clampBox({
          x: source.x,
          y: source.y,
          width: source.width,
          // Pages can differ in size; keep the image's aspect ratio on each.
          height: heightForWidth(
            source.width,
            source.aspect,
            size.width,
            size.height,
          ),
        }),
      });
    });
    setPlacements((prev) => [...prev, ...copies]);
    toast.success(`Copied ${source.label} to ${copies.length} other pages`);
  };

  const removeSignature = (id: string) => {
    const sig = signatures.find((s) => s.id === id);
    setSignatures((prev) => prev.filter((s) => s.id !== id));
    if (sig) {
      setPlacements((prev) => prev.filter((p) => p.dataUrl !== sig.dataUrl));
    }
  };

  const downloadSigned = async () => {
    if (!pdf || placements.length === 0) return;
    setExporting(true);
    try {
      const out = await applyPlacements(pdf.bytes, placements);
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = signedFileName(pdf.file.name);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Signed PDF downloaded (${formatBytes(out.length)})`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create the signed PDF");
    } finally {
      setExporting(false);
    }
  };

  const goToPage = (index: number) => {
    setPageIndex(Math.min(Math.max(index, 0), Math.max(pageCount - 1, 0)));
    setSelectedId(null);
  };

  const pagePlacements = placements.filter((p) => p.pageIndex === pageIndex);

  return (
    <ToolsWrapper>
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white">
          <Signature className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          PDF Signature
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Draw, type or upload your signature and place it anywhere on a PDF —
          entirely in your browser
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => loadFile(e.target.files?.[0])}
      />

      {!pdf ? (
        <Card>
          <CardContent className="p-6">
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                loadFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-72 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition ${
                dragOver
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                  : "border-gray-300 hover:border-indigo-400 dark:border-gray-700"
              }`}
            >
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              ) : (
                <Upload className="h-10 w-10 text-indigo-600" />
              )}
              <span className="text-lg font-semibold">
                {loading
                  ? "Opening PDF…"
                  : "Drop a PDF here or click to browse"}
              </span>
              <span className="text-sm text-muted-foreground">
                Up to 50 MB · your file never leaves this device
              </span>
            </button>

            <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
              {[
                ["1", "Upload", "Open the PDF you need to sign"],
                [
                  "2",
                  "Sign",
                  "Draw, type or upload a signature and drag it into place",
                ],
                ["3", "Download", "Save a signed copy of the PDF"],
              ].map(([n, title, text]) => (
                <div key={n} className="flex gap-3 rounded-lg border p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {n}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium">{title}</div>
                    <div className="text-muted-foreground">{text}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Sidebar */}
          <div className="grid min-w-0 content-start gap-6 md:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2 text-lg">
                  Your signatures
                  <Button size="sm" onClick={() => setCreatorOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Create
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {signatures.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setCreatorOpen(true)}
                    className="flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition hover:border-indigo-400 hover:text-foreground"
                  >
                    <Signature className="h-6 w-6" />
                    Create your first signature
                  </button>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Click one to add it to page {pageIndex + 1}.
                    </p>
                    {signatures.map((sig) => (
                      <div
                        key={sig.id}
                        className="relative flex items-center rounded-lg border bg-white p-2 transition hover:border-indigo-400"
                      >
                        <button
                          type="button"
                          onClick={() => placeSignature(sig)}
                          className="flex h-16 min-w-0 flex-1 items-center justify-center px-6"
                          title={`Add ${sig.kind} to page ${pageIndex + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sig.dataUrl}
                            alt={sig.kind}
                            className="max-h-full max-w-full object-contain"
                          />
                        </button>
                        <Badge
                          variant="secondary"
                          className="pointer-events-none absolute left-1.5 top-1.5 px-1.5 py-0 text-[10px] capitalize"
                        >
                          {sig.kind}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${sig.kind}`}
                          onClick={() => removeSignature(sig.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Date &amp; text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Color</Label>
                  {INK_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.name}
                      aria-label={`${c.name} text`}
                      onClick={() => setStampColor(c.value)}
                      className={`h-6 w-6 rounded-full border-2 ${
                        stampColor === c.value
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={dateFormat}
                      onValueChange={(v) => setDateFormat(v as DateFormat)}
                    >
                      <SelectTrigger className="min-w-[9rem] flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_FORMATS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() =>
                        placeStamp(formatDate(new Date(), dateFormat), "Date")
                      }
                    >
                      <CalendarDays className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stamp-text">Text</Label>
                  <div className="flex gap-2">
                    <Input
                      id="stamp-text"
                      value={stampText}
                      maxLength={120}
                      placeholder="Name, title, place…"
                      onChange={(e) => setStampText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          placeStamp(stampText, `Text: ${stampText.trim()}`);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      disabled={!stampText.trim()}
                      onClick={() =>
                        placeStamp(stampText, `Text: ${stampText.trim()}`)
                      }
                    >
                      <Type className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 xl:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Placed items{" "}
                  <span className="text-muted-foreground">
                    ({placements.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {placements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nothing placed yet. Add a signature, then drag it into
                    position and resize it from the corner handle.
                  </p>
                ) : (
                  <ul className="max-h-72 space-y-1 overflow-y-auto">
                    {[...placements]
                      .sort((a, b) => a.pageIndex - b.pageIndex)
                      .map((p) => (
                        <li
                          key={p.id}
                          className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                            p.id === selectedId ? "bg-muted" : ""
                          }`}
                        >
                          <Badge variant="outline" className="shrink-0">
                            p.{p.pageIndex + 1}
                          </Badge>
                          <span className="min-w-0 flex-1 truncate">
                            {p.label}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            title="Show on page"
                            aria-label={`Show ${p.label} on page`}
                            onClick={() => {
                              setPageIndex(p.pageIndex);
                              setSelectedId(p.id);
                            }}
                          >
                            <LocateFixed className="h-3.5 w-3.5" />
                          </Button>
                          {pageCount > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0"
                              title="Copy to all other pages"
                              aria-label={`Copy ${p.label} to all other pages`}
                              onClick={() => copyToAllPages(p)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 hover:text-red-600"
                            title="Remove"
                            aria-label={`Remove ${p.label}`}
                            onClick={() => removePlacement(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document */}
          <div className="min-w-0 xl:col-span-2">
            <Card>
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-5 w-5 shrink-0 text-red-600" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {pdf.file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatBytes(pdf.file.size)} · {pageCount} page
                        {pageCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Upload className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Change</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearDocument}
                      aria-label="Close document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={downloadSigned}
                      disabled={placements.length === 0 || exporting}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {exporting ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-1 h-4 w-4" />
                      )}
                      Download
                      <span className="ml-1 hidden sm:inline">signed PDF</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Previous page"
                    disabled={pageIndex === 0}
                    onClick={() => goToPage(pageIndex - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm tabular-nums">
                    Page{" "}
                    <Input
                      type="number"
                      min={1}
                      max={pageCount}
                      value={pageIndex + 1}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n >= 1) goToPage(n - 1);
                      }}
                      className="inline-block h-8 w-16 text-center"
                      aria-label="Page number"
                    />{" "}
                    of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Next page"
                    disabled={pageIndex >= pageCount - 1}
                    onClick={() => goToPage(pageIndex + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {pagePlacements.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="hidden sm:inline-flex"
                    >
                      {pagePlacements.length} on this page
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/60 p-3 sm:p-6">
                  <div className="mx-auto max-w-3xl">
                    <PdfPageView
                      pdf={pdf.doc}
                      pageIndex={pageIndex}
                      placements={pagePlacements}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onChange={updatePlacement}
                      onRemove={removePlacement}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This adds a visual electronic signature (an image of your signature)
          to the PDF. It is not a certificate-based digital signature, so it
          does not cryptographically prove who signed or detect later edits.
        </AlertDescription>
      </Alert>

      <SignatureCreator
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        onCreate={(sig) => {
          setSignatures((prev) => [...prev, sig]);
          if (pdf) placeSignature(sig);
        }}
      />
    </ToolsWrapper>
  );
}
