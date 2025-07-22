"use client";

import React, { useState, useRef } from "react";
import {
  Zap,
  Copy,
  Type,
  Info,
  Check,
  Merge,
  Trash2,
  Upload,
  FileText,
  Scissors,
  RotateCw,
} from "lucide-react";
import {
  rgb,
  degrees,
  PDFDocument,
  StandardFonts,
  type PDFName,
} from "pdf-lib";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface PDFFile {
  id: string;
  name: string;
  file: File;
  pages: number;
  size: string;
  lastModified: string;
}

interface SplitOptions {
  splitType: "pages" | "size" | "range";
  pageRange: string;
  chunkSize: number;
  splitAt: string;
}

interface MergeOrder {
  fileId: string;
  pageRange: string;
}

interface WatermarkOptions {
  text: string;
  opacity: number;
  fontSize: number;
  rotation: number;
  position:
    | "center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
}

interface OptimizationOptions {
  quality: number;
  removeMetadata: boolean;
  removeAnnotations: boolean;
  removeImages: boolean;
  compressImages: boolean;
  imageQuality: number;
}

export default function PDFToolkit() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copiedInfo, setCopiedInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Split options
  const [splitOptions, setSplitOptions] = useState<SplitOptions>({
    splitType: "pages",
    pageRange: "1-2,4-6",
    chunkSize: 5,
    splitAt: "1,3,5",
  });

  // Merge options
  const [mergeOrder, setMergeOrder] = useState<MergeOrder[]>([]);

  // Watermark options
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>({
    text: "CONFIDENTIAL",
    opacity: 0.3,
    fontSize: 48,
    rotation: 45,
    position: "center",
  });

  // Text and image insertion
  const [insertText, setInsertText] = useState("Sample Text");
  const [insertPage, setInsertPage] = useState(1);
  const [insertX, setInsertX] = useState(100);
  const [insertY, setInsertY] = useState(100);

  // Optimization options
  const [optimizationOptions, setOptimizationOptions] =
    useState<OptimizationOptions>({
      quality: 75,
      removeMetadata: true,
      removeAnnotations: false,
      removeImages: false,
      compressImages: true,
      imageQuality: 80,
    });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getPDFInfo = async (file: File): Promise<{ pages: number }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      return { pages: pdfDoc.getPageCount() };
    } catch (error) {
      console.error("Error reading PDF:", error);
      return { pages: 0 };
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf",
    );

    if (pdfFiles.length === 0) {
      setResult("Please select PDF files only.");
      return;
    }

    setLoading(true);
    const newFiles: PDFFile[] = [];

    for (const file of pdfFiles) {
      const info = await getPDFInfo(file);
      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        file,
        pages: info.pages,
        size: formatFileSize(file.size),
        lastModified: new Date(file.lastModified).toLocaleString(),
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setLoading(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
    setMergeOrder((prev) => prev.filter((order) => order.fileId !== id));
  };

  const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const splitPDF = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      const pagesToExtract: number[] = [];

      if (splitOptions.splitType === "pages") {
        // Parse page ranges like "1-3,5,7-9"
        const ranges = splitOptions.pageRange.split(",");
        for (const range of ranges) {
          if (range.includes("-")) {
            const [start, end] = range
              .split("-")
              .map((n) => parseInt(n.trim()));
            for (let i = start; i <= Math.min(end, totalPages); i++) {
              if (i > 0) pagesToExtract.push(i - 1); // Convert to 0-based
            }
          } else {
            const page = parseInt(range.trim());
            if (page > 0 && page <= totalPages) {
              pagesToExtract.push(page - 1); // Convert to 0-based
            }
          }
        }
      } else if (splitOptions.splitType === "size") {
        // Split into chunks of specified size
        for (let i = 0; i < totalPages; i += splitOptions.chunkSize) {
          const chunk: number[] = [];
          for (
            let j = i;
            j < Math.min(i + splitOptions.chunkSize, totalPages);
            j++
          ) {
            chunk.push(j);
          }
          if (chunk.length > 0) {
            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdfDoc, chunk);
            copiedPages.forEach((page) => newPdf.addPage(page));
            const pdfBytes = await newPdf.save();
            downloadPDF(
              pdfBytes,
              `${file.name.replace(".pdf", "")}_chunk_${Math.floor(i / splitOptions.chunkSize) + 1}.pdf`,
            );
          }
        }
        setResult(
          `PDF split into ${Math.ceil(totalPages / splitOptions.chunkSize)} chunks!`,
        );
        setLoading(false);
        return;
      } else if (splitOptions.splitType === "range") {
        // Split at specific pages
        const splitPoints = splitOptions.splitAt
          .split(",")
          .map((n) => parseInt(n.trim()) - 1);
        splitPoints.unshift(0);
        splitPoints.push(totalPages);

        for (let i = 0; i < splitPoints.length - 1; i++) {
          const start = splitPoints[i];
          const end = splitPoints[i + 1];
          const chunk: number[] = [];
          for (let j = start; j < end; j++) {
            chunk.push(j);
          }
          if (chunk.length > 0) {
            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdfDoc, chunk);
            copiedPages.forEach((page) => newPdf.addPage(page));
            const pdfBytes = await newPdf.save();
            downloadPDF(
              pdfBytes,
              `${file.name.replace(".pdf", "")}_part_${i + 1}.pdf`,
            );
          }
        }
        setResult(`PDF split into ${splitPoints.length - 1} parts!`);
        setLoading(false);
        return;
      }

      // For pages mode, create single PDF with selected pages
      if (pagesToExtract.length > 0) {
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pagesToExtract);
        copiedPages.forEach((page) => newPdf.addPage(page));
        const pdfBytes = await newPdf.save();
        downloadPDF(pdfBytes, `${file.name.replace(".pdf", "")}_pages.pdf`);
        setResult(`Extracted ${pagesToExtract.length} pages successfully!`);
      } else {
        setResult("No valid pages specified for extraction.");
      }
    } catch (error) {
      setResult(`Error splitting PDF: ${error}`);
    }
    setLoading(false);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setResult("Please select at least 2 PDF files to merge.");
      return;
    }

    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();

      const order =
        mergeOrder.length > 0
          ? mergeOrder
          : files.map((f) => ({ fileId: f.id, pageRange: "all" }));

      for (const orderItem of order) {
        const file = files.find((f) => f.id === orderItem.fileId);
        if (!file) continue;

        const arrayBuffer = await file.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        let pagesToCopy: number[] = [];
        if (orderItem.pageRange === "all" || !orderItem.pageRange) {
          pagesToCopy = Array.from(
            { length: pdfDoc.getPageCount() },
            (_, i) => i,
          );
        } else {
          // Parse page range
          const ranges = orderItem.pageRange.split(",");
          for (const range of ranges) {
            if (range.includes("-")) {
              const [start, end] = range
                .split("-")
                .map((n) => parseInt(n.trim()));
              for (
                let i = start;
                i <= Math.min(end, pdfDoc.getPageCount());
                i++
              ) {
                if (i > 0) pagesToCopy.push(i - 1);
              }
            } else {
              const page = parseInt(range.trim());
              if (page > 0 && page <= pdfDoc.getPageCount()) {
                pagesToCopy.push(page - 1);
              }
            }
          }
        }

        const copiedPages = await mergedPdf.copyPages(pdfDoc, pagesToCopy);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      downloadPDF(pdfBytes, "merged-document.pdf");
      setResult(`Successfully merged ${order.length} PDF files!`);
    } catch (error) {
      setResult(`Error merging PDFs: ${error}`);
    }
    setLoading(false);
  };

  const rotatePDF = async (fileId: string, rotation: number) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const pages = pdfDoc.getPages();
      pages.forEach((page) => {
        page.setRotation(degrees(rotation));
      });

      const pdfBytes = await pdfDoc.save();
      downloadPDF(pdfBytes, `${file.name.replace(".pdf", "")}_rotated.pdf`);
      setResult(`PDF rotated ${rotation} degrees successfully!`);
    } catch (error) {
      setResult(`Error rotating PDF: ${error}`);
    }
    setLoading(false);
  };

  const addWatermark = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();

        let x = width / 2;
        let y = height / 2;

        switch (watermarkOptions.position) {
          case "top-left":
            x = 50;
            y = height - 50;
            break;
          case "top-right":
            x = width - 50;
            y = height - 50;
            break;
          case "bottom-left":
            x = 50;
            y = 50;
            break;
          case "bottom-right":
            x = width - 50;
            y = 50;
            break;
          default:
            x = width / 2;
            y = height / 2;
        }

        page.drawText(watermarkOptions.text, {
          x,
          y,
          size: watermarkOptions.fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: watermarkOptions.opacity,
          rotate: degrees(watermarkOptions.rotation),
        });
      });

      const pdfBytes = await pdfDoc.save();
      downloadPDF(pdfBytes, `${file.name.replace(".pdf", "")}_watermarked.pdf`);
      setResult("Watermark added successfully!");
    } catch (error) {
      setResult(`Error adding watermark: ${error}`);
    }
    setLoading(false);
  };

  const addTextToPDF = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();
      const targetPage = pages[Math.min(insertPage - 1, pages.length - 1)];

      if (targetPage) {
        targetPage.drawText(insertText, {
          x: insertX,
          y: insertY,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
      }

      const pdfBytes = await pdfDoc.save();
      downloadPDF(pdfBytes, `${file.name.replace(".pdf", "")}_with_text.pdf`);
      setResult("Text added successfully!");
    } catch (error) {
      setResult(`Error adding text: ${error}`);
    }
    setLoading(false);
  };

  const extractText = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    setLoading(true);
    try {
      await file.file.arrayBuffer();

      // Note: pdf-lib doesn't have built-in text extraction
      // This is a placeholder - in a real implementation, you'd use pdf2pic or similar
      setResult(
        "Text extraction requires additional libraries. PDF loaded successfully - use a dedicated PDF text extraction tool.",
      );
    } catch (error) {
      setResult(`Error extracting text: ${error}`);
    }
    setLoading(false);
  };

  const optimizePDF = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      if (optimizationOptions.removeMetadata) {
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("");
        pdfDoc.setCreator("");
      }

      if (optimizationOptions.removeAnnotations) {
        const pages = pdfDoc.getPages();
        pages.forEach((page) => {
          // Note: pdf-lib has limited annotation removal capabilities
          // This is a simplified implementation
          try {
            const pageNode = page.node;
            if (pageNode.has("Annots" as unknown as PDFName)) {
              pageNode.delete("Annots" as unknown as PDFName);
            }
          } catch (error) {
            console.warn("Could not remove annotations from page:", error);
          }
        });
      }

      // Note: Image compression and removal would require additional libraries
      // This is a basic optimization focusing on metadata and structure
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: optimizationOptions.quality < 90,
        addDefaultPage: false,
      });

      downloadPDF(pdfBytes, `${file.name.replace(".pdf", "")}_optimized.pdf`);

      const originalSize = file.file.size;
      const optimizedSize = pdfBytes.length;
      const savings = (
        ((originalSize - optimizedSize) / originalSize) *
        100
      ).toFixed(1);

      setResult(
        `PDF optimized successfully! Original: ${formatFileSize(originalSize)} → Optimized: ${formatFileSize(optimizedSize)} (${savings}% reduction)`,
      );
    } catch (error) {
      setResult(`Error optimizing PDF: ${error}`);
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedInfo(type);
      setTimeout(() => setCopiedInfo(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">PDF Toolkit</h1>
        <p className="text-muted-foreground">
          Comprehensive PDF manipulation tools - split, merge, rotate,
          watermark, and more
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Management</CardTitle>
          <CardDescription>
            Upload PDF files to start working with them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload PDFs
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {files.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Uploaded Files:</h4>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {file.pages} pages • {file.size} • {file.lastModified}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(file.name, file.id)}
                    >
                      {copiedInfo === file.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Tabs defaultValue="split" className="space-y-4">
          <div className="flex flex-col gap-2">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
              <TabsTrigger value="merge">Merge</TabsTrigger>
              <TabsTrigger value="optimize">Optimize</TabsTrigger>
              <TabsTrigger value="split">Split</TabsTrigger>
              <TabsTrigger value="rotate">Rotate</TabsTrigger>
              <TabsTrigger value="watermark" className="hidden md:block">
                Watermark
              </TabsTrigger>
              <TabsTrigger value="text" className="hidden md:block">
                Add Text
              </TabsTrigger>
              <TabsTrigger value="info" className="hidden md:block">
                Info
              </TabsTrigger>
            </TabsList>

            <TabsList className="grid w-full grid-cols-3 md:hidden">
              <TabsTrigger value="watermark">Watermark</TabsTrigger>
              <TabsTrigger value="text">Add Text</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="split">
            <Card>
              <CardHeader>
                <CardTitle>Split PDF</CardTitle>
                <CardDescription>
                  Extract specific pages or split PDF into chunks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Split Type</Label>
                    <Select
                      value={splitOptions.splitType}
                      onValueChange={(value: "pages" | "size" | "range") =>
                        setSplitOptions((prev) => ({
                          ...prev,
                          splitType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pages">Specific Pages</SelectItem>
                        <SelectItem value="size">By Chunk Size</SelectItem>
                        <SelectItem value="range">Split at Pages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {splitOptions.splitType === "pages" && (
                    <div className="space-y-2">
                      <Label>Page Range (e.g., 1-3,5,7-9)</Label>
                      <Input
                        value={splitOptions.pageRange}
                        onChange={(e) =>
                          setSplitOptions((prev) => ({
                            ...prev,
                            pageRange: e.target.value,
                          }))
                        }
                        placeholder="1-3,5,7-9"
                      />
                    </div>
                  )}

                  {splitOptions.splitType === "size" && (
                    <div className="space-y-2">
                      <Label>Pages per Chunk</Label>
                      <Input
                        type="number"
                        value={splitOptions.chunkSize}
                        onChange={(e) =>
                          setSplitOptions((prev) => ({
                            ...prev,
                            chunkSize: parseInt(e.target.value) || 1,
                          }))
                        }
                        min={1}
                      />
                    </div>
                  )}

                  {splitOptions.splitType === "range" && (
                    <div className="space-y-2">
                      <Label>Split at Pages (e.g., 3,6,9)</Label>
                      <Input
                        value={splitOptions.splitAt}
                        onChange={(e) =>
                          setSplitOptions((prev) => ({
                            ...prev,
                            splitAt: e.target.value,
                          }))
                        }
                        placeholder="3,6,9"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Select File to Split</Label>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        onClick={() => splitPDF(file.id)}
                        disabled={loading}
                        size="sm"
                      >
                        <Scissors className="mr-2 h-4 w-4" />
                        Split
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="merge">
            <Card>
              <CardHeader>
                <CardTitle>Merge PDFs</CardTitle>
                <CardDescription>
                  Combine multiple PDF files into one document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Merge Order (leave empty to use upload order)</Label>
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-2">
                      <Input
                        value={
                          mergeOrder.find((o) => o.fileId === file.id)
                            ?.pageRange || "all"
                        }
                        onChange={(e) => {
                          const newOrder = [...mergeOrder];
                          const existingIndex = newOrder.findIndex(
                            (o) => o.fileId === file.id,
                          );
                          const orderItem = {
                            fileId: file.id,
                            pageRange: e.target.value,
                          };

                          if (existingIndex >= 0) {
                            newOrder[existingIndex] = orderItem;
                          } else {
                            newOrder.push(orderItem);
                          }
                          setMergeOrder(newOrder);
                        }}
                        placeholder="all or 1-3,5"
                        className="flex-1"
                      />
                      <span className="w-32 truncate text-sm text-muted-foreground">
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={mergePDFs}
                  disabled={loading || files.length < 2}
                >
                  <Merge className="mr-2 h-4 w-4" />
                  Merge PDFs
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rotate">
            <Card>
              <CardHeader>
                <CardTitle>Rotate PDF</CardTitle>
                <CardDescription>
                  Rotate all pages in a PDF document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{file.name}</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => rotatePDF(file.id, 90)}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        90°
                      </Button>
                      <Button
                        onClick={() => rotatePDF(file.id, 180)}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        180°
                      </Button>
                      <Button
                        onClick={() => rotatePDF(file.id, 270)}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        270°
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watermark">
            <Card>
              <CardHeader>
                <CardTitle>Add Watermark</CardTitle>
                <CardDescription>
                  Add text watermark to PDF pages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Watermark Text</Label>
                    <Input
                      value={watermarkOptions.text}
                      onChange={(e) =>
                        setWatermarkOptions((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select
                      value={watermarkOptions.position}
                      onValueChange={(value: WatermarkOptions["position"]) =>
                        setWatermarkOptions((prev) => ({
                          ...prev,
                          position: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">
                          Bottom Right
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Opacity (0-1)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={watermarkOptions.opacity}
                      onChange={(e) =>
                        setWatermarkOptions((prev) => ({
                          ...prev,
                          opacity: parseFloat(e.target.value) || 0.3,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={watermarkOptions.fontSize}
                      onChange={(e) =>
                        setWatermarkOptions((prev) => ({
                          ...prev,
                          fontSize: parseInt(e.target.value) || 48,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rotation (degrees)</Label>
                    <Input
                      type="number"
                      value={watermarkOptions.rotation}
                      onChange={(e) =>
                        setWatermarkOptions((prev) => ({
                          ...prev,
                          rotation: parseInt(e.target.value) || 45,
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Select File to Watermark</Label>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        onClick={() => addWatermark(file.id)}
                        disabled={loading}
                        size="sm"
                      >
                        <Type className="mr-2 h-4 w-4" />
                        Add Watermark
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="text">
            <Card>
              <CardHeader>
                <CardTitle>Add Text</CardTitle>
                <CardDescription>
                  Insert text at specific coordinates in PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Text to Insert</Label>
                    <Textarea
                      value={insertText}
                      onChange={(e) => setInsertText(e.target.value)}
                      placeholder="Enter text to insert"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Page Number</Label>
                      <Input
                        type="number"
                        min="1"
                        value={insertPage}
                        onChange={(e) =>
                          setInsertPage(parseInt(e.target.value) || 1)
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>X Position</Label>
                        <Input
                          type="number"
                          value={insertX}
                          onChange={(e) =>
                            setInsertX(parseInt(e.target.value) || 100)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Y Position</Label>
                        <Input
                          type="number"
                          value={insertY}
                          onChange={(e) =>
                            setInsertY(parseInt(e.target.value) || 100)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Select File to Add Text</Label>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        onClick={() => addTextToPDF(file.id)}
                        disabled={loading}
                        size="sm"
                      >
                        <Type className="mr-2 h-4 w-4" />
                        Add Text
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimize">
            <Card>
              <CardHeader>
                <CardTitle>Optimize PDF</CardTitle>
                <CardDescription>
                  Reduce PDF file size and remove unnecessary elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Quality Level: {optimizationOptions.quality}%</Label>
                    <Slider
                      value={[optimizationOptions.quality]}
                      onValueChange={(value) =>
                        setOptimizationOptions((prev) => ({
                          ...prev,
                          quality: value[0],
                        }))
                      }
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Image Quality: {optimizationOptions.imageQuality}%
                    </Label>
                    <Slider
                      value={[optimizationOptions.imageQuality]}
                      onValueChange={(value) =>
                        setOptimizationOptions((prev) => ({
                          ...prev,
                          imageQuality: value[0],
                        }))
                      }
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="removeMetadata"
                      checked={optimizationOptions.removeMetadata}
                      onChange={(e) =>
                        setOptimizationOptions((prev) => ({
                          ...prev,
                          removeMetadata: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="removeMetadata" className="text-sm">
                      Remove metadata
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="removeAnnotations"
                      checked={optimizationOptions.removeAnnotations}
                      onChange={(e) =>
                        setOptimizationOptions((prev) => ({
                          ...prev,
                          removeAnnotations: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="removeAnnotations" className="text-sm">
                      Remove annotations
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="compressImages"
                      checked={optimizationOptions.compressImages}
                      onChange={(e) =>
                        setOptimizationOptions((prev) => ({
                          ...prev,
                          compressImages: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="compressImages" className="text-sm">
                      Compress images
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="removeImages"
                      checked={optimizationOptions.removeImages}
                      onChange={(e) =>
                        setOptimizationOptions((prev) => ({
                          ...prev,
                          removeImages: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="removeImages" className="text-sm">
                      Remove all images
                    </Label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Select File to Optimize</Label>
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        onClick={() => optimizePDF(file.id)}
                        disabled={loading}
                        size="sm"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        Optimize
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>PDF Information</CardTitle>
                <CardDescription>
                  View detailed information about your PDF files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="space-y-2 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{file.name}</h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => extractText(file.id)}
                          disabled={loading}
                          size="sm"
                          variant="outline"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Extract Text
                        </Button>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              `Name: ${file.name}\nPages: ${file.pages}\nSize: ${file.size}\nModified: ${file.lastModified}`,
                              `info-${file.id}`,
                            )
                          }
                          size="sm"
                          variant="outline"
                        >
                          {copiedInfo === `info-${file.id}` ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Pages:</span> {file.pages}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span> {file.size}
                      </div>
                      <div>
                        <span className="font-medium">Modified:</span>{" "}
                        {file.lastModified}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> PDF Document
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {result && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{result}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About PDF Toolkit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Split PDFs by pages, chunks, or ranges</li>
                <li>• Merge multiple PDFs with custom order</li>
                <li>• Rotate pages in any direction</li>
                <li>• Optimize PDFs to reduce file size</li>
                <li>• Add text watermarks with customization</li>
                <li>• Insert text at specific coordinates</li>
                <li>• View detailed PDF information</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Security & Privacy</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• All processing happens in your browser</li>
                <li>• No files are uploaded to servers</li>
                <li>• Your documents remain private</li>
                <li>• Works completely offline</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
