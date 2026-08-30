"use client";

import React, { useMemo, useState } from "react";
import { Copy, Download, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatBytes } from "./utils";

interface ViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  language: "json" | "csv";
  onCopy: () => void;
  onDownload: () => void;
}

/**
 * Full-screen reader for large output. Line numbers are rendered in a separate
 * non-selectable gutter so copying from the pane never picks them up.
 */
export default function ViewerDialog({
  open,
  onOpenChange,
  title,
  content,
  language,
  onCopy,
  onDownload,
}: ViewerDialogProps) {
  const [query, setQuery] = useState("");
  const [wrap, setWrap] = useState(false);

  const lines = useMemo(() => content.split("\n"), [content]);

  const matches = useMemo(() => {
    if (!query.trim()) return null;
    const needle = query.toLowerCase();
    return new Set(
      lines.reduce<number[]>((acc, line, i) => {
        if (line.toLowerCase().includes(needle)) acc.push(i);
        return acc;
      }, []),
    );
  }, [lines, query]);

  const visible = useMemo(
    () =>
      matches
        ? lines
            .map((line, i) => ({ line, i }))
            .filter(({ i }) => matches.has(i))
        : lines.map((line, i) => ({ line, i })),
    [lines, matches],
  );

  const byteSize = useMemo(() => new Blob([content]).size, [content]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-[96vw] flex-col gap-3 p-4 sm:p-6 lg:max-w-[88vw]">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
            <span className="truncate">{title}</span>
            <Badge variant="secondary" className="uppercase">
              {language}
            </Badge>
            <Badge variant="outline">
              {lines.length.toLocaleString()} lines
            </Badge>
            <Badge variant="outline">{formatBytes(byteSize)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter lines..."
              className="h-9 pl-8 pr-8"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {matches && (
            <Badge variant="secondary">
              {matches.size.toLocaleString()} matching
            </Badge>
          )}

          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWrap((w) => !w)}
            >
              {wrap ? "No wrap" : "Wrap"}
            </Button>
            <Button variant="outline" size="sm" onClick={onCopy}>
              <Copy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/30">
          <div className="flex min-w-full">
            <div
              aria-hidden
              className="sticky left-0 select-none border-r bg-muted/60 px-2 py-3 text-right font-mono text-xs leading-5 text-muted-foreground"
            >
              {visible.map(({ i }) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre
              className={`flex-1 px-3 py-3 font-mono text-xs leading-5 ${
                wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
              }`}
            >
              {visible.map(({ line, i }) => (
                <div key={i}>{line === "" ? " " : line}</div>
              ))}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
