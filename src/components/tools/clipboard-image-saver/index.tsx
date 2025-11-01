"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Clipboard,
  Download,
  Trash2,
  Info,
  Settings,
  Image as ImageIcon,
  History,
  Copy,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
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

interface ClipboardImage {
  id: string;
  url: string;
  blob: Blob;
  width: number;
  height: number;
  format: string;
  size: number;
  timestamp: Date;
}

export default function ClipboardImageSaver() {
  const [images, setImages] = useState<ClipboardImage[]>([]);
  const [currentImage, setCurrentImage] = useState<ClipboardImage | null>(null);
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState([90]);
  const [resizeWidth, setResizeWidth] = useState("");
  const [resizeHeight, setResizeHeight] = useState("");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [pastePrompt, setPastePrompt] = useState(true);
  const [copied, setCopied] = useState(false);

  const pasteAreaRef = useRef<HTMLDivElement>(null);

  const outputFormats = [
    { value: "png", label: "PNG", mimeType: "image/png", hasQuality: false },
    {
      value: "jpeg",
      label: "JPEG",
      mimeType: "image/jpeg",
      hasQuality: true,
    },
    {
      value: "webp",
      label: "WebP",
      mimeType: "image/webp",
      hasQuality: true,
    },
    { value: "bmp", label: "BMP", mimeType: "image/bmp", hasQuality: false },
  ];

  const selectedOutputFormat = outputFormats.find(
    (f) => f.value === outputFormat,
  );
  const showQualitySlider = selectedOutputFormat?.hasQuality;

  // Focus paste area on mount
  useEffect(() => {
    pasteAreaRef.current?.focus();
  }, []);

  const handlePaste = useCallback(
    async (e: ClipboardEvent | React.ClipboardEvent) => {
      e.preventDefault();
      const items = e.clipboardData?.items;

      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (!blob) continue;

          const url = URL.createObjectURL(blob);
          const img = new Image();

          img.onload = () => {
            const newImage: ClipboardImage = {
              id: Date.now().toString() + Math.random(),
              url,
              blob,
              width: img.naturalWidth,
              height: img.naturalHeight,
              format: item.type.split("/")[1],
              size: blob.size,
              timestamp: new Date(),
            };

            setImages((prev) => [newImage, ...prev]);
            setCurrentImage(newImage);
            setPastePrompt(false);
          };

          img.src = url;
        }
      }
    },
    [],
  );

  // Global paste event listener
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => handlePaste(e);
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [handlePaste]);

  const processImage = useCallback(
    (img: HTMLImageElement): HTMLCanvasElement => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      // Calculate dimensions
      const targetWidth = resizeWidth
        ? parseInt(resizeWidth)
        : img.naturalWidth;
      const targetHeight = resizeHeight
        ? parseInt(resizeHeight)
        : img.naturalHeight;

      let width = targetWidth;
      let height = targetHeight;

      if (maintainAspectRatio && (resizeWidth || resizeHeight)) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        if (resizeWidth && !resizeHeight) {
          height = width / aspectRatio;
        } else if (resizeHeight && !resizeWidth) {
          width = height * aspectRatio;
        } else if (resizeWidth && resizeHeight) {
          if (aspectRatio > width / height) {
            height = width / aspectRatio;
          } else {
            width = height * aspectRatio;
          }
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Fill background for JPEG/BMP
      if (outputFormat === "jpeg" || outputFormat === "bmp") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      return canvas;
    },
    [outputFormat, resizeWidth, resizeHeight, maintainAspectRatio],
  );

  const downloadImage = useCallback(
    async (image: ClipboardImage) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = processImage(img);
        const qualityValue = showQualitySlider ? quality[0] / 100 : undefined;

        canvas.toBlob(
          (blob) => {
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `clipboard-image-${Date.now()}.${outputFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          },
          selectedOutputFormat?.mimeType,
          qualityValue,
        );
      };

      img.src = image.url;
    },
    [
      processImage,
      outputFormat,
      quality,
      selectedOutputFormat,
      showQualitySlider,
    ],
  );

  const downloadAllImages = useCallback(() => {
    images.forEach((image, index) => {
      setTimeout(() => downloadImage(image), index * 100);
    });
  }, [images, downloadImage]);

  const copyToClipboard = useCallback(async (image: ClipboardImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy image:", error);
      alert("Failed to copy image to clipboard");
    }
  }, []);

  const deleteImage = useCallback(
    (id: string) => {
      setImages((prev) => {
        const image = prev.find((img) => img.id === id);
        if (image) {
          URL.revokeObjectURL(image.url);
        }
        return prev.filter((img) => img.id !== id);
      });

      if (currentImage?.id === id) {
        setCurrentImage(images[0] || null);
      }
    },
    [currentImage, images],
  );

  const clearAllImages = useCallback(() => {
    images.forEach((image) => URL.revokeObjectURL(image.url));
    setImages([]);
    setCurrentImage(null);
    setPastePrompt(true);
  }, [images]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString() + " - " + date.toLocaleDateString();
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Clipboard Image Saver</h1>
        <p className="text-muted-foreground">
          Paste images from clipboard and save in various formats
        </p>
      </div>

      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 md:gap-2">
          <TabsTrigger value="paste" className="text-xs sm:text-sm">
            Paste Image
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">
            History ({images.length})
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs sm:text-sm">
            Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="space-y-6">
          {/* Paste Area */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Paste Image from Clipboard
              </CardTitle>
              <CardDescription>
                Copy an image from any source and paste it here using Ctrl+V
                (Cmd+V on Mac)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={pasteAreaRef}
                tabIndex={0}
                className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:hover:border-slate-500"
              >
                {pastePrompt ? (
                  <div className="space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Clipboard className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Press Ctrl+V (Cmd+V) to Paste
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Copy an image from anywhere (browser, screenshot tool,
                        image editor) and paste it here
                      </p>
                    </div>
                  </div>
                ) : currentImage ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <img
                        src={currentImage.url}
                        alt="Clipboard image"
                        className="max-h-96 max-w-full rounded-lg border"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Badge variant="outline">
                        {currentImage.width} × {currentImage.height}
                      </Badge>
                      <Badge variant="outline">
                        {currentImage.format?.toUpperCase() || "IMAGE"}
                      </Badge>
                      <Badge variant="outline">
                        {formatFileSize(currentImage.size)}
                      </Badge>
                    </div>
                  </div>
                ) : null}
              </div>

              {currentImage && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button onClick={() => downloadImage(currentImage)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(currentImage)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentImage(null);
                      setPastePrompt(true);
                    }}
                  >
                    Paste Another
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download Settings */}
          {currentImage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Download Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="output-format">Output Format</Label>
                    <Select
                      value={outputFormat}
                      onValueChange={setOutputFormat}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {outputFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {showQualitySlider && (
                    <div className="space-y-2">
                      <Label>Quality: {quality[0]}%</Label>
                      <Slider
                        value={quality}
                        onValueChange={setQuality}
                        max={100}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Resize Options */}
                <div className="space-y-4">
                  <Label className="text-base">Resize Options</Label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={resizeWidth}
                        onChange={(e) => setResizeWidth(e.target.value)}
                        placeholder="Original"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height">Height (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={resizeHeight}
                        onChange={(e) => setResizeHeight(e.target.value)}
                        placeholder="Original"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="aspect-ratio"
                          checked={maintainAspectRatio}
                          onChange={(e) =>
                            setMaintainAspectRatio(e.target.checked)
                          }
                          className="rounded"
                        />
                        <Label htmlFor="aspect-ratio" className="text-sm">
                          Maintain aspect ratio
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Clipboard History
              </CardTitle>
              <CardDescription>
                All images pasted during this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ImageIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No images in history yet</p>
                  <p className="text-sm">Paste an image to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {images.length} image{images.length !== 1 ? "s" : ""}{" "}
                      saved
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadAllImages}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download All
                      </Button>
                      <Button
                        onClick={clearAllImages}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className={`cursor-pointer space-y-3 rounded-lg border p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          currentImage?.id === image.id
                            ? "border-blue-500 bg-slate-50 dark:bg-slate-800"
                            : ""
                        }`}
                        onClick={() => setCurrentImage(image)}
                      >
                        <div className="aspect-video overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900">
                          <img
                            src={image.url}
                            alt="Clipboard image"
                            className="h-full w-full object-contain"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {image.width} × {image.height}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {image.format?.toUpperCase() || "IMAGE"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {formatFileSize(image.size)}
                            </Badge>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(image.timestamp)}
                          </p>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadImage(image);
                              }}
                              className="flex-1"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(image);
                              }}
                              className="flex-1"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteImage(image.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Getting Started</h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    1. Copy an image from any source (browser, screenshot,
                    editor)
                  </li>
                  <li>
                    2. Click in the paste area or press Ctrl+V (Cmd+V on Mac)
                  </li>
                  <li>3. Choose output format and quality settings</li>
                  <li>4. Optionally resize the image</li>
                  <li>5. Download the image in your preferred format</li>
                </ol>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  All processing happens in your browser. Images are never
                  uploaded to any server. Your clipboard history is cleared when
                  you close this page.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold">Export Options</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Multiple formats (PNG, JPEG, WebP, BMP)</li>
                    <li>• Quality control for lossy formats</li>
                    <li>• Custom dimensions with aspect ratio</li>
                    <li>• Batch download support</li>
                    <li>• Copy back to clipboard</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Clipboard History</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Automatic session history</li>
                    <li>• Quick preview and selection</li>
                    <li>• Individual or batch operations</li>
                    <li>• Timestamp tracking</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Privacy</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 100% client-side processing</li>
                    <li>• No server uploads</li>
                    <li>• No data collection</li>
                    <li>• Session-only storage</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Image Resize</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Custom width and height</li>
                    <li>• Maintain aspect ratio option</li>
                    <li>• Real-time preview</li>
                    <li>• Apply to all downloads</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paste image</span>
                  <Badge variant="outline">Ctrl+V / Cmd+V</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Works globally</span>
                  <Badge variant="outline">From anywhere on page</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • Screenshots (Windows Snipping Tool, macOS screenshots, etc.)
                </p>
                <p>• Images copied from web browsers</p>
                <p>
                  • Images from image editing software (Photoshop, GIMP, etc.)
                </p>
                <p>
                  • Images from office applications (Word, PowerPoint, etc.)
                </p>
                <p>• Images from design tools (Figma, Canva, etc.)</p>
                <p>• Any application that supports image copying</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ToolsWrapper>
  );
}
