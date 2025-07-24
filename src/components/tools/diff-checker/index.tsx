"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  X,
  Info,
  Plus,
  File,
  Minus,
  Upload,
  Settings,
  FileText,
  Download,
  RefreshCw,
  GitCompare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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

interface DiffLine {
  type: "added" | "removed" | "unchanged" | "modified";
  lineNumber1?: number;
  lineNumber2?: number;
  content: string;
  originalContent?: string;
}

interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
  total: number;
}

interface UploadedFile {
  id: string;
  name: string;
  content: string;
  size: number;
  lastModified: number;
  type: string;
}

interface FileComparison {
  file1: UploadedFile;
  file2: UploadedFile;
  diff: DiffLine[];
  stats: DiffStats;
}

export default function DiffChecker() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [fileName1, setFileName1] = useState("Original");
  const [fileName2, setFileName2] = useState("Modified");

  // Settings
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showInlineChanges, setShowInlineChanges] = useState(true);
  const [contextLines, setContextLines] = useState(3);
  const [diffMode, setDiffMode] = useState<"split" | "unified">("split");

  // File comparison state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile1, setSelectedFile1] = useState<string>("");
  const [selectedFile2, setSelectedFile2] = useState<string>("");
  const [fileComparison, setFileComparison] = useState<FileComparison | null>(
    null,
  );

  // UI State
  const [showSettings, setShowSettings] = useState(false);

  // Utility functions

  const normalizeText = useCallback(
    (text: string): string => {
      let normalized = text;
      if (ignoreWhitespace) {
        normalized = normalized.replace(/\s+/g, " ").trim();
      }
      if (ignoreCase) {
        normalized = normalized.toLowerCase();
      }
      return normalized;
    },
    [ignoreWhitespace, ignoreCase],
  );

  // Advanced diff algorithm using Longest Common Subsequence (LCS)
  const computeDiff = useCallback(
    (text1: string, text2: string): DiffLine[] => {
      const lines1 = text1.split("\n");
      const lines2 = text2.split("\n");

      const normalizedLines1 = lines1.map(normalizeText);
      const normalizedLines2 = lines2.map(normalizeText);

      // Compute LCS matrix
      const lcs = computeLCS(normalizedLines1, normalizedLines2);

      // Backtrack to find the diff
      const diff: DiffLine[] = [];
      let i = lines1.length;
      let j = lines2.length;

      while (i > 0 || j > 0) {
        if (
          i > 0 &&
          j > 0 &&
          normalizedLines1[i - 1] === normalizedLines2[j - 1]
        ) {
          diff.unshift({
            type: "unchanged",
            lineNumber1: i,
            lineNumber2: j,
            content: lines1[i - 1],
          });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
          diff.unshift({
            type: "added",
            lineNumber2: j,
            content: lines2[j - 1],
          });
          j--;
        } else if (i > 0) {
          diff.unshift({
            type: "removed",
            lineNumber1: i,
            content: lines1[i - 1],
          });
          i--;
        }
      }

      return diff;
    },
    [normalizeText],
  );

  const computeLCS = (lines1: string[], lines2: string[]): number[][] => {
    const m = lines1.length;
    const n = lines2.length;
    const lcs: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (lines1[i - 1] === lines2[j - 1]) {
          lcs[i][j] = lcs[i - 1][j - 1] + 1;
        } else {
          lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
        }
      }
    }

    return lcs;
  };

  const getDiffStats = (diff: DiffLine[]): DiffStats => {
    const stats = {
      additions: 0,
      deletions: 0,
      modifications: 0,
      total: 0,
    };

    diff.forEach((line) => {
      if (line.type === "added") stats.additions++;
      else if (line.type === "removed") stats.deletions++;
      else if (line.type === "modified") stats.modifications++;
      stats.total++;
    });

    return stats;
  };

  const diff = useMemo(
    () => computeDiff(text1, text2),
    [text1, text2, computeDiff],
  );
  const stats = useMemo(() => getDiffStats(diff), [diff]);

  // Group diff lines into chunks for better visualization
  const getDiffChunks = (diff: DiffLine[], contextLines: number = 3) => {
    const chunks: DiffLine[][] = [];
    let currentChunk: DiffLine[] = [];
    let unchangedBuffer: DiffLine[] = [];

    diff.forEach((line) => {
      if (line.type === "unchanged") {
        unchangedBuffer.push(line);

        if (
          unchangedBuffer.length > contextLines * 2 &&
          currentChunk.length > 0
        ) {
          // Add context lines before the chunk
          currentChunk.unshift(...unchangedBuffer.slice(0, contextLines));
          chunks.push([...currentChunk]);
          currentChunk = [];
          unchangedBuffer = unchangedBuffer.slice(-contextLines);
        }
      } else {
        // Add context lines before changes
        if (unchangedBuffer.length > 0 && currentChunk.length === 0) {
          currentChunk.push(...unchangedBuffer.slice(-contextLines));
        }
        currentChunk.push(...unchangedBuffer);
        currentChunk.push(line);
        unchangedBuffer = [];
      }
    });

    // Add final chunk
    if (currentChunk.length > 0) {
      currentChunk.push(...unchangedBuffer.slice(0, contextLines));
      chunks.push(currentChunk);
    }

    return chunks;
  };

  const exportDiff = (format: "patch" | "html" | "json") => {
    let content = "";
    const timestamp = new Date().toISOString();

    switch (format) {
      case "patch":
        content = generatePatchFormat(diff, fileName1, fileName2);
        break;
      case "html":
        content = generateHTMLFormat(diff, fileName1, fileName2);
        break;
      case "json":
        content = JSON.stringify(
          {
            timestamp,
            files: { [fileName1]: text1, [fileName2]: text2 },
            diff: diff,
            stats: stats,
          },
          null,
          2,
        );
        break;
    }

    const blob = new Blob([content], {
      type:
        format === "html"
          ? "text/html"
          : format === "json"
            ? "application/json"
            : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diff-${timestamp.split("T")[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePatchFormat = (
    diff: DiffLine[],
    file1: string,
    file2: string,
  ): string => {
    let patch = `--- ${file1}\n+++ ${file2}\n`;

    const chunks = getDiffChunks(diff, contextLines);

    chunks.forEach((chunk) => {
      const startLine1 = chunk.find((l) => l.lineNumber1)?.lineNumber1 || 1;
      const startLine2 = chunk.find((l) => l.lineNumber2)?.lineNumber2 || 1;

      patch += `@@ -${startLine1},${chunk.filter((l) => l.type !== "added").length} +${startLine2},${chunk.filter((l) => l.type !== "removed").length} @@\n`;

      chunk.forEach((line) => {
        switch (line.type) {
          case "added":
            patch += `+${line.content}\n`;
            break;
          case "removed":
            patch += `-${line.content}\n`;
            break;
          case "unchanged":
            patch += ` ${line.content}\n`;
            break;
        }
      });
    });

    return patch;
  };

  const generateHTMLFormat = (
    diff: DiffLine[],
    file1: string,
    file2: string,
  ): string => {
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>Diff: ${file1} vs ${file2}</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        .diff-container { border: 1px solid #ddd; }
        .diff-header { background: #f5f5f5; padding: 10px; font-weight: bold; }
        .diff-line { padding: 2px 5px; }
        .added { background: #d4edda; }
        .removed { background: #f8d7da; }
        .unchanged { background: #fff; }
        .line-number { color: #666; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="diff-container">
        <div class="diff-header">${file1} vs ${file2}</div>`;

    diff.forEach((line) => {
      html += `<div class="diff-line ${line.type}">`;
      if (showLineNumbers) {
        html += `<span class="line-number">${line.lineNumber1 || ""}:${line.lineNumber2 || ""}</span>`;
      }
      html += `${line.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
    });

    html += `    </div>
</body>
</html>`;

    return html;
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 1 | 2,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (target === 1) {
        setText1(content);
        setFileName1(file.name);
      } else {
        setText2(content);
        setFileName2(file.name);
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    setText1("");
    setText2("");
    setFileName1("Original");
    setFileName2("Modified");
  };

  const swapTexts = () => {
    const tempText = text1;
    const tempName = fileName1;
    setText1(text2);
    setText2(tempText);
    setFileName1(fileName2);
    setFileName2(tempName);
  };

  // File comparison functions
  const handleMultipleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const newFile: UploadedFile = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          content,
          size: file.size,
          lastModified: file.lastModified,
          type: file.type,
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsText(file);
    });

    // Clear the input
    e.target.value = "";
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (selectedFile1 === fileId) setSelectedFile1("");
    if (selectedFile2 === fileId) setSelectedFile2("");
  };

  const compareSelectedFiles = useCallback(() => {
    const file1 = uploadedFiles.find((f) => f.id === selectedFile1);
    const file2 = uploadedFiles.find((f) => f.id === selectedFile2);

    if (!file1 || !file2) {
      setFileComparison(null);
      return;
    }

    const diff = computeDiff(file1.content, file2.content);
    const stats = getDiffStats(diff);

    setFileComparison({
      file1,
      file2,
      diff,
      stats,
    });
  }, [uploadedFiles, selectedFile1, selectedFile2, computeDiff]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setSelectedFile1("");
    setSelectedFile2("");
    setFileComparison(null);
  };

  // Auto-compare when both files are selected
  useEffect(() => {
    if (selectedFile1 && selectedFile2 && selectedFile1 !== selectedFile2) {
      compareSelectedFiles();
    }
  }, [selectedFile1, selectedFile2, compareSelectedFiles]);

  // Line component for rendering diff lines
  const DiffLineComponent = ({ line }: { line: DiffLine }) => {
    const getLineClass = () => {
      switch (line.type) {
        case "added":
          return "bg-green-300 border-l-2 border-green-300 hover:bg-green-400";
        case "removed":
          return "bg-red-300 border-l-2 border-red-300 hover:bg-red-400";
        case "modified":
          return "bg-yellow-300 border-l-2 border-yellow-300 hover:bg-yellow-100";
        default:
          return "bg-white hover:bg-gray-50";
      }
    };

    const getLineIcon = () => {
      switch (line.type) {
        case "added":
          return <Plus className="h-3 w-3 flex-shrink-0 text-green-600" />;
        case "removed":
          return <Minus className="h-3 w-3 flex-shrink-0 text-red-600" />;
        default:
          return <div className="h-3 w-3 flex-shrink-0" />;
      }
    };

    const getLinePrefix = () => {
      switch (line.type) {
        case "added":
          return "+";
        case "removed":
          return "-";
        default:
          return " ";
      }
    };

    return (
      <div
        className={`flex items-start border-b border-gray-700 px-3 py-2 font-mono text-sm last:border-b-0 ${getLineClass()}`}
      >
        {showLineNumbers && (
          <div className="mr-4 flex min-w-[80px] select-none text-xs text-gray-500">
            <span className="w-8 text-right">{line.lineNumber1 || ""}</span>
            <span className="ml-2 w-8 text-right">
              {line.lineNumber2 || ""}
            </span>
          </div>
        )}
        <div className="flex w-full min-w-0 items-start">
          <div className="mr-2 flex flex-shrink-0 items-center">
            {getLineIcon()}
            <span className="ml-1 w-2 text-xs text-gray-400">
              {getLinePrefix()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {line.content || " "}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          Advanced Diff Checker & Text Comparison
        </h1>
        <p className="text-muted-foreground">
          Compare texts, files, and code with advanced diff algorithms and
          visualization
        </p>
      </div>

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">Text Comparison</TabsTrigger>
          <TabsTrigger value="file">File Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={swapTexts}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Swap
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportDiff("patch")}
                disabled={diff.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Patch
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportDiff("html")}
                disabled={diff.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportDiff("json")}
                disabled={diff.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>

          {showSettings && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Comparison Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ignore-whitespace"
                      checked={ignoreWhitespace}
                      onCheckedChange={setIgnoreWhitespace}
                    />
                    <Label htmlFor="ignore-whitespace">Ignore Whitespace</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ignore-case"
                      checked={ignoreCase}
                      onCheckedChange={setIgnoreCase}
                    />
                    <Label htmlFor="ignore-case">Ignore Case</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-line-numbers"
                      checked={showLineNumbers}
                      onCheckedChange={setShowLineNumbers}
                    />
                    <Label htmlFor="show-line-numbers">Show Line Numbers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-inline-changes"
                      checked={showInlineChanges}
                      onCheckedChange={setShowInlineChanges}
                    />
                    <Label htmlFor="show-inline-changes">Inline Changes</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diff-mode">View Mode</Label>
                    <Select
                      value={diffMode}
                      onValueChange={(value: "split" | "unified") =>
                        setDiffMode(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="split">Split View</SelectItem>
                        <SelectItem value="unified">Unified View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="context-lines">Context Lines</Label>
                    <Input
                      id="context-lines"
                      type="number"
                      min="0"
                      max="10"
                      value={contextLines}
                      onChange={(e) =>
                        setContextLines(parseInt(e.target.value) || 3)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Input
                      value={fileName1}
                      onChange={(e) => setFileName1(e.target.value)}
                      className="h-auto border-none bg-transparent p-0 text-lg font-semibold"
                      placeholder="Original file name"
                    />
                    <CardDescription>Original text</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".txt,.js,.ts,.json,.xml,.html,.css,.py,.java,.cpp,.c,.h,.md"
                      onChange={(e) => handleFileUpload(e, 1)}
                      className="hidden"
                      id="file-upload-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("file-upload-1")?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste your original text here..."
                  value={text1}
                  onChange={(e) => setText1(e.target.value)}
                  rows={15}
                  className="resize-none font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Input
                      value={fileName2}
                      onChange={(e) => setFileName2(e.target.value)}
                      className="h-auto border-none bg-transparent p-0 text-lg font-semibold"
                      placeholder="Modified file name"
                    />
                    <CardDescription>Modified text</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".txt,.js,.ts,.json,.xml,.html,.css,.py,.java,.cpp,.c,.h,.md"
                      onChange={(e) => handleFileUpload(e, 2)}
                      className="hidden"
                      id="file-upload-2"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("file-upload-2")?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste your modified text here..."
                  value={text2}
                  onChange={(e) => setText2(e.target.value)}
                  rows={15}
                  className="resize-none font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Diff Statistics */}
          {(text1 || text2) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  Comparison Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  <div className="rounded-lg border border-green-700 p-4 text-center">
                    <div className="mb-1 text-3xl font-bold text-green-700">
                      {stats.additions}
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      Additions
                    </div>
                  </div>
                  <div className="rounded-lg border border-red-700 p-4 text-center">
                    <div className="mb-1 text-3xl font-bold text-red-700">
                      {stats.deletions}
                    </div>
                    <div className="text-sm font-medium text-red-600">
                      Deletions
                    </div>
                  </div>
                  <div className="rounded-lg border border-yellow-700 p-4 text-center">
                    <div className="mb-1 text-3xl font-bold text-yellow-700">
                      {stats.modifications}
                    </div>
                    <div className="text-sm font-medium text-yellow-600">
                      Modifications
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-700 p-4 text-center">
                    <div className="mb-1 text-3xl font-bold text-blue-700">
                      {stats.total}
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      Total Lines
                    </div>
                  </div>
                </div>

                {/* Summary Bar */}
                {diff.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {stats.total} lines compared
                      </span>
                      <div className="flex items-center gap-2">
                        {stats.additions > 0 && (
                          <span className="text-green-600">
                            +{stats.additions}
                          </span>
                        )}
                        {stats.deletions > 0 && (
                          <span className="text-red-600">
                            -{stats.deletions}
                          </span>
                        )}
                        {stats.modifications > 0 && (
                          <span className="text-yellow-600">
                            ~{stats.modifications}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(
                        ((stats.additions +
                          stats.deletions +
                          stats.modifications) /
                          Math.max(stats.total, 1)) *
                        100
                      ).toFixed(1)}
                      % changed
                    </div>
                  </div>
                )}

                {/* Diff Visualization */}
                <div className="overflow-hidden rounded-lg border">
                  {showLineNumbers && (
                    <div className="border-b px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Differences</span>
                        <div className="flex items-center gap-4 font-mono text-xs text-black">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-white px-2 py-1 text-center">
                              {fileName1}
                            </span>
                            <span className="rounded bg-white px-2 py-1 text-center">
                              {fileName2}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!showLineNumbers && (
                    <div className="border-b bg-gray-50 px-4 py-3">
                      <span className="font-medium text-gray-900">
                        Differences
                      </span>
                    </div>
                  )}
                  <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-[500px] overflow-y-auto text-black">
                    {diff.length > 0 ? (
                      diff.map((line, index) => (
                        <DiffLineComponent key={index} line={line} />
                      ))
                    ) : (
                      <div className="p-12 text-center text-muted-foreground">
                        <AlertCircle className="mx-auto mb-4 h-16 w-16 opacity-30" />
                        <p className="mb-2 text-lg font-medium">
                          No differences found
                        </p>
                        <p className="text-sm">The texts are identical</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Upload multiple files to compare them. Support for text files,
                code files, and common document formats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  multiple
                  accept=".txt,.js,.ts,.jsx,.tsx,.json,.xml,.html,.css,.py,.java,.cpp,.c,.h,.md,.php,.rb,.go,.rs,.swift,.kt,.scala,.sql,.yaml,.yml,.ini,.conf,.log"
                  onChange={handleMultipleFileUpload}
                  className="hidden"
                  id="multiple-file-upload"
                />
                <Button
                  onClick={() =>
                    document.getElementById("multiple-file-upload")?.click()
                  }
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose Files
                </Button>
                {uploadedFiles.length > 0 && (
                  <Button variant="outline" onClick={clearAllFiles}>
                    <X className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">
                  {uploadedFiles.length} files uploaded
                </span>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <File className="h-4 w-4 text-blue-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedFiles.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-2 text-lg font-medium text-gray-900">
                    No files uploaded
                  </p>
                  <p className="mb-4 text-sm text-gray-600">
                    Upload text files, code files, or documents to compare them
                  </p>
                  <Button
                    onClick={() =>
                      document.getElementById("multiple-file-upload")?.click()
                    }
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Selection Section */}
          {uploadedFiles.length >= 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  Select Files to Compare
                </CardTitle>
                <CardDescription>
                  Choose two files from your uploaded files to compare
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="file1-select">First File</Label>
                    <Select
                      value={selectedFile1}
                      onValueChange={setSelectedFile1}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select first file" />
                      </SelectTrigger>
                      <SelectContent>
                        {uploadedFiles.map((file) => (
                          <SelectItem
                            key={file.id}
                            value={file.id}
                            disabled={file.id === selectedFile2}
                          >
                            <div className="flex items-center gap-2">
                              <File className="h-3 w-3" />
                              <span className="truncate">{file.name}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file2-select">Second File</Label>
                    <Select
                      value={selectedFile2}
                      onValueChange={setSelectedFile2}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select second file" />
                      </SelectTrigger>
                      <SelectContent>
                        {uploadedFiles.map((file) => (
                          <SelectItem
                            key={file.id}
                            value={file.id}
                            disabled={file.id === selectedFile1}
                          >
                            <div className="flex items-center gap-2">
                              <File className="h-3 w-3" />
                              <span className="truncate">{file.name}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedFile1 && selectedFile2 && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Ready to compare:{" "}
                      {uploadedFiles.find((f) => f.id === selectedFile1)?.name}{" "}
                      vs{" "}
                      {uploadedFiles.find((f) => f.id === selectedFile2)?.name}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* File Comparison Results */}
          {fileComparison && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  File Comparison Results
                </CardTitle>
                <CardDescription>
                  Comparing {fileComparison.file1.name} vs{" "}
                  {fileComparison.file2.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Info */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <File className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        {fileComparison.file1.name}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div>
                        Size: {formatFileSize(fileComparison.file1.size)}
                      </div>
                      <div>
                        Modified:{" "}
                        {new Date(
                          fileComparison.file1.lastModified,
                        ).toLocaleString()}
                      </div>
                      <div>
                        Lines: {fileComparison.file1.content.split("\n").length}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <File className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">
                        {fileComparison.file2.name}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-purple-700">
                      <div>
                        Size: {formatFileSize(fileComparison.file2.size)}
                      </div>
                      <div>
                        Modified:{" "}
                        {new Date(
                          fileComparison.file2.lastModified,
                        ).toLocaleString()}
                      </div>
                      <div>
                        Lines: {fileComparison.file2.content.split("\n").length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  <div className="rounded-lg border border-green-700 p-4 text-center">
                    <div className="mb-1 text-3xl font-bold text-green-700">
                      {fileComparison.stats.additions}
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      Additions
                    </div>
                  </div>
                  <div className="rounded-lg border border-red-700 p-4 text-center">
                    <div className="mb-1 text-3xl font-bold text-red-700">
                      {fileComparison.stats.deletions}
                    </div>
                    <div className="text-sm font-medium text-red-600">
                      Deletions
                    </div>
                  </div>
                  <div className="rounded-lg border border-yellow-700 p-4 text-center">
                    <div className="mb-1 text-3xl font-bold text-yellow-700">
                      {fileComparison.stats.modifications}
                    </div>
                    <div className="text-sm font-medium text-yellow-600">
                      Modifications
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-700 p-4 text-center">
                    <div className="mb-1 text-3xl font-bold text-blue-700">
                      {fileComparison.stats.total}
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      Total Lines
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportDiff("patch")}
                    disabled={fileComparison.diff.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Patch
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportDiff("html")}
                    disabled={fileComparison.diff.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export HTML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportDiff("json")}
                    disabled={fileComparison.diff.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                </div>

                {/* Diff Visualization */}
                <div className="overflow-hidden rounded-lg border">
                  <div className="border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">File Differences</span>
                      <div className="flex items-center gap-4 font-mono text-xs text-black">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-blue-100 px-2 py-1 text-center text-blue-800">
                            {fileComparison.file1.name}
                          </span>
                          <span className="rounded bg-purple-100 px-2 py-1 text-center text-purple-800">
                            {fileComparison.file2.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-[500px] overflow-y-auto text-black">
                    {fileComparison.diff.length > 0 ? (
                      fileComparison.diff.map((line, index) => (
                        <DiffLineComponent key={index} line={line} />
                      ))
                    ) : (
                      <div className="p-12 text-center text-muted-foreground">
                        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500 opacity-30" />
                        <p className="mb-2 text-lg font-medium">
                          Files are identical
                        </p>
                        <p className="text-sm">
                          No differences found between the selected files
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          {uploadedFiles.length < 2 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Upload at least 2 files to start comparing. Supported formats
                include text files (.txt), code files (.js, .ts, .py, .java,
                etc.), configuration files (.json, .xml, .yaml), and
                documentation files (.md, .html).
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle>Diff Checker Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Comparison Options</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Ignore Whitespace:</strong> Ignore spaces and tabs
                  when comparing
                </div>
                <div>
                  <strong>Ignore Case:</strong> Perform case-insensitive
                  comparison
                </div>
                <div>
                  <strong>Context Lines:</strong> Number of unchanged lines to
                  show around changes
                </div>
                <div>
                  <strong>Inline Changes:</strong> Highlight character-level
                  differences
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Export Formats</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Patch:</strong> Standard unified diff format
                </div>
                <div>
                  <strong>HTML:</strong> Styled HTML report for sharing
                </div>
                <div>
                  <strong>JSON:</strong> Structured data with diff details
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
