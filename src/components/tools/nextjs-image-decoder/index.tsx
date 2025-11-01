"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Link2,
  Copy,
  Download,
  Settings,
  Info,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface ParsedImageUrl {
  originalUrl: string;
  width?: number;
  quality?: number;
  isValid: boolean;
  baseUrl?: string;
  params?: URLSearchParams;
}

export default function NextJsImageDecoder() {
  const [inputUrl, setInputUrl] = useState("");
  const [parsedData, setParsedData] = useState<ParsedImageUrl | null>(null);
  const [baseImageUrl, setBaseImageUrl] = useState("");
  const [targetWidth, setTargetWidth] = useState("750");
  const [targetQuality, setTargetQuality] = useState("75");
  const [baseDomain, setBaseDomain] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkResults, setBulkResults] = useState<string[]>([]);

  // Parse Next.js image URL
  const parseNextImageUrl = useCallback((url: string): ParsedImageUrl => {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      // Check if it's a Next.js image URL
      if (!urlObj.pathname.includes("/_next/image")) {
        return {
          originalUrl: url,
          isValid: false,
        };
      }

      const originalImageUrl = params.get("url");
      const width = params.get("w");
      const quality = params.get("q");

      if (!originalImageUrl) {
        return {
          originalUrl: url,
          isValid: false,
        };
      }

      return {
        originalUrl: decodeURIComponent(originalImageUrl),
        width: width ? parseInt(width) : undefined,
        quality: quality ? parseInt(quality) : undefined,
        isValid: true,
        baseUrl: urlObj.origin,
        params: params,
      };
    } catch {
      return {
        originalUrl: url,
        isValid: false,
      };
    }
  }, []);

  // Handle URL decode
  const handleDecode = useCallback(() => {
    if (!inputUrl.trim()) {
      toast.error("Please enter a URL to decode");
      return;
    }

    const parsed = parseNextImageUrl(inputUrl);
    setParsedData(parsed);

    if (!parsed.isValid) {
      toast.error("This doesn't appear to be a valid Next.js image URL");
    } else {
      toast.success("URL decoded successfully");
    }
  }, [inputUrl, parseNextImageUrl]);

  // Generate Next.js image URL
  const generateNextImageUrl = useCallback(
    (imageUrl: string, width: number, quality: number, domain?: string) => {
      try {
        const encodedUrl = encodeURIComponent(imageUrl);
        const base = domain || "https://example.com";
        return `${base}/_next/image?url=${encodedUrl}&w=${width}&q=${quality}`;
      } catch {
        return "";
      }
    },
    [],
  );

  // Handle URL encode
  const handleEncode = useCallback(() => {
    if (!baseImageUrl.trim()) {
      toast.error("Please enter an image URL to encode");
      return;
    }

    const width = parseInt(targetWidth) || 750;
    const quality = parseInt(targetQuality) || 75;

    setParsedData({
      originalUrl: baseImageUrl,
      width,
      quality,
      isValid: true,
      baseUrl: baseDomain || "https://example.com",
      params: new URLSearchParams({
        url: baseImageUrl,
        w: width.toString(),
        q: quality.toString(),
      }),
    });

    toast.success("Next.js image URL generated");
  }, [baseImageUrl, targetWidth, targetQuality, baseDomain]);

  // Bulk decode
  const handleBulkDecode = useCallback(() => {
    if (!bulkUrls.trim()) {
      toast.error("Please enter URLs to decode");
      return;
    }

    const urls = bulkUrls.split("\n").filter((u) => u.trim());
    const results = urls.map((url) => {
      const parsed = parseNextImageUrl(url.trim());
      return parsed.isValid ? parsed.originalUrl : `Invalid: ${url}`;
    });

    setBulkResults(results);
    toast.success(`Decoded ${results.length} URLs`);
  }, [bulkUrls, parseNextImageUrl]);

  // Generate multiple sizes
  const commonSizes = useMemo(
    () => [
      { label: "Thumbnail", width: 150 },
      { label: "Small", width: 320 },
      { label: "Medium", width: 640 },
      { label: "Large", width: 750 },
      { label: "XLarge", width: 1080 },
      { label: "2K", width: 2048 },
      { label: "4K", width: 3840 },
    ],
    [],
  );

  const generatedUrls = useMemo(() => {
    if (!baseImageUrl.trim()) return [];

    const quality = parseInt(targetQuality) || 75;
    const domain = baseDomain || "https://example.com";

    return commonSizes.map((size) => ({
      url: generateNextImageUrl(baseImageUrl, size.width, quality, domain),
      width: size.width,
      quality,
      label: size.label,
    }));
  }, [
    baseImageUrl,
    targetQuality,
    baseDomain,
    commonSizes,
    generateNextImageUrl,
  ]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, label: string = "URL") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }, []);

  // Download as JSON
  const downloadAsJson = useCallback(() => {
    if (!parsedData) return;

    const data = {
      parsedUrl: parsedData,
      generatedUrls: generatedUrls,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nextjs-image-urls.json";
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Data exported as JSON");
  }, [parsedData, generatedUrls]);

  // Get Next.js image URL from parsed data
  const getNextImageUrl = useCallback(() => {
    if (!parsedData || !parsedData.isValid) return "";
    return generateNextImageUrl(
      parsedData.originalUrl,
      parsedData.width || 750,
      parsedData.quality || 75,
      parsedData.baseUrl,
    );
  }, [parsedData, generateNextImageUrl]);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Next.js Image URL Decoder</h1>
        <p className="text-muted-foreground">
          Decode and encode Next.js optimized image URLs with ease
        </p>
      </div>

      <Tabs defaultValue="decode" className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-1 md:gap-2">
          <TabsTrigger value="decode" className="text-xs sm:text-sm">
            <Link2 className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            Decode
          </TabsTrigger>
          <TabsTrigger value="encode" className="text-xs sm:text-sm">
            <Zap className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            Encode
          </TabsTrigger>
          <TabsTrigger value="bulk" className="text-xs sm:text-sm">
            <RefreshCw className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            Bulk
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs sm:text-sm">
            <Info className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
            Info
          </TabsTrigger>
        </TabsList>

        {/* Decode Tab */}
        <TabsContent value="decode" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Decode Next.js Image URL
              </CardTitle>
              <CardDescription>
                Extract the original image URL from a Next.js optimized image
                link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="decode-url">Next.js Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="decode-url"
                    placeholder="https://example.com/_next/image?url=...&w=750&q=75"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 font-mono text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleDecode();
                      }
                    }}
                  />
                  <Button onClick={handleDecode}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Decode
                  </Button>
                </div>
              </div>

              {parsedData && parsedData.isValid && (
                <div className="space-y-4 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Decoded Successfully</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Original Image URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={parsedData.originalUrl}
                          readOnly
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              parsedData.originalUrl,
                              "Original URL",
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(parsedData.originalUrl, "_blank")
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                          Width
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-base">
                            {parsedData.width || "N/A"} px
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                          Quality
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-base">
                            {parsedData.quality || "N/A"}%
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                          Base Domain
                        </Label>
                        <Input
                          value={parsedData.baseUrl || "N/A"}
                          readOnly
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          copyToClipboard(
                            parsedData.originalUrl,
                            "Original URL",
                          )
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Original URL
                      </Button>
                      <Button variant="outline" onClick={downloadAsJson}>
                        <Download className="mr-2 h-4 w-4" />
                        Export JSON
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {parsedData && !parsedData.isValid && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span>Invalid or non-Next.js image URL</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Encode Tab */}
        <TabsContent value="encode" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Generate Next.js Image URL
              </CardTitle>
              <CardDescription>
                Create optimized Next.js image URLs with custom parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="base-url">Original Image URL</Label>
                <Input
                  id="base-url"
                  placeholder="https://cdn.example.com/image.jpg"
                  value={baseImageUrl}
                  onChange={(e) => setBaseImageUrl(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Base Domain (Optional)</Label>
                <Input
                  id="domain"
                  placeholder="https://example.com (leave empty for default)"
                  value={baseDomain}
                  onChange={(e) => setBaseDomain(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (pixels)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="750"
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality">Quality (1-100)</Label>
                  <Input
                    id="quality"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="75"
                    value={targetQuality}
                    onChange={(e) => setTargetQuality(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleEncode} className="w-full" size="lg">
                <Settings className="mr-2 h-4 w-4" />
                Generate Next.js Image URL
              </Button>
            </CardContent>
          </Card>

          {parsedData && parsedData.isValid && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Generated Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Next.js Image URL
                  </Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={getNextImageUrl()}
                      readOnly
                      className="flex-1 font-mono text-sm"
                      rows={3}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(getNextImageUrl(), "Generated URL")
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {generatedUrls.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Common Sizes (Click to Copy)
                    </Label>
                    <div className="space-y-2">
                      {generatedUrls.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900"
                        >
                          <Badge variant="outline" className="min-w-[90px]">
                            {item.label}
                          </Badge>
                          <span className="min-w-[70px] text-xs text-muted-foreground">
                            {item.width}px
                          </span>
                          <Input
                            value={item.url}
                            readOnly
                            className="h-9 flex-1 font-mono text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(item.url, `${item.label} URL`)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bulk Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Bulk Decode URLs
              </CardTitle>
              <CardDescription>
                Decode multiple Next.js image URLs at once (one per line)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-urls">
                  Next.js Image URLs (one per line)
                </Label>
                <Textarea
                  id="bulk-urls"
                  placeholder="https://example.com/_next/image?url=...&#10;https://example.com/_next/image?url=..."
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <Button onClick={handleBulkDecode} className="w-full" size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Decode All URLs
              </Button>

              {bulkResults.length > 0 && (
                <div className="space-y-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Decoded URLs ({bulkResults.length})
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(bulkResults.join("\n"), "All URLs")
                      }
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      Copy All
                    </Button>
                  </div>
                  <Textarea
                    value={bulkResults.join("\n")}
                    readOnly
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About Next.js Image URLs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">What is this tool?</h3>
                <p className="leading-relaxed text-muted-foreground">
                  This tool decodes and encodes Next.js optimized image URLs.
                  Next.js uses the{" "}
                  <code className="rounded bg-slate-200 px-1.5 py-0.5 text-sm dark:bg-slate-800">
                    /_next/image
                  </code>{" "}
                  endpoint to automatically optimize images with parameters like
                  width and quality.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">URL Structure</h3>
                <p className="mb-3 text-muted-foreground">
                  A typical Next.js image URL looks like:
                </p>
                <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-900">
                  <code className="break-all text-xs text-slate-700 dark:text-slate-300">
                    https://example.com/_next/image?url=&lt;encoded-image-url&gt;&w=&lt;width&gt;&q=&lt;quality&gt;
                  </code>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Parameters</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <Badge variant="outline">url</Badge>
                    <span>URL-encoded original image location</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge variant="outline">w</Badge>
                    <span>Target width in pixels</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge variant="outline">q</Badge>
                    <span>Quality from 1-100 (default: 75)</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Common Widths</h3>
                <p className="text-muted-foreground">
                  Next.js typically uses these device sizes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[640, 750, 828, 1080, 1200, 1920, 2048, 3840].map((w) => (
                    <Badge key={w} variant="secondary">
                      {w}px
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Features</h3>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>
                    Decode Next.js image URLs to get original image source
                  </li>
                  <li>Generate Next.js image URLs with custom parameters</li>
                  <li>Bulk decode multiple URLs at once</li>
                  <li>Generate multiple sizes from a single image</li>
                  <li>Export data as JSON</li>
                  <li>Copy URLs to clipboard</li>
                  <li>Open original images in new tabs</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Use Cases</h3>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Extract original image URLs from Next.js sites</li>
                  <li>Generate optimized image URLs for Next.js projects</li>
                  <li>Create responsive image sets with different sizes</li>
                  <li>Debug image optimization issues</li>
                  <li>Batch process image URLs</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ToolsWrapper>
  );
}
