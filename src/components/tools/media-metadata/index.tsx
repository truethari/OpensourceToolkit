"use client";

import { toast } from "sonner";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Copy,
  Info,
  Music,
  Image as ImageIcon,
  Video,
  Trash2,
  Upload,
  MapPin,
  Download,
  FileText,
  FileSearch,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

import { extractMetadata, mapUrl, type ExtractionResult } from "./extract";
import { buildExport, type MediaKind } from "./utils";

const KIND_ICON: Record<MediaKind, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  pdf: FileText,
  other: FileSearch,
};

const ACCEPTED = "image/*,video/*,audio/*,application/pdf";

export default function MediaMetadata() {
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Held in a ref so the cleanup effect never captures a stale URL.
  const previewUrlRef = useRef<string | undefined>(undefined);

  // Revoke the outgoing blob: URL whenever it is replaced or the tool unmounts.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const extracted = await extractMetadata(file);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = extracted.previewUrl;
      setResult(extracted);
      setFileName(file.name);
      toast.success(`Analyzed ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not read that file");
    } finally {
      setLoading(false);
    }
  }, []);

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) handleFile(file);
      event.target.value = "";
    },
    [handleFile],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const copyValue = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy");
    }
  }, []);

  const exportJson = useCallback(() => {
    if (!result) return;
    const blob = new Blob([buildExport(fileName, result.sections)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.[^.]+$/, "")}-metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Metadata exported");
  }, [result, fileName]);

  const clearAll = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = undefined;
    setResult(null);
    setFileName("");
  }, []);

  const KindIcon = result ? KIND_ICON[result.kind] : FileSearch;

  return (
    <ToolsWrapper>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white">
          <FileSearch className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Media Metadata Viewer
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 sm:text-lg">
          Inspect EXIF, GPS, codecs, tags, and checksums for images, video,
          audio, and PDFs — entirely in your browser.
        </p>
      </div>

      <Alert className="mb-6">
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          Files never leave your device. Everything is read locally, and no
          upload or network request is made — you can disconnect and it still
          works.
        </AlertDescription>
      </Alert>

      {/* Drop zone */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragging
                ? "border-teal-500 bg-teal-500/10"
                : "border-muted-foreground/25 hover:border-teal-500/50"
            }`}
          >
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">
              {loading
                ? "Reading file…"
                : "Drop a file here, or click to browse"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Images, video, audio, and PDFs
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={onInputChange}
              className="hidden"
            />
          </div>

          {result && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <Badge variant="secondary" className="gap-1">
                <KindIcon className="h-3 w-3" />
                {result.kind}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {fileName}
              </span>
              <Button variant="outline" size="sm" onClick={exportJson}>
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export JSON</span>
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Preview + location */}
          <div className="space-y-6 lg:col-span-1">
            {result.previewUrl && result.kind === "image" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.previewUrl}
                    alt={fileName}
                    className="max-h-80 w-full rounded-md object-contain"
                  />
                </CardContent>
              </Card>
            )}

            {result.previewUrl && result.kind === "video" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <video
                    src={result.previewUrl}
                    controls
                    className="max-h-80 w-full rounded-md"
                  />
                </CardContent>
              </Card>
            )}

            {result.previewUrl && result.kind === "audio" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio src={result.previewUrl} controls className="w-full" />
                </CardContent>
              </Card>
            )}

            {result.gps && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-4 w-4" />
                    Location found
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This file records where it was captured. The coordinates
                    below stay on your device — opening the map is your choice.
                  </p>
                  <div className="rounded-md bg-muted p-3 font-mono text-sm">
                    {result.gps.latitude.toFixed(6)},{" "}
                    {result.gps.longitude.toFixed(6)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyValue(
                          `${result.gps!.latitude}, ${result.gps!.longitude}`,
                          "Coordinates",
                        )
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={mapUrl(result.gps)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open map
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Metadata sections */}
          <div className="space-y-6 lg:col-span-2">
            {result.notes.map((note) => (
              <Alert key={note}>
                <Info className="h-4 w-4" />
                <AlertDescription>{note}</AlertDescription>
              </Alert>
            ))}

            {result.sections.map((section) => (
              <Card key={section.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y">
                    {section.fields.map((field) => (
                      <div
                        key={field.label}
                        className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-4"
                      >
                        <dt className="shrink-0 text-sm font-medium text-muted-foreground sm:w-48">
                          {field.label}
                        </dt>
                        <dd className="min-w-0 flex-1">
                          <div className="group flex items-start gap-2">
                            <span className="min-w-0 flex-1 break-all font-mono text-sm">
                              {field.value}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyValue(field.value, field.label)
                              }
                              aria-label={`Copy ${field.label}`}
                              className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {field.hint && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {field.hint}
                            </p>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!result && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What this reads</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 text-sm text-muted-foreground md:grid-cols-2">
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <ImageIcon className="h-4 w-4" /> Images
              </h3>
              <p>
                Full EXIF including camera make and model, lens, exposure,
                aperture, ISO, focal length, orientation, and GPS coordinates
                when present. Also IPTC and XMP where the file carries them.
              </p>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Video className="h-4 w-4" /> Video &amp; audio
              </h3>
              <p>
                Container and codec, duration, bitrate, sample rate, channels,
                bit depth, per-track detail, and embedded tags such as ID3,
                iTunes, and Vorbis comments — including artwork.
              </p>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <FileText className="h-4 w-4" /> PDFs
              </h3>
              <p>
                Page count and size, title, author, subject, keywords, and the
                creator and producer applications.
              </p>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <AlertCircle className="h-4 w-4" /> Every file
              </h3>
              <p>
                Exact byte size, MIME type, last-modified date, pixel dimensions
                or duration, and SHA-256 and SHA-1 checksums for verifying
                integrity or finding duplicates.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </ToolsWrapper>
  );
}
