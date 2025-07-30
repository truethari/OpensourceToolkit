"use client";

import Image from "next/image";
import { toast } from "sonner";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  X,
  Info,
  Copy,
  Check,
  Search,
  Filter,
  Download,
  ImageIcon,
  ExternalLink,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";
import imagesData from "./images.json";

interface ImageInfo {
  id: string;
  width: number;
  height: number;
  url: string;
  size: number;
}

export default function FreeImages() {
  const [images] = useState<ImageInfo[]>(imagesData);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "id" | "width" | "height" | "ratio" | "size"
  >("id");
  const [filterBy, setFilterBy] = useState<
    "all" | "landscape" | "portrait" | "square"
  >("all");
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [imagesPerPage] = useState(12);

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      toast.success("URL copied to clipboard!");
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy URL");
    }
  };

  const downloadImage = async (image: ImageInfo) => {
    try {
      toast.loading("Downloading image...", { id: `download-${image.id}` });
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = image.id;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully!", {
        id: `download-${image.id}`,
      });
    } catch (err) {
      console.error("Failed to download image: ", err);
      toast.error("Failed to download image");
    }
  };

  const getImageRatio = (image: ImageInfo) => {
    const ratio = image.width / image.height;
    if (ratio > 1.3) return "landscape";
    if (ratio < 0.8) return "portrait";
    return "square";
  };

  const getImageInfo = (image: ImageInfo) => {
    const ratio = (image.width / image.height).toFixed(2);
    const megapixels = ((image.width * image.height) / 1000000).toFixed(1);
    const sizeInMB = (image.size / (1024 * 1024)).toFixed(1);
    return { ratio, megapixels, sizeInMB };
  };

  const filteredAndSortedImages = useMemo(() => {
    const filtered = images.filter((image) => {
      const matchesSearch =
        image.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.url.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterBy === "all" || getImageRatio(image) === filterBy;

      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "width":
          return b.width - a.width;
        case "height":
          return b.height - a.height;
        case "ratio":
          return b.width / b.height - a.width / a.height;
        case "size":
          return b.size - a.size;
        case "id":
        default:
          return a.id.localeCompare(b.id);
      }
    });

    return filtered;
  }, [images, searchTerm, sortBy, filterBy]);

  const paginatedImages = useMemo(() => {
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    return filteredAndSortedImages.slice(0, endIndex);
  }, [filteredAndSortedImages, currentPage, imagesPerPage]);

  const hasMoreImages =
    currentPage * imagesPerPage < filteredAndSortedImages.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, filterBy]);

  const loadMoreImages = useCallback(() => {
    if (hasMoreImages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMoreImages]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreImages();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreImages]);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Free Images Collection</h1>
        <p className="text-muted-foreground">
          Browse, download, and use high-quality free images for your projects
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Filter:</Label>
                <Select
                  value={filterBy}
                  onValueChange={(value) =>
                    setFilterBy(value as typeof filterBy)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm">Sort:</Label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as typeof sortBy)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">Filename</SelectItem>
                    <SelectItem value="width">Width</SelectItem>
                    <SelectItem value="height">Height</SelectItem>
                    <SelectItem value="ratio">Ratio</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            <span>{filteredAndSortedImages.length} images found</span>
            <span>•</span>
            <span>Showing {paginatedImages.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      {filteredAndSortedImages.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No images found matching your search criteria.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {paginatedImages.map((image) => {
            const { megapixels, sizeInMB } = getImageInfo(image);

            return (
              <div
                key={image.id}
                className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image */}
                <div
                  className="relative aspect-video cursor-pointer bg-muted"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image.url}
                    alt={`Free image ${image.id}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className="absolute right-2 top-2">
                    <Badge variant="secondary" className="text-xs">
                      {getImageRatio(image)}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 p-3">
                  <h3 className="truncate text-sm font-medium">{image.id}</h3>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>
                      {image.width}×{image.height}
                    </span>
                    <span>•</span>
                    <span>{megapixels}MP</span>
                    <span>•</span>
                    <span>{sizeInMB}MB</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(image.url, `copy-${image.id}`);
                      }}
                    >
                      {copiedItem === `copy-${image.id}` ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(image.url, "_blank");
                        toast.success("Image opened in new tab!");
                      }}
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(image);
                      }}
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {hasMoreImages && (
        <div className="flex justify-center py-8">
          <Button onClick={loadMoreImages} variant="outline">
            Load More Images
          </Button>
        </div>
      )}

      {/* Image Preview Modal */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedImage.id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-lg">
                  <Image
                    src={selectedImage.url}
                    alt={`Free image ${selectedImage.id}`}
                    width={selectedImage.width}
                    height={selectedImage.height}
                    className="h-auto max-h-96 w-full object-contain"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Dimensions</Label>
                    <p className="font-mono">
                      {selectedImage.width}×{selectedImage.height}
                    </p>
                  </div>
                  <div>
                    <Label>Aspect Ratio</Label>
                    <p className="font-mono">
                      {getImageInfo(selectedImage).ratio}:1
                    </p>
                  </div>
                  <div>
                    <Label>Resolution</Label>
                    <p className="font-mono">
                      {getImageInfo(selectedImage).megapixels}MP
                    </p>
                  </div>
                  <div>
                    <Label>File Size</Label>
                    <p className="font-mono">
                      {getImageInfo(selectedImage).sizeInMB}MB
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      copyToClipboard(
                        selectedImage.url,
                        `modal-${selectedImage.id}`,
                      );
                    }}
                    className="flex items-center gap-2"
                  >
                    {copiedItem === `modal-${selectedImage.id}` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadImage(selectedImage)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(selectedImage.url, "_blank");
                      toast.success("Image opened in new tab!");
                    }}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Cards */}
      <Card>
        <CardHeader>
          <CardTitle>About These Images</CardTitle>
          <CardDescription>
            Free high-quality images for your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• High-resolution images</li>
                <li>• Multiple formats and sizes</li>
                <li>• Easy download and sharing</li>
                <li>• Copy URLs with one click</li>
                <li>• Search and filter options</li>
                <li>• Preview before download</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Usage</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Click images to preview</li>
                <li>• Use Copy URL for web projects</li>
                <li>• Download for offline use</li>
                <li>• Share with team members</li>
                <li>• Filter by orientation</li>
                <li>• Sort by various criteria</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copyright Card */}
      <Card>
        <CardHeader>
          <CardTitle>Copyright & Attribution</CardTitle>
          <CardDescription>
            These images are sourced from copyright-free websites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-semibold text-foreground">
              📝 Important Note
            </h4>
            <p className="text-sm text-muted-foreground">
              All images in this collection are sourced from reputable
              copyright-free websites that provide images under Creative Commons
              licenses or are in the public domain. These images are free to use
              for personal and commercial projects without attribution
              requirements, though attribution is always appreciated.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-3 font-semibold">🌟 Recommended Sources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://unsplash.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    • Unsplash
                  </a>
                  <span className="text-muted-foreground">
                    {" "}
                    - Beautiful free photos
                  </span>
                </li>
                <li>
                  <a
                    href="https://pixabay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    • Pixabay
                  </a>
                  <span className="text-muted-foreground">
                    {" "}
                    - Free images & vectors
                  </span>
                </li>
                <li>
                  <a
                    href="https://pexels.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    • Pexels
                  </a>
                  <span className="text-muted-foreground">
                    {" "}
                    - Free stock photos
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">🙏 Special Thanks</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  We extend our heartfelt gratitude to the amazing photographers
                  and creators who contribute their work to the public domain
                  and Creative Commons.
                </p>
                <ul className="ml-1 space-y-1">
                  <li>• All photographers on free image platforms</li>
                  <li>• Creative Commons contributors</li>
                  <li>• Open source image communities</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
