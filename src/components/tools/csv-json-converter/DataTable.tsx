"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { JsonObject, JsonValue } from "./utils";

interface DataTableProps {
  headers: string[];
  records: JsonObject[];
  /** Rows rendered before "show more"; keeps huge files responsive. */
  pageSize?: number;
}

type SortDirection = "asc" | "desc" | null;

function renderCell(value: JsonValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function compareValues(a: JsonValue, b: JsonValue): number {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  // Blanks always sink, in both directions, so they never hide real data.
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  if (typeof a === "number" && typeof b === "number") return a - b;
  return renderCell(a).localeCompare(renderCell(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export default function DataTable({
  headers,
  records,
  pageSize = 50,
}: DataTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [direction, setDirection] = useState<SortDirection>(null);
  const [limit, setLimit] = useState(pageSize);

  const filtered = useMemo(() => {
    if (!query.trim()) return records;
    const needle = query.toLowerCase();
    return records.filter((record) =>
      headers.some((header) =>
        renderCell(record[header]).toLowerCase().includes(needle),
      ),
    );
  }, [records, headers, query]);

  const sorted = useMemo(() => {
    if (!sortKey || !direction) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const result = compareValues(a[sortKey], b[sortKey]);
      return direction === "asc" ? result : -result;
    });
    return copy;
  }, [filtered, sortKey, direction]);

  const visible = sorted.slice(0, limit);

  // asc -> desc -> unsorted, so the original file order is recoverable.
  const toggleSort = (header: string) => {
    if (sortKey !== header) {
      setSortKey(header);
      setDirection("asc");
      return;
    }
    if (direction === "asc") {
      setDirection("desc");
      return;
    }
    setSortKey(null);
    setDirection(null);
  };

  if (headers.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No rows to preview yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(pageSize);
            }}
            placeholder="Search rows..."
            className="h-9 pl-8"
          />
        </div>
        <Badge variant="secondary">
          {sorted.length.toLocaleString()} of {records.length.toLocaleString()}{" "}
          rows
        </Badge>
        <Badge variant="outline">{headers.length} columns</Badge>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="w-12 px-3 py-2 text-right font-medium text-muted-foreground">
                #
              </th>
              {headers.map((header) => (
                <th key={header} className="px-3 py-2 text-left font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(header)}
                    className="inline-flex max-w-[16rem] items-center gap-1 hover:text-primary"
                    title={`Sort by ${header}`}
                  >
                    <span className="truncate">{header}</span>
                    {sortKey === header && direction === "asc" ? (
                      <ArrowUp className="h-3 w-3 shrink-0" />
                    ) : sortKey === header && direction === "desc" ? (
                      <ArrowDown className="h-3 w-3 shrink-0" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((record, rowIndex) => (
              <tr key={rowIndex} className="border-t hover:bg-muted/40">
                <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                  {rowIndex + 1}
                </td>
                {headers.map((header) => {
                  const value = record[header];
                  const text = renderCell(value);
                  return (
                    <td
                      key={header}
                      className="max-w-[18rem] truncate px-3 py-2 align-top"
                      title={text}
                    >
                      {text === "" ? (
                        <span className="text-xs italic text-muted-foreground">
                          empty
                        </span>
                      ) : typeof value === "number" ? (
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {text}
                        </span>
                      ) : typeof value === "boolean" ? (
                        <span className="font-mono text-purple-600 dark:text-purple-400">
                          {text}
                        </span>
                      ) : (
                        text
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > visible.length && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimit((l) => l + pageSize)}
          >
            Show {Math.min(pageSize, sorted.length - visible.length)} more rows
          </Button>
        </div>
      )}
    </div>
  );
}
