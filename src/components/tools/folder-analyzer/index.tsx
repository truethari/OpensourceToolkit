"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Eye,
  File,
  Code,
  Info,
  Copy,
  Check,
  Music,
  Video,
  Folder,
  Search,
  Filter,
  Archive,
  Settings,
  FileText,
  Download,
  TreePine,
  Database,
  BarChart3,
  FolderOpen,
  Image as ImageIco,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface FileItem {
  name: string;
  type: "file" | "directory";
  size: number;
  lastModified: number;
  path: string;
  extension?: string;
  children?: FileItem[];
}

interface FileStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  largestFiles: FileItem[];
  deepestPath: string;
  maxDepth: number;
}

export default function FolderStructureAnalyzer() {
  const [folderStructure, setFolderStructure] = useState<FileItem | null>(null);
  const [filteredStructure, setFilteredStructure] = useState<FileItem | null>(
    null,
  );
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("json");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [minFileSize, setMinFileSize] = useState<number>(0);
  const [maxDepth, setMaxDepth] = useState<number>(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileTypeIcons = {
    image: <ImageIco className="h-4 w-4 text-green-500" />,
    video: <Video className="h-4 w-4 text-purple-500" />,
    audio: <Music className="h-4 w-4 text-blue-500" />,
    document: <FileText className="h-4 w-4 text-orange-500" />,
    code: <Code className="h-4 w-4 text-red-500" />,
    archive: <Archive className="h-4 w-4 text-yellow-500" />,
    database: <Database className="h-4 w-4 text-indigo-500" />,
    other: <File className="h-4 w-4 text-gray-500" />,
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";

    const imageExts = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "svg",
      "webp",
      "tiff",
    ];
    const videoExts = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v"];
    const audioExts = ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"];
    const documentExts = [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "rtf",
    ];
    const codeExts = [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "cs",
      "php",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
    ];
    const archiveExts = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"];
    const databaseExts = ["db", "sqlite", "mdb", "sql"];

    if (imageExts.includes(ext)) return "image";
    if (videoExts.includes(ext)) return "video";
    if (audioExts.includes(ext)) return "audio";
    if (documentExts.includes(ext)) return "document";
    if (codeExts.includes(ext)) return "code";
    if (archiveExts.includes(ext)) return "archive";
    if (databaseExts.includes(ext)) return "database";
    return "other";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const processFiles = async (files: FileList): Promise<FileItem> => {
    const fileArray = Array.from(files);
    const root: FileItem = {
      name: "Selected Folder",
      type: "directory",
      size: 0,
      lastModified: Date.now(),
      path: "/",
      children: [],
    };

    const pathMap = new Map<string, FileItem>();
    pathMap.set("/", root);

    // Sort files by path to ensure proper hierarchy
    fileArray.sort((a, b) =>
      a.webkitRelativePath.localeCompare(b.webkitRelativePath),
    );

    for (const file of fileArray) {
      const pathParts = file.webkitRelativePath.split("/");
      let currentPath = "";
      let currentParent = root;

      // Create directory structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath += "/" + pathParts[i];

        if (!pathMap.has(currentPath)) {
          const dirItem: FileItem = {
            name: pathParts[i],
            type: "directory",
            size: 0,
            lastModified: Date.now(),
            path: currentPath,
            children: [],
          };

          currentParent.children!.push(dirItem);
          pathMap.set(currentPath, dirItem);
        }

        currentParent = pathMap.get(currentPath)!;
      }

      // Add file
      const fileName = pathParts[pathParts.length - 1];
      const filePath = currentPath + "/" + fileName;
      const fileItem: FileItem = {
        name: fileName,
        type: "file",
        size: file.size,
        lastModified: file.lastModified,
        path: filePath,
        extension: fileName.split(".").pop()?.toLowerCase(),
      };

      currentParent.children!.push(fileItem);
    }

    return root;
  };

  const calculateStats = (structure: FileItem): FileStats => {
    let totalFiles = 0;
    let totalFolders = 0;
    let totalSize = 0;
    const fileTypes: Record<string, number> = {};
    const largestFiles: FileItem[] = [];
    let deepestPath = "";
    let maxDepth = 0;

    const traverse = (item: FileItem, depth: number = 0) => {
      if (depth > maxDepth) {
        maxDepth = depth;
        deepestPath = item.path;
      }

      if (item.type === "file") {
        totalFiles++;
        totalSize += item.size;

        const fileType = getFileType(item.name);
        fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;

        largestFiles.push(item);
      } else {
        totalFolders++;
        if (item.children) {
          item.children.forEach((child) => traverse(child, depth + 1));
        }
      }
    };

    traverse(structure);

    // Sort and keep only top 10 largest files
    largestFiles.sort((a, b) => b.size - a.size);
    largestFiles.splice(10);

    return {
      totalFiles,
      totalFolders,
      totalSize,
      fileTypes,
      largestFiles,
      deepestPath,
      maxDepth,
    };
  };

  const filterStructure = (
    structure: FileItem,
    query: string,
    fileType: string,
    minSize: number,
  ): FileItem => {
    const filtered: FileItem = {
      ...structure,
      children: [],
    };

    const shouldIncludeFile = (item: FileItem): boolean => {
      if (item.type === "file") {
        const matchesSearch =
          query === "" || item.name.toLowerCase().includes(query.toLowerCase());
        const matchesType =
          fileType === "all" || getFileType(item.name) === fileType;
        const matchesSize = item.size >= minSize;
        return matchesSearch && matchesType && matchesSize;
      }
      return true;
    };

    const traverse = (source: FileItem, target: FileItem): boolean => {
      let hasValidChildren = false;

      if (source.children) {
        for (const child of source.children) {
          if (child.type === "file") {
            if (shouldIncludeFile(child)) {
              target.children!.push({ ...child });
              hasValidChildren = true;
            }
          } else {
            const childDir: FileItem = {
              ...child,
              children: [],
            };

            if (traverse(child, childDir)) {
              target.children!.push(childDir);
              hasValidChildren = true;
            }
          }
        }
      }

      return hasValidChildren;
    };

    traverse(structure, filtered);
    return filtered;
  };

  const handleFolderSelect = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsAnalyzing(true);
    try {
      const structure = await processFiles(files);
      setFolderStructure(structure);
      setFilteredStructure(structure);
      setStats(calculateStats(structure));
      setExpandedFolders(new Set(["/"])); // Expand root by default
    } catch (error) {
      console.error("Error processing files:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyFilters = useCallback(() => {
    if (!folderStructure) return;

    const filtered = filterStructure(
      folderStructure,
      searchQuery,
      fileTypeFilter,
      minFileSize,
    );
    setFilteredStructure(filtered);
  }, [folderStructure, searchQuery, fileTypeFilter, minFileSize]);

  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const exportStructure = (format: string) => {
    if (!filteredStructure) return;

    let content = "";
    let filename = "";
    let mimeType = "";

    switch (format) {
      case "json":
        content = JSON.stringify(filteredStructure, null, 2);
        filename = "folder-structure.json";
        mimeType = "application/json";
        break;

      case "txt":
        content = generateTextStructure(filteredStructure);
        filename = "folder-structure.txt";
        mimeType = "text/plain";
        break;

      case "csv":
        content = generateCSVStructure(filteredStructure);
        filename = "folder-structure.csv";
        mimeType = "text/csv";
        break;

      case "xml":
        content = generateXMLStructure(filteredStructure);
        filename = "folder-structure.xml";
        mimeType = "application/xml";
        break;

      case "markdown":
        content = generateMarkdownStructure(filteredStructure);
        filename = "folder-structure.md";
        mimeType = "text/markdown";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateTextStructure = (structure: FileItem, indent = 0): string => {
    const prefix = "  ".repeat(indent);
    let result = `${prefix}${structure.type === "directory" ? "📁" : "📄"} ${structure.name}`;

    if (structure.type === "file") {
      result += ` (${formatFileSize(structure.size)})`;
    }

    result += "\n";

    if (structure.children) {
      structure.children.forEach((child) => {
        result += generateTextStructure(child, indent + 1);
      });
    }

    return result;
  };

  const generateCSVStructure = (structure: FileItem): string => {
    let csv = "Name,Type,Size,Path,Extension,LastModified\n";

    const traverse = (item: FileItem) => {
      csv += `"${item.name}","${item.type}","${item.size}","${item.path}","${item.extension || ""}","${new Date(item.lastModified).toISOString()}"\n`;

      if (item.children) {
        item.children.forEach(traverse);
      }
    };

    traverse(structure);
    return csv;
  };

  const generateXMLStructure = (structure: FileItem): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<folder-structure>\n';

    const traverse = (item: FileItem, indent = 1) => {
      const spaces = "  ".repeat(indent);
      xml += `${spaces}<${item.type} name="${item.name}" size="${item.size}" path="${item.path}"`;

      if (item.extension) {
        xml += ` extension="${item.extension}"`;
      }

      if (item.children && item.children.length > 0) {
        xml += ">\n";
        item.children.forEach((child) => traverse(child, indent + 1));
        xml += `${spaces}</${item.type}>\n`;
      } else {
        xml += "/>\n";
      }
    };

    traverse(structure);
    xml += "</folder-structure>";
    return xml;
  };

  const generateMarkdownStructure = (
    structure: FileItem,
    indent = 0,
  ): string => {
    const prefix = "  ".repeat(indent);
    let result = `${prefix}- ${structure.type === "directory" ? "📁" : "📄"} **${structure.name}**`;

    if (structure.type === "file") {
      result += ` _(${formatFileSize(structure.size)})_`;
    }

    result += "\n";

    if (structure.children) {
      structure.children.forEach((child) => {
        result += generateMarkdownStructure(child, indent + 1);
      });
    }

    return result;
  };

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const renderFileTree = (item: FileItem, depth = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(item.path);
    const hasChildren = item.children && item.children.length > 0;

    if (depth > maxDepth) return null;

    return (
      <div key={item.path} className="select-none">
        <div
          className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted ${
            item.type === "directory" ? "font-medium" : ""
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => item.type === "directory" && toggleFolder(item.path)}
        >
          {item.type === "directory" ? (
            hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )
            ) : (
              <Folder className="h-4 w-4 text-gray-400" />
            )
          ) : (
            fileTypeIcons[
              getFileType(item.name) as keyof typeof fileTypeIcons
            ] || <File className="h-4 w-4 text-gray-400" />
          )}

          <span className="flex-1 truncate">{item.name}</span>

          {item.type === "file" && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(item.size)}
            </span>
          )}

          <Badge variant="outline" className="text-xs">
            {getFileType(item.name)}
          </Badge>
        </div>

        {item.type === "directory" && isExpanded && hasChildren && (
          <div>
            {item.children!.map((child) => renderFileTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Folder Structure Analyzer</h1>
        <p className="text-muted-foreground">
          Analyze, visualize, and export folder structures with advanced
          filtering and statistics
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select Folder
          </CardTitle>
          <CardDescription>
            Choose a folder to analyze its complete structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleFolderSelect}
              className="w-full"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Settings className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Select Folder
                </>
              )}
            </Button>

            <input
              ref={(node) => {
                if (node) {
                  node.webkitdirectory = true;
                  node.setAttribute("directory", "");
                }
                fileInputRef.current = node;
              }}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This tool analyzes folder structures locally in your browser. No
                files are uploaded to any server.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {folderStructure && (
        <Tabs defaultValue="tree" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="tree">Tree View</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
          </TabsList>

          <TabsContent value="tree" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5" />
                  Folder Structure
                </CardTitle>
                <CardDescription>
                  Interactive folder tree with file type indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedFolders(
                          new Set([
                            ...expandedFolders,
                            ...getAllPaths(filteredStructure!),
                          ]),
                        )
                      }
                    >
                      Expand All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedFolders(new Set(["/"]))}
                    >
                      Collapse All
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-auto rounded-lg border bg-muted/20">
                    {filteredStructure && renderFileTree(filteredStructure)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Folder Statistics
                </CardTitle>
                <CardDescription>
                  Detailed analysis of your folder structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="rounded-lg bg-muted p-4 text-center">
                        <div className="text-2xl font-bold">
                          {stats.totalFiles}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Files
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted p-4 text-center">
                        <div className="text-2xl font-bold">
                          {stats.totalFolders}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Folders
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted p-4 text-center">
                        <div className="text-2xl font-bold">
                          {formatFileSize(stats.totalSize)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Size
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted p-4 text-center">
                        <div className="text-2xl font-bold">
                          {stats.maxDepth}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Max Depth
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="mb-4 font-semibold">
                          File Types Distribution
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(stats.fileTypes).map(
                            ([type, count]) => (
                              <div
                                key={type}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  {
                                    fileTypeIcons[
                                      type as keyof typeof fileTypeIcons
                                    ]
                                  }
                                  <span className="capitalize">{type}</span>
                                </div>
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-4 font-semibold">Largest Files</h4>
                        <div className="space-y-2">
                          {stats.largestFiles.slice(0, 5).map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                {fileTypeIcons[
                                  getFileType(
                                    file.name,
                                  ) as keyof typeof fileTypeIcons
                                ] || <File className="h-4 w-4 text-gray-400" />}
                                <span className="truncate">{file.name}</span>
                              </div>
                              <span className="ml-2 text-muted-foreground">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 font-semibold">Deepest Path</h4>
                      <div className="flex items-center gap-2">
                        <Input
                          value={stats.deepestPath}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(stats.deepestPath, "deepest-path")
                          }
                        >
                          {copiedItem === "deepest-path" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Structure
                </CardTitle>
                <CardDescription>
                  Download folder structure in various formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="export-format">Export Format</Label>
                    <Select
                      value={selectedFormat}
                      onValueChange={setSelectedFormat}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">
                          JSON - Structured data
                        </SelectItem>
                        <SelectItem value="txt">TXT - Tree view</SelectItem>
                        <SelectItem value="csv">
                          CSV - Spreadsheet format
                        </SelectItem>
                        <SelectItem value="xml">XML - Markup format</SelectItem>
                        <SelectItem value="markdown">
                          Markdown - Documentation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => exportStructure(selectedFormat)}
                    className="w-full"
                    disabled={!filteredStructure}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export as {selectedFormat.toUpperCase()}
                  </Button>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportStructure("json")}
                    >
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportStructure("csv")}
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportStructure("txt")}
                    >
                      TXT
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Options
                </CardTitle>
                <CardDescription>
                  Filter files and folders by various criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Files</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by filename..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-type">File Type</Label>
                    <Select
                      value={fileTypeFilter}
                      onValueChange={setFileTypeFilter}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="archive">Archives</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-size">Min File Size (KB)</Label>
                    <Input
                      id="min-size"
                      type="number"
                      placeholder="0"
                      value={minFileSize}
                      onChange={(e) =>
                        setMinFileSize(Number(e.target.value) * 1024)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-depth">Max Tree Depth</Label>
                    <Input
                      id="max-depth"
                      type="number"
                      placeholder="10"
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(Number(e.target.value))}
                      min="1"
                      max="50"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFileTypeFilter("all");
                      setMinFileSize(0);
                      setMaxDepth(10);
                    }}
                  >
                    Clear Filters
                  </Button>

                  <Badge variant="secondary">
                    {filteredStructure ? countFiles(filteredStructure) : 0}{" "}
                    files shown
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Filters</CardTitle>
                <CardDescription>
                  Predefined filters for common use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFileTypeFilter("image");
                      setSearchQuery("");
                    }}
                  >
                    <ImageIco className="mr-2 h-4 w-4" />
                    Images Only
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFileTypeFilter("code");
                      setSearchQuery("");
                    }}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Code Files
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFileTypeFilter("all");
                      setMinFileSize(1024 * 1024); // 1MB
                    }}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Large Files
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFileTypeFilter("document");
                      setSearchQuery("");
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Feature Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Key Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>Interactive folder tree visualization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Advanced filtering by type, size, and name</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Export in multiple formats (JSON, CSV, XML, etc.)</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Detailed statistics and file analysis</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Supported Formats</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Export:</strong> JSON, CSV, XML, TXT, Markdown
                </div>
                <div>
                  <strong>File Types:</strong> Images, Videos, Audio, Documents,
                  Code, Archives
                </div>
                <div>
                  <strong>Privacy:</strong> All processing happens locally in
                  your browser
                </div>
                <div>
                  <strong>Limits:</strong> Configurable depth limits and size
                  filters
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}

// Helper functions
function getAllPaths(structure: FileItem): string[] {
  const paths: string[] = [];

  const traverse = (item: FileItem) => {
    if (item.type === "directory") {
      paths.push(item.path);
    }
    if (item.children) {
      item.children.forEach(traverse);
    }
  };

  traverse(structure);
  return paths;
}

function countFiles(structure: FileItem): number {
  let count = 0;

  const traverse = (item: FileItem) => {
    if (item.type === "file") {
      count++;
    }
    if (item.children) {
      item.children.forEach(traverse);
    }
  };

  traverse(structure);
  return count;
}
