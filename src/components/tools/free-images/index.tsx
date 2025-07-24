"use client";

import Image from "next/image";
import { toast } from "sonner";
import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  X,
  List,
  Info,
  Copy,
  Grid,
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "id" | "width" | "height" | "ratio" | "size"
  >("id");
  const [filterBy, setFilterBy] = useState<
    "all" | "landscape" | "portrait" | "square"
  >("all");
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [imagesPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  // Intersection Observer for lazy loading
  const imageRef = useCallback(
    (node: HTMLDivElement | null, imageId: string) => {
      if (!node) return;

      // Create a new observer for each image
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleImages((prev) => new Set([...prev, imageId]));
              observer.unobserve(entry.target);
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: "100px",
          threshold: 0.1,
        },
      );

      observer.observe(node);

      // Store cleanup function
      return () => {
        observer.disconnect();
      };
    },
    [],
  );

  // Cleanup observer
  useEffect(() => {
    const currentObserver = observerRef.current;
    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, []);

  const copyToClipboard = async (
    text: string,
    item: string,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    e?.preventDefault();

    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      toast.success("URL copied to clipboard!", {
        description: text,
        duration: 2000,
      });
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy URL", {
        description: "Please try again",
        duration: 3000,
      });
    }
  };

  const downloadImage = async (image: ImageInfo, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();

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
      toast.error("Failed to download image", {
        description: "Please try again",
        id: `download-${image.id}`,
      });
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

  // Paginated images for better performance
  const paginatedImages = useMemo(() => {
    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    return filteredAndSortedImages.slice(0, endIndex);
  }, [filteredAndSortedImages, currentPage, imagesPerPage]);

  const totalPages = Math.ceil(filteredAndSortedImages.length / imagesPerPage);
  const hasMoreImages = currentPage < totalPages;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, filterBy]);

  // Load first few images immediately for better UX
  useEffect(() => {
    if (paginatedImages.length > 0) {
      const firstImages = paginatedImages.slice(0, 4).map((img) => img.id);
      const firstListImages = paginatedImages
        .slice(0, 4)
        .map((img) => `list-${img.id}`);
      setVisibleImages(
        (prev) => new Set([...prev, ...firstImages, ...firstListImages]),
      );
    }
  }, [paginatedImages]);

  // Fallback: Load all visible images after 2 seconds if intersection observer isn't working
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (paginatedImages.length > 0) {
        const allImageIds = paginatedImages.map((img) => img.id);
        const allListIds = paginatedImages.map((img) => `list-${img.id}`);
        setVisibleImages(new Set([...allImageIds, ...allListIds]));
      }
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, [paginatedImages]);

  // Load more images when scrolling near bottom
  const loadMoreImages = useCallback(() => {
    if (hasMoreImages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMoreImages]);

  // Infinite scroll effect
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

  const ImageCard = ({ image }: { image: ImageInfo }) => {
    const { ratio, megapixels, sizeInMB } = getImageInfo(image);

    return (
      <Card className="overflow-hidden">
        <div
          className="relative aspect-video cursor-pointer overflow-hidden"
          onClick={() => setSelectedImage(image)}
        >
          <div ref={(node) => imageRef(node, image.id)}>
            {visibleImages.has(image.id) ? (
              <Image
                src={image.url}
                alt={`Free image ${image.id}`}
                width={image.width}
                height={image.height}
                className="h-full w-full object-cover"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
            ) : (
              <div className="flex h-full w-full animate-pulse flex-col items-center justify-center gap-2 bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Loading...
                </span>
              </div>
            )}
          </div>
        </div>

        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">{image.id}</h3>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span>
                  {image.width}×{image.height}
                </span>
                <span>•</span>
                <span>{megapixels}MP</span>
                <span>•</span>
                <span>{sizeInMB}MB</span>
                <span>•</span>
                <span>{ratio}:1</span>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {getImageRatio(image)}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                console.log("Copy button clicked");
                copyToClipboard(image.url, `url-${image.id}`, e);
              }}
              className="flex items-center gap-2"
            >
              {copiedItem === `url-${image.id}` ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              Copy URL
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                console.log("Open button clicked");
                e.stopPropagation();
                e.preventDefault();
                window.open(image.url, "_blank");
                toast.success("Image opened in new tab!");
              }}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                console.log("Download button clicked");
                downloadImage(image, e);
              }}
              className="flex items-center gap-2"
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ImageListItem = ({ image }: { image: ImageInfo }) => {
    const { ratio, megapixels, sizeInMB } = getImageInfo(image);

    return (
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg">
            <div ref={(node) => imageRef(node, `list-${image.id}`)}>
              {visibleImages.has(`list-${image.id}`) ? (
                <Image
                  src={image.url}
                  alt={`Free image ${image.id}`}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full w-full animate-pulse items-center justify-center bg-muted">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{image.id}</h3>
              <Badge variant="outline" className="capitalize">
                {getImageRatio(image)}
              </Badge>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                Dimensions: {image.width}×{image.height}
              </span>
              <span>Resolution: {megapixels}MP</span>
              <span>Size: {sizeInMB}MB</span>
              <span>Ratio: {ratio}:1</span>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) =>
                  copyToClipboard(image.url, `url-${image.id}`, e)
                }
                className="flex items-center gap-2"
              >
                {copiedItem === `url-${image.id}` ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy URL
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => downloadImage(image, e)}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(image.url, "_blank");
                  toast.success("Image opened in new tab!");
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Free Images Collection</h1>
        <p className="text-muted-foreground">
          Browse, download, and use high-quality free images for your projects
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search images by filename or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm">View:</Label>
              <div className="flex rounded-lg border">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Filter:</Label>
              <Select
                value={filterBy}
                onValueChange={(value) => setFilterBy(value as typeof filterBy)}
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
              <Label className="text-sm">Sort by:</Label>
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
                  <SelectItem value="ratio">Aspect Ratio</SelectItem>
                  <SelectItem value="size">File Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>{filteredAndSortedImages.length} images found</span>
              <span>•</span>
              <span>Showing {paginatedImages.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid/List */}
      {filteredAndSortedImages.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No images found matching your search criteria.
          </AlertDescription>
        </Alert>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-4"
          }
        >
          {paginatedImages.map((image) =>
            viewMode === "grid" ? (
              <ImageCard key={image.id} image={image} />
            ) : (
              <ImageListItem key={image.id} image={image} />
            ),
          )}
        </div>
      )}

      {/* Loading indicator */}
      {hasMoreImages && (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Loading more images...</span>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Dialog */}
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
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    priority
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
                  <div>
                    <Label>Orientation</Label>
                    <p className="capitalize">{getImageRatio(selectedImage)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={(e) =>
                      copyToClipboard(
                        selectedImage.url,
                        `preview-${selectedImage.id}`,
                        e,
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    {copiedItem === `preview-${selectedImage.id}` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copy URL
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => downloadImage(selectedImage, e)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
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

      {/* Info Card */}
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
                <li>• Favorite management</li>
                <li>• Search and filter options</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Usage</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Click images to preview</li>
                <li>• Use Copy URL for web projects</li>
                <li>• Download for offline use</li>
                <li>• Share with team members</li>
                <li>• Add to favorites for quick access</li>
                <li>• Filter by orientation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
