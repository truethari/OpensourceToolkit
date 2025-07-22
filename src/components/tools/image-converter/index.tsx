"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  Eye,
  Info,
  Trash2,
  Upload,
  Download,
  Settings,
  Image as ImageIcon,
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

export default function ImageConverter() {
  interface IFile {
    id: number;
    file: File;
    name: string;
    size: number;
    type: string;
    preview: string;
    status: "pending" | "processing" | "success" | "error";
    error?: string; // Optional error message for failed conversions
  }
  interface IResult {
    id: number;
    originalName: string;
    convertedName: string;
    originalSize: number;
    convertedSize: number;
    convertedUrl: string;
    blob: Blob;
    status: "success" | "error";
  }

  const [selectedFiles, setSelectedFiles] = useState<IFile[]>([]);
  const [outputFormat, setOutputFormat] = useState("png");
  const [quality, setQuality] = useState([90]);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [resizeWidth, setResizeWidth] = useState("");
  const [resizeHeight, setResizeHeight] = useState("");
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [convertedImages, setConvertedImages] = useState<IResult[]>([]);
  const [previewImage, setPreviewImage] = useState<IFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef(null);

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
    {
      value: "ico",
      label: "ICO",
      mimeType: "image/x-icon",
      hasQuality: false,
    },
  ];

  const selectedOutputFormat = useMemo(() => {
    return outputFormats.find((f) => f.value === outputFormat);
  }, [outputFormat]);

  const showQualitySlider = useMemo(() => {
    return selectedOutputFormat?.hasQuality;
  }, [selectedOutputFormat]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      const supportedInputFormats = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/svg+xml",
        "image/tiff",
        "image/ico",
      ];

      const validFiles = files.filter((file) => {
        const isValidType = supportedInputFormats.some(
          (format) =>
            file.type === format ||
            file.name.toLowerCase().endsWith(format.split("/")[1]),
        );
        return isValidType && file.size <= 50 * 1024 * 1024; // 50MB limit
      });

      if (validFiles.length !== files.length) {
        alert(
          "Some files were skipped due to unsupported format or size limit (50MB)",
        );
      }

      const newFiles = validFiles.map((file) => ({
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file),
        status: "pending",
      })) as unknown as IFile[];

      setSelectedFiles((prev) => [...prev, ...newFiles]);

      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const removeFile = useCallback((id: number) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const loadImage = (src: string) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const calculateDimensions = (
    originalWidth: number,
    originalHeight: number,
    targetWidth: string,
    targetHeight: string,
  ) => {
    if (!resizeEnabled) {
      return { width: originalWidth, height: originalHeight };
    }

    let width = targetWidth ? parseInt(targetWidth) : originalWidth;
    let height = targetHeight ? parseInt(targetHeight) : originalHeight;

    if (maintainAspectRatio) {
      if (targetWidth && !targetHeight) {
        height = (originalHeight * width) / originalWidth;
      } else if (targetHeight && !targetWidth) {
        width = (originalWidth * height) / originalHeight;
      } else if (targetWidth && targetHeight) {
        const aspectRatio = originalWidth / originalHeight;
        const targetAspectRatio = width / height;

        if (aspectRatio > targetAspectRatio) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }
      }
    }

    return { width: Math.round(width), height: Math.round(height) };
  };

  const convertImage = async (fileData: IFile) => {
    try {
      const img = (await loadImage(fileData.preview)) as HTMLImageElement;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

      // Calculate dimensions
      const { width, height } = calculateDimensions(
        img.naturalWidth,
        img.naturalHeight,
        resizeWidth,
        resizeHeight,
      );

      canvas.width = width;
      canvas.height = height;

      // Handle different background for formats that don't support transparency
      if (outputFormat === "jpeg" || outputFormat === "bmp") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      }

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      return new Promise((resolve) => {
        const qualityValue = showQualitySlider ? quality[0] / 100 : undefined;
        canvas.toBlob(resolve, selectedOutputFormat?.mimeType, qualityValue);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to convert image: ${errorMessage}`);
    }
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one image file");
      return;
    }

    setProcessing(true);
    const results: IResult[] = [];

    try {
      for (const fileData of selectedFiles) {
        try {
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id ? { ...f, status: "processing" } : f,
            ),
          );

          const convertedBlob = (await convertImage(fileData)) as Blob;
          const convertedUrl = URL.createObjectURL(convertedBlob);

          const result: IResult = {
            id: fileData.id,
            originalName: fileData.name,
            convertedName: `${fileData.name.split(".")[0]}.${outputFormat}`,
            originalSize: fileData.size,
            convertedSize: convertedBlob.size,
            convertedUrl,
            blob: convertedBlob,
            status: "success",
          };

          results.push(result);

          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id ? { ...f, status: "success" } : f,
            ),
          );
        } catch (error) {
          console.error("Error converting file:", fileData.name, error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id
                ? { ...f, status: "error", error: errorMessage }
                : f,
            ),
          );
        }
      }

      setConvertedImages(results);
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = (result: IResult) => {
    const link = document.createElement("a");
    link.href = result.convertedUrl;
    link.download = result.convertedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    convertedImages.forEach((result) => {
      setTimeout(() => downloadImage(result), 100);
    });
  };

  const clearAll = () => {
    // Cleanup URLs
    selectedFiles.forEach((file) => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });
    convertedImages.forEach((result) => {
      if (result.convertedUrl) URL.revokeObjectURL(result.convertedUrl);
    });

    setSelectedFiles([]);
    setConvertedImages([]);
    setPreviewImage(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing...</Badge>;
      case "success":
        return (
          <Badge
            variant="default"
            className="border-green-300 bg-green-100 text-green-700"
          >
            Success
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Image Format Converter</h1>
        <p className="text-muted-foreground">
          Convert images between different formats entirely in your browser
        </p>
      </div>

      <Tabs defaultValue="convert" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 md:gap-2">
          <TabsTrigger value="convert" className="text-xs sm:text-sm">
            Convert Images
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            Settings
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs sm:text-sm">
            Format Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="convert" className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Images
              </CardTitle>
              <CardDescription>
                Select one or more images to convert. Supported formats: JPEG,
                PNG, GIF, WebP, BMP, SVG, TIFF, ICO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center transition-colors hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <ImageIcon className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Choose Images
                    </Button>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Or drag and drop images here (max 50MB per file)
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      Selected Images ({selectedFiles.length})
                    </h3>
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {selectedFiles.map((fileData) => (
                      <div
                        key={fileData.id}
                        className="space-y-3 rounded-lg border p-4"
                      >
                        <div className="aspect-video overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          <img
                            src={fileData.preview}
                            alt={fileData.name}
                            className="h-full w-full cursor-pointer object-cover"
                            onClick={() => setPreviewImage(fileData)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p
                              className="truncate text-sm font-medium"
                              title={fileData.name}
                            >
                              {fileData.name}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(fileData.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatFileSize(fileData.size)}</span>
                            <span>
                              {fileData.type.split("/")[1].toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            {getStatusBadge(fileData.status)}
                          </div>

                          {fileData.error && (
                            <p className="text-xs text-red-500">
                              {fileData.error}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Convert Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Conversion Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="output-format">Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="resize-enabled"
                    checked={resizeEnabled}
                    onChange={(e) => setResizeEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="resize-enabled">Resize Images</Label>
                </div>

                {resizeEnabled && (
                  <div className="grid grid-cols-1 gap-4 rounded-lg border bg-slate-50 p-4 dark:bg-slate-800 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={resizeWidth}
                        onChange={(e) => setResizeWidth(e.target.value)}
                        placeholder="Auto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height">Height (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={resizeHeight}
                        onChange={(e) => setResizeHeight(e.target.value)}
                        placeholder="Auto"
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
                )}
              </div>

              <Button
                onClick={handleConvert}
                disabled={selectedFiles.length === 0 || processing}
                className="w-full"
              >
                {processing
                  ? "Converting..."
                  : `Convert ${selectedFiles.length} Image${selectedFiles.length !== 1 ? "s" : ""}`}
              </Button>
            </CardContent>
          </Card>

          {/* Converted Images */}
          {convertedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Converted Images
                </CardTitle>
                <CardDescription>
                  Download your converted images individually or all at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {convertedImages.length} image
                    {convertedImages.length !== 1 ? "s" : ""} converted
                  </span>
                  <Button onClick={downloadAll} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download All
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {convertedImages.map((result) => (
                    <div
                      key={result.id}
                      className="space-y-3 rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {result.convertedName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(result.originalSize)} →{" "}
                            {formatFileSize(result.convertedSize)}
                            {result.convertedSize < result.originalSize && (
                              <span className="ml-1 text-green-600">
                                (-
                                {Math.round(
                                  (1 -
                                    result.convertedSize /
                                      result.originalSize) *
                                    100,
                                )}
                                %)
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setPreviewImage({
                                ...result,
                                preview: result.convertedUrl,
                                name: result.convertedName,
                              } as unknown as IFile)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadImage(result)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Additional options for image conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  All processing happens locally in your browser. No images are
                  uploaded to any server.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-semibold">Quality Settings</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    • JPEG and WebP formats support quality adjustment (1-100%)
                  </p>
                  <p>• PNG and BMP are lossless formats (no quality setting)</p>
                  <p>• Higher quality = larger file size</p>
                  <p>• Recommended: 80-90% for photos, 100% for graphics</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Resize Options</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Specify width, height, or both</p>
                  <p>• Aspect ratio maintained by default</p>
                  <p>• Empty fields will be calculated automatically</p>
                  <p>• Use for thumbnails, web optimization, or print</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Performance</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Maximum file size: 50MB per image</p>
                  <p>• Large images may take longer to process</p>
                  <p>• All processing uses your device&apos;s resources</p>
                  <p>• No internet connection required after page load</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supported Formats</CardTitle>
              <CardDescription>
                Information about input and output image formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-4 font-semibold">Input Formats</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">JPEG/JPG</span>
                      <Badge variant="outline">Lossy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">PNG</span>
                      <Badge variant="outline">Lossless</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">GIF</span>
                      <Badge variant="outline">Animated</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">WebP</span>
                      <Badge variant="outline">Modern</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">BMP</span>
                      <Badge variant="outline">Uncompressed</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">SVG</span>
                      <Badge variant="outline">Vector</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">TIFF</span>
                      <Badge variant="outline">Professional</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">ICO</span>
                      <Badge variant="outline">Icon</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 font-semibold">Output Formats</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">PNG</span>
                        <Badge variant="outline">Lossless</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Best for graphics, logos, transparency
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">JPEG</span>
                        <Badge variant="outline">Lossy</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Best for photos, smaller file sizes
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">WebP</span>
                        <Badge variant="outline">Modern</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Excellent compression, web optimized
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">BMP</span>
                        <Badge variant="outline">Uncompressed</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Large files, maximum compatibility
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">ICO</span>
                        <Badge variant="outline">Icon</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Windows icons, favicons
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <h4 className="mb-4 font-semibold">Format Recommendations</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">For Web Use:</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Photos: JPEG (80-90% quality)</li>
                      <li>• Graphics: PNG or WebP</li>
                      <li>• Icons: ICO or PNG</li>
                      <li>• Modern browsers: WebP</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">
                      For Print/Professional:
                    </h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• High quality: PNG or BMP</li>
                      <li>• Photos: JPEG (95-100% quality)</li>
                      <li>• Logos: PNG with transparency</li>
                      <li>• Archive: Original format</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="max-h-full max-w-4xl overflow-auto rounded-lg bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">{previewImage.name}</h3>
              <Button variant="ghost" onClick={() => setPreviewImage(null)}>
                ✕
              </Button>
            </div>
            <div className="p-4">
              <img
                src={previewImage.preview}
                alt={previewImage.name}
                className="mx-auto max-h-96 max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </ToolsWrapper>
  );
}
