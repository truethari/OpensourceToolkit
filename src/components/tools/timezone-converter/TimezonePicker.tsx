"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  TIMEZONES,
  getTimezoneMeta,
  getAllSupportedTimezones,
  type ITimezoneMeta,
} from "./timezones";
import { getOffsetMinutes, formatOffset } from "./tz-utils";

interface Props {
  /** Zones already added — shown as disabled in the list. */
  selected: string[];
  onSelect: (tz: string) => void;
  now: number;
  /** Rendered as the trigger button label. */
  label?: string;
}

export default function TimezonePicker({
  selected,
  onSelect,
  now,
  label = "Add timezone",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /** Curated zones first; fall back to the full IANA list when searching. */
  const candidates: ITimezoneMeta[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TIMEZONES;

    const curated = TIMEZONES.filter((t) => {
      const haystack = [t.city, t.country, t.tz, ...(t.aliases ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    // Supplement with raw IANA ids so obscure zones remain reachable.
    const curatedIds = new Set(TIMEZONES.map((t) => t.tz));
    const extra = getAllSupportedTimezones()
      .filter((tz) => !curatedIds.has(tz) && tz.toLowerCase().includes(q))
      .slice(0, 25)
      .map(getTimezoneMeta);

    return [...curated, ...extra];
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, ITimezoneMeta[]>();
    for (const t of candidates) {
      const list = map.get(t.region) ?? [];
      list.push(t);
      map.set(t.region, list);
    }
    return Array.from(map.entries());
  }, [candidates]);

  const handleSelect = (tz: string) => {
    onSelect(tz);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => setOpen((o) => !o)}
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-lg border bg-popover shadow-lg">
          <div className="relative border-b p-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, country, or code (PST, IST…)"
              className="pl-8 pr-8"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {grouped.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No timezones match “{query}”.
              </p>
            )}

            {grouped.map(([region, zones]) => (
              <div key={region}>
                <div className="sticky top-0 bg-muted/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                  {region}
                </div>
                {zones.map((z) => {
                  const already = selected.includes(z.tz);
                  const offset = formatOffset(getOffsetMinutes(now, z.tz));
                  return (
                    <button
                      key={z.tz}
                      disabled={already}
                      onClick={() => handleSelect(z.tz)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {z.city}
                          {already && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              added
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {z.country} · {z.tz}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {offset}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
