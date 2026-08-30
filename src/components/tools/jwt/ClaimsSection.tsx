"use client";

import React from "react";
import { Check, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ClaimRow } from "./utils";

interface ClaimsSectionProps {
  title: string;
  icon: React.ReactNode;
  rows: ClaimRow[];
  /** Copy-all payload for the section header button. */
  copyValue: string;
  copyId: string;
  copiedItem: string | null;
  onCopy: (text: string, id: string) => void;
  emptyMessage?: string;
}

const STATUS_STYLES: Record<string, string> = {
  expired: "bg-red-500 text-white hover:bg-red-500",
  "not-yet-valid": "bg-amber-500 text-white hover:bg-amber-500",
  ok: "bg-emerald-600 text-white hover:bg-emerald-600",
};

const STATUS_LABELS: Record<string, string> = {
  expired: "Expired",
  "not-yet-valid": "Not yet valid",
  ok: "Valid",
};

export default function ClaimsSection({
  title,
  icon,
  rows,
  copyValue,
  copyId,
  copiedItem,
  onCopy,
  emptyMessage = "No values in this section.",
}: ClaimsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          {rows.length > 0 && <Badge variant="secondary">{rows.length}</Badge>}
        </CardTitle>
        {rows.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(copyValue, copyId)}
          >
            {copiedItem === copyId ? (
              <Check className="h-4 w-4 sm:mr-2" />
            ) : (
              <Copy className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Copy all</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <div className="divide-y">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 sm:w-2/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.label}</span>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {row.key}
                    </code>
                    {row.status !== "none" && (
                      <Badge className={STATUS_STYLES[row.status]}>
                        {STATUS_LABELS[row.status]}
                      </Badge>
                    )}
                  </div>
                  {row.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.description}
                    </p>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-mono text-sm">
                      {row.display}
                    </p>
                    {row.time && (
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        <p>{row.time.relative}</p>
                        <p className="font-mono">{row.time.utc}</p>
                        <p className="font-mono opacity-70">Unix: {row.raw}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 px-2"
                    aria-label={`Copy ${row.label}`}
                    onClick={() => onCopy(row.raw, `${copyId}-${row.key}`)}
                  >
                    {copiedItem === `${copyId}-${row.key}` ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
