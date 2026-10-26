"use client";

import { toast } from "sonner";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, ImageUp, PenLine, Type, Undo2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { SIGNATURE_FONTS } from "./fonts";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";
import {
  loadImage,
  readFileAsDataUrl,
  renderText,
  trimCanvas,
  type SignatureImage,
} from "./canvas";
import { removeLightBackground, tintOpaquePixels } from "./utils";

export type SignatureKind = "signature" | "initials";

export interface SavedSignature extends SignatureImage {
  id: string;
  kind: SignatureKind;
}

type Mode = "draw" | "type" | "upload";

export const INK_COLORS = [
  { name: "Black", value: "#111827" },
  { name: "Blue", value: "#1d4ed8" },
  { name: "Navy", value: "#1e3a8a" },
  { name: "Red", value: "#b91c1c" },
];

const MAX_UPLOAD_SIDE = 1600;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

interface SignatureCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (signature: SavedSignature) => void;
}

export default function SignatureCreator({
  open,
  onOpenChange,
  onCreate,
}: SignatureCreatorProps) {
  const [mode, setMode] = useState<Mode>("draw");
  const [kind, setKind] = useState<SignatureKind>("signature");
  const [color, setColor] = useState(INK_COLORS[0].value);

  // Draw
  const padRef = useRef<SignaturePadHandle>(null);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeCount, setStrokeCount] = useState(0);

  // Type
  const [typedText, setTypedText] = useState("");
  const [fontId, setFontId] = useState(SIGNATURE_FONTS[0].id);

  // Upload
  const [uploadSrc, setUploadSrc] = useState<string | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [threshold, setThreshold] = useState(215);
  const [recolor, setRecolor] = useState(false);
  const [uploadResult, setUploadResult] = useState<SignatureImage | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  // Re-process the uploaded image whenever its cleanup options change.
  useEffect(() => {
    if (!uploadSrc) {
      setUploadResult(null);
      return;
    }
    let cancelled = false;

    loadImage(uploadSrc)
      .then((img) => {
        if (cancelled) return;
        const scale = Math.min(
          1,
          MAX_UPLOAD_SIDE / Math.max(img.naturalWidth, img.naturalHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (removeBackground || recolor) {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if (removeBackground) removeLightBackground(data.data, threshold);
          if (recolor) tintOpaquePixels(data.data, color);
          ctx.putImageData(data, 0, 0);
        }

        const result = trimCanvas(canvas, 4);
        setUploadResult(result);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not read that image");
      });

    return () => {
      cancelled = true;
    };
  }, [uploadSrc, removeBackground, threshold, recolor, color]);

  const reset = useCallback(() => {
    padRef.current?.clear();
    setStrokeCount(0);
    setTypedText("");
    setUploadSrc(null);
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a PNG, JPG or WebP image");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image is larger than 10 MB");
      return;
    }
    try {
      setUploadSrc(await readFileAsDataUrl(file));
    } catch {
      toast.error("Could not read that image");
    }
  };

  const font =
    SIGNATURE_FONTS.find((f) => f.id === fontId) ?? SIGNATURE_FONTS[0];

  const canSave =
    (mode === "draw" && strokeCount > 0) ||
    (mode === "type" && typedText.trim() !== "") ||
    (mode === "upload" && uploadResult !== null);

  const handleSave = async () => {
    setSaving(true);
    try {
      let image: SignatureImage | null = null;
      if (mode === "draw") image = padRef.current?.toImage() ?? null;
      if (mode === "type") {
        image = await renderText(
          typedText.trim(),
          font.family,
          color,
          160,
          font.weight,
        );
      }
      if (mode === "upload") image = uploadResult;

      if (!image) {
        toast.error("Nothing to save yet");
        return;
      }

      onCreate({ ...image, id: crypto.randomUUID(), kind });
      toast.success(
        kind === "initials" ? "Initials created" : "Signature created",
      );
      handleOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create signature");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a signature</DialogTitle>
          <DialogDescription>
            Draw, type or upload. Nothing leaves your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-lg border p-1">
            {(["signature", "initials"] as const).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={kind === k ? "default" : "ghost"}
                onClick={() => setKind(k)}
                className="capitalize"
              >
                {k}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Ink</Label>
            {INK_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                aria-label={`${c.name} ink`}
                onClick={() => setColor(c.value)}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  color === c.value
                    ? "scale-110 border-primary ring-2 ring-primary/30"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw" className="gap-2">
              <PenLine className="h-4 w-4" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="gap-2">
              <Type className="h-4 w-4" />
              Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <ImageUp className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* forceMount keeps drawn strokes when switching tabs */}
          <TabsContent
            value="draw"
            forceMount
            className="space-y-3 data-[state=inactive]:hidden"
          >
            <SignaturePad
              ref={padRef}
              color={color}
              strokeWidth={strokeWidth}
              onStrokeCountChange={setStrokeCount}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-[12rem] flex-1 items-center gap-3">
                <Label className="shrink-0 text-sm">Pen size</Label>
                <Slider
                  min={1}
                  max={8}
                  step={0.5}
                  value={[strokeWidth]}
                  onValueChange={([v]) => setStrokeWidth(v)}
                  className="max-w-48"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={strokeCount === 0}
                  onClick={() => padRef.current?.undo()}
                >
                  <Undo2 className="mr-1 h-4 w-4" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={strokeCount === 0}
                  onClick={() => padRef.current?.clear()}
                >
                  <Eraser className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use a mouse, trackpad, finger or stylus. Pen pressure is
              supported.
            </p>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="typed-signature">
                {kind === "initials" ? "Your initials" : "Your full name"}
              </Label>
              <Input
                id="typed-signature"
                value={typedText}
                maxLength={60}
                placeholder={kind === "initials" ? "J.D." : "Jane Doe"}
                onChange={(e) => setTypedText(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SIGNATURE_FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontId(f.id)}
                  className={`flex h-20 min-w-0 flex-col items-start justify-center rounded-lg border-2 bg-white px-4 text-left transition ${
                    fontId === f.id
                      ? "border-indigo-500 ring-2 ring-indigo-500/30"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <span
                    className={`${f.className} w-full truncate text-3xl leading-tight`}
                    style={{ color }}
                  >
                    {typedText.trim() ||
                      (kind === "initials" ? "J.D." : "Jane Doe")}
                  </span>
                  <span className="text-[11px] text-gray-400">{f.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
            {uploadResult ? (
              <div className="flex h-44 items-center justify-center rounded-lg border bg-[length:16px_16px] p-4 [background-image:conic-gradient(#e5e7eb_25%,#fff_0_50%,#e5e7eb_0_75%,#fff_0)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadResult.dataUrl}
                  alt="Uploaded signature preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleUpload(e.dataTransfer.files?.[0]);
                }}
                className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-foreground"
              >
                <ImageUp className="h-8 w-8" />
                <span className="text-sm font-medium">
                  Drop a photo or scan of your signature
                </span>
                <span className="text-xs">PNG, JPG or WebP · up to 10 MB</span>
              </button>
            )}

            {uploadSrc && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="remove-bg" className="text-sm">
                    Remove light background
                  </Label>
                  <Switch
                    id="remove-bg"
                    checked={removeBackground}
                    onCheckedChange={setRemoveBackground}
                  />
                </div>
                {removeBackground && (
                  <div className="flex items-center gap-3">
                    <Label className="w-20 shrink-0 text-xs text-muted-foreground">
                      Sensitivity
                    </Label>
                    <Slider
                      min={150}
                      max={250}
                      step={1}
                      value={[threshold]}
                      onValueChange={([v]) => setThreshold(v)}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="recolor" className="text-sm">
                    Recolor ink to selected color
                  </Label>
                  <Switch
                    id="recolor"
                    checked={recolor}
                    onCheckedChange={setRecolor}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  Choose another image
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Saving…" : `Save ${kind}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
