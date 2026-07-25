"use client";

import { toast } from "sonner";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Globe2,
  Copy,
  X,
  Clock,
  Sun,
  Moon,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
  Download,
  RotateCcw,
  Users,
  Info,
  Link2,
  Sunrise,
  Sunset,
  CalendarDays,
  Star,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

import TimezonePicker from "./TimezonePicker";
import { getTimezoneMeta, TIMEZONE_PRESETS } from "./timezones";
import {
  getOffsetMinutes,
  getStandardOffsetMinutes,
  formatOffset,
  formatOffsetDifference,
  formatInZone,
  toISOWithOffset,
  getDayDifference,
  getZoneAbbreviation,
  getZoneLongName,
  isDST,
  observesDST,
  getNextTransition,
  getUpcomingTransitions,
  classifyHour,
  isWeekend,
  getRelativeTime,
  getLocalTimezone,
  parseFlexibleInput,
  getWallClock,
  resolveWallClock,
  isValidTimezone,
  type IFormatOptions,
  type ITransition,
} from "./tz-utils";

const STORAGE_KEY = "timezone-converter:zones";
const PREFS_KEY = "timezone-converter:prefs";
const DAY_MS = 86_400_000;

type DayPeriodKey = "night" | "early" | "work" | "evening";

const PERIOD_STYLES: Record<
  DayPeriodKey,
  { cell: string; label: string; dot: string }
> = {
  work: {
    cell: "bg-emerald-500/25 text-emerald-900 dark:text-emerald-100",
    label: "Working hours",
    dot: "bg-emerald-500",
  },
  early: {
    cell: "bg-amber-500/25 text-amber-900 dark:text-amber-100",
    label: "Early morning",
    dot: "bg-amber-500",
  },
  evening: {
    cell: "bg-orange-500/25 text-orange-900 dark:text-orange-100",
    label: "Evening",
    dot: "bg-orange-500",
  },
  night: {
    cell: "bg-slate-500/25 text-slate-700 dark:text-slate-300",
    label: "Night / asleep",
    dot: "bg-slate-500",
  },
};

export default function TimezoneConverter() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [liveMode, setLiveMode] = useState(true);

  const [localTz, setLocalTz] = useState("UTC");
  const [sourceTz, setSourceTz] = useState("UTC");
  const [zones, setZones] = useState<string[]>([]);

  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [flexibleInput, setFlexibleInput] = useState("");
  const [ambiguityPreference, setAmbiguityPreference] = useState<
    "earlier" | "later"
  >("earlier");

  const [hour12, setHour12] = useState(true);
  const [showSeconds, setShowSeconds] = useState(false);
  const [dateStyle, setDateStyle] = useState<"short" | "medium" | "full">(
    "medium",
  );

  const [workStart, setWorkStart] = useState(9);
  const [workEnd, setWorkEnd] = useState(17);

  // ── Bootstrap: local zone + persisted preferences ─────────────────────────
  useEffect(() => {
    const local = getLocalTimezone();
    setLocalTz(local);
    setMounted(true);

    let restoredZones: string[] | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (z) => typeof z === "string" && isValidTimezone(z),
          );
          if (valid.length) restoredZones = valid;
        }
      }
    } catch {
      // Ignore malformed storage and fall through to defaults.
    }

    try {
      const rawPrefs = localStorage.getItem(PREFS_KEY);
      if (rawPrefs) {
        const p = JSON.parse(rawPrefs);
        if (typeof p.hour12 === "boolean") setHour12(p.hour12);
        if (typeof p.showSeconds === "boolean") setShowSeconds(p.showSeconds);
        if (["short", "medium", "full"].includes(p.dateStyle))
          setDateStyle(p.dateStyle);
        if (typeof p.workStart === "number") setWorkStart(p.workStart);
        if (typeof p.workEnd === "number") setWorkEnd(p.workEnd);
      }
    } catch {
      // Ignore malformed prefs.
    }

    // A URL hash lets users share a comparison, e.g. #tz=Asia/Tokyo,Europe/London
    const hashZones = readZonesFromHash();

    setSourceTz(local);
    setZones(hashZones ?? restoredZones ?? defaultZonesFor(local));
  }, []);

  // Persist zone list + prefs.
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
    } catch {
      // Storage unavailable (private mode) — non-fatal.
    }
  }, [zones, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ hour12, showSeconds, dateStyle, workStart, workEnd }),
      );
    } catch {
      // Non-fatal.
    }
  }, [hour12, showSeconds, dateStyle, workStart, workEnd, mounted]);

  // Live clock tick.
  useEffect(() => {
    if (!liveMode) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [liveMode]);

  // ── Derived: the instant every zone is rendered at ────────────────────────
  const manualInstant = useMemo(() => {
    if (liveMode) return null;
    if (flexibleInput.trim()) {
      const parsed = parseFlexibleInput(
        flexibleInput,
        sourceTz,
        ambiguityPreference,
      );
      return parsed;
    }
    if (dateInput && timeInput) {
      const [y, mo, d] = dateInput.split("-").map(Number);
      const [h, mi] = timeInput.split(":").map(Number);
      if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) return null;
      try {
        const resolution = resolveWallClock(
          { year: y, month: mo, day: d, hour: h, minute: mi, second: 0 },
          sourceTz,
          ambiguityPreference,
        );
        return {
          instant: resolution.instant,
          interpreted: "Wall-clock time in source zone",
          resolution,
        };
      } catch {
        return null;
      }
    }
    return null;
  }, [
    liveMode,
    flexibleInput,
    dateInput,
    timeInput,
    sourceTz,
    ambiguityPreference,
  ]);

  const instant = liveMode ? now : (manualInstant?.instant ?? now);

  const fmtOpts: IFormatOptions = useMemo(
    () => ({ hour12, showSeconds, dateStyle }),
    [hour12, showSeconds, dateStyle],
  );

  // ── Per-zone computed rows ────────────────────────────────────────────────
  const rows = useMemo(() => {
    return zones.map((tz) => {
      const meta = getTimezoneMeta(tz);
      const offset = getOffsetMinutes(instant, tz);
      const formatted = formatInZone(instant, tz, fmtOpts);
      const wall = getWallClock(instant, tz);
      const dayDiff = getDayDifference(instant, tz, sourceTz);
      const dst = isDST(instant, tz);
      const usesDst = observesDST(instant, tz);
      const nextTransition = getNextTransition(instant, tz);
      const period = classifyHour(wall.hour, workStart, workEnd);

      return {
        tz,
        meta,
        offset,
        offsetLabel: formatOffset(offset),
        diffFromSource: offset - getOffsetMinutes(instant, sourceTz),
        formatted,
        wall,
        dayDiff,
        dst,
        usesDst,
        nextTransition,
        period: period as DayPeriodKey,
        weekend: isWeekend(instant, tz),
        abbreviation: getZoneAbbreviation(instant, tz),
        longName: getZoneLongName(instant, tz),
        iso: toISOWithOffset(instant, tz),
      };
    });
  }, [zones, instant, fmtOpts, sourceTz, workStart, workEnd]);

  // Sort by offset so the grid reads west → east.
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.offset - b.offset),
    [rows],
  );

  // ── Banner conditions ─────────────────────────────────────────────────────
  const banners = useMemo(() => {
    const out: {
      key: string;
      tone: "warning" | "info" | "danger";
      icon: React.ReactNode;
      title: string;
      body: string;
    }[] = [];

    // 1. The entered wall time hit a DST gap or overlap.
    const res = manualInstant?.resolution;
    if (res?.kind === "gap") {
      const meta = getTimezoneMeta(sourceTz);
      out.push({
        key: "gap",
        tone: "danger",
        icon: <AlertTriangle className="h-4 w-4" />,
        title: "That local time never existed",
        body:
          `Clocks in ${meta.city} jumped forward by ${res.shiftedByMinutes} minutes, ` +
          `so the time you entered was skipped entirely. It has been moved forward to ` +
          `${formatInZone(res.instant, sourceTz, fmtOpts).time}.`,
      });
    }
    if (res?.kind === "ambiguous" && res.alternatives) {
      const meta = getTimezoneMeta(sourceTz);
      const earlier = formatInZone(res.alternatives.earlier, sourceTz, fmtOpts);
      const later = formatInZone(res.alternatives.later, sourceTz, fmtOpts);
      out.push({
        key: "ambiguous",
        tone: "warning",
        icon: <AlertTriangle className="h-4 w-4" />,
        title: "That local time happened twice",
        body:
          `Clocks in ${meta.city} fell back, so this wall-clock time occurs twice — once at ` +
          `${earlier.time} ${getZoneAbbreviation(res.alternatives.earlier, sourceTz)} and again at ` +
          `${later.time} ${getZoneAbbreviation(res.alternatives.later, sourceTz)}. ` +
          `Currently showing the ${ambiguityPreference} one.`,
      });
    }

    // 2. Zones currently on DST.
    const onDst = rows.filter((r) => r.dst);
    if (onDst.length) {
      out.push({
        key: "dst-active",
        tone: "info",
        icon: <Sun className="h-4 w-4" />,
        title: `${onDst.length} zone${onDst.length > 1 ? "s are" : " is"} on daylight saving time`,
        body: onDst
          .map(
            (r) =>
              `${r.meta.city} (${r.abbreviation}, ${formatOffset(r.offset)} — normally ${formatOffset(
                getStandardOffsetMinutes(instant, r.tz),
              )})`,
          )
          .join(" · "),
      });
    }

    // 3. Transitions within the next 14 days.
    const soon = rows
      .map((r) => ({ row: r, t: r.nextTransition }))
      .filter(
        (x): x is { row: (typeof rows)[number]; t: ITransition } =>
          !!x.t && x.t.at - instant < 14 * DAY_MS,
      )
      .sort((a, b) => a.t.at - b.t.at);

    if (soon.length) {
      out.push({
        key: "dst-soon",
        tone: "warning",
        icon: <CalendarClock className="h-4 w-4" />,
        title: `Clock change${soon.length > 1 ? "s" : ""} coming within 14 days`,
        body: soon
          .map(({ row, t }) => {
            const dir = t.deltaMinutes > 0 ? "forward" : "back";
            const mins = Math.abs(t.deltaMinutes);
            return `${row.meta.city} moves ${dir} ${mins}m ${getRelativeTime(t.at, instant)}`;
          })
          .join(" · "),
      });
    }

    // 4. Cross-day spread — some zones are on a different calendar date.
    const diffDays = rows.filter((r) => r.dayDiff !== 0);
    if (diffDays.length) {
      out.push({
        key: "day-diff",
        tone: "info",
        icon: <CalendarDays className="h-4 w-4" />,
        title: "Some zones are on a different calendar day",
        body: diffDays
          .map(
            (r) =>
              `${r.meta.city} is ${r.dayDiff > 0 ? "a day ahead" : "a day behind"} (${r.formatted.weekday})`,
          )
          .join(" · "),
      });
    }

    // 5. Zones with unusual (non-hour) offsets.
    const oddOffsets = rows.filter((r) => r.offset % 60 !== 0);
    if (oddOffsets.length) {
      out.push({
        key: "odd-offset",
        tone: "info",
        icon: <Info className="h-4 w-4" />,
        title: "Non-hourly UTC offsets in this list",
        body:
          oddOffsets
            .map((r) => `${r.meta.city} is ${formatOffset(r.offset)}`)
            .join(" · ") +
          " — easy to get wrong when scheduling, so double-check these.",
      });
    }

    // 6. Weekend warning.
    const weekendZones = rows.filter((r) => r.weekend);
    if (weekendZones.length && weekendZones.length !== rows.length) {
      out.push({
        key: "weekend",
        tone: "warning",
        icon: <Info className="h-4 w-4" />,
        title: "It's the weekend in some of these zones",
        body:
          weekendZones
            .map((r) => `${r.meta.city} (${r.formatted.weekday})`)
            .join(" · ") + " — probably not a good time to schedule work.",
      });
    }

    return out;
  }, [rows, manualInstant, sourceTz, fmtOpts, instant, ambiguityPreference]);

  // ── Meeting planner grid ──────────────────────────────────────────────────
  const plannerHours = useMemo(() => {
    // Anchor on midnight of the source zone's current day, then walk 24 hours.
    const w = getWallClock(instant, sourceTz);
    let base: number;
    try {
      base = resolveWallClock(
        { ...w, hour: 0, minute: 0, second: 0 },
        sourceTz,
      ).instant;
    } catch {
      base = instant - (instant % DAY_MS);
    }
    return Array.from({ length: 24 }, (_, i) => base + i * 3_600_000);
  }, [instant, sourceTz]);

  const plannerScores = useMemo(() => {
    return plannerHours.map((slot) => {
      const perZone = sortedRows.map((r) => {
        const wall = getWallClock(slot, r.tz);
        return {
          tz: r.tz,
          hour: wall.hour,
          period: classifyHour(wall.hour, workStart, workEnd) as DayPeriodKey,
          weekend: isWeekend(slot, r.tz),
        };
      });
      const workCount = perZone.filter((z) => z.period === "work").length;
      const nightCount = perZone.filter((z) => z.period === "night").length;
      return { slot, perZone, workCount, nightCount };
    });
  }, [plannerHours, sortedRows, workStart, workEnd]);

  const bestSlots = useMemo(() => {
    return [...plannerScores]
      .filter((s) => s.nightCount === 0 && sortedRows.length > 0)
      .sort((a, b) => b.workCount - a.workCount)
      .slice(0, 3);
  }, [plannerScores, sortedRows.length]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  const addZone = useCallback((tz: string) => {
    setZones((prev) => (prev.includes(tz) ? prev : [...prev, tz]));
    toast.success(`Added ${getTimezoneMeta(tz).city}`);
  }, []);

  const removeZone = useCallback((tz: string) => {
    setZones((prev) => prev.filter((z) => z !== tz));
  }, []);

  const applyPreset = useCallback(
    (preset: (typeof TIMEZONE_PRESETS)[number]) => {
      setZones(preset.zones);
      toast.success(`Loaded “${preset.name}” preset`);
    },
    [],
  );

  const switchToManual = useCallback(() => {
    // Seed the manual inputs from the currently displayed instant.
    const w = getWallClock(instant, sourceTz);
    const p = (n: number) => String(n).padStart(2, "0");
    setDateInput(`${w.year}-${p(w.month)}-${p(w.day)}`);
    setTimeInput(`${p(w.hour)}:${p(w.minute)}`);
    setFlexibleInput("");
    setLiveMode(false);
  }, [instant, sourceTz]);

  const resetToNow = useCallback(() => {
    setLiveMode(true);
    setFlexibleInput("");
    setNow(Date.now());
    toast.success("Back to live current time");
  }, []);

  const copyShareLink = useCallback(() => {
    const url = new URL(window.location.href);
    url.hash = `tz=${zones.join(",")}`;
    copyToClipboard(url.toString(), "Share link");
  }, [zones, copyToClipboard]);

  const copySummary = useCallback(() => {
    const lines = sortedRows.map((r) => {
      const dayNote =
        r.dayDiff === 0 ? "" : r.dayDiff > 0 ? " (next day)" : " (prev day)";
      return `${r.meta.city.padEnd(20)} ${r.formatted.time}${dayNote}  ${r.formatted.date}  ${r.abbreviation} ${r.offsetLabel}`;
    });
    copyToClipboard(
      `Time comparison\n${"=".repeat(60)}\n${lines.join("\n")}`,
      "Summary",
    );
  }, [sortedRows, copyToClipboard]);

  const exportJSON = useCallback(() => {
    const data = {
      instant: new Date(instant).toISOString(),
      sourceTimezone: sourceTz,
      zones: sortedRows.map((r) => ({
        timezone: r.tz,
        city: r.meta.city,
        country: r.meta.country,
        localTime: r.formatted.time,
        localDate: r.formatted.date,
        weekday: r.formatted.weekday,
        iso: r.iso,
        utcOffset: r.offsetLabel,
        abbreviation: r.abbreviation,
        zoneName: r.longName,
        isDST: r.dst,
        observesDST: r.usesDst,
        dayDifferenceFromSource: r.dayDiff,
        nextTransition: r.nextTransition
          ? {
              at: new Date(r.nextTransition.at).toISOString(),
              deltaMinutes: r.nextTransition.deltaMinutes,
            }
          : null,
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timezone-comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  }, [instant, sourceTz, sortedRows]);

  const exportCSV = useCallback(() => {
    const header = [
      "Timezone",
      "City",
      "Country",
      "Local Time",
      "Local Date",
      "Weekday",
      "ISO 8601",
      "UTC Offset",
      "Abbreviation",
      "On DST",
      "Day Diff",
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = sortedRows.map((r) =>
      [
        r.tz,
        r.meta.city,
        r.meta.country,
        r.formatted.time,
        r.formatted.date,
        r.formatted.weekday,
        r.iso,
        r.offsetLabel,
        r.abbreviation,
        r.dst ? "yes" : "no",
        String(r.dayDiff),
      ]
        .map(escape)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timezone-comparison-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  }, [sortedRows]);

  // Avoid hydration mismatch: times differ between server and client.
  if (!mounted) {
    return (
      <ToolsWrapper>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse" />
            <span>Loading timezones…</span>
          </div>
        </div>
      </ToolsWrapper>
    );
  }

  return (
    <ToolsWrapper>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-white">
          <Globe2 className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Timezone Converter
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 sm:text-lg">
          Convert one moment across many timezones at once — with daylight
          saving warnings, a meeting planner, and cross-day alerts.
        </p>
      </div>

      {/* ── Banners ──────────────────────────────────────────────────────── */}
      {banners.length > 0 && (
        <div className="mb-6 space-y-3">
          {banners.map((b) => (
            <div
              key={b.key}
              className={`flex gap-3 rounded-lg border p-3 sm:p-4 ${
                b.tone === "danger"
                  ? "border-red-500/40 bg-red-500/10"
                  : b.tone === "warning"
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-sky-500/40 bg-sky-500/10"
              }`}
            >
              <div
                className={`mt-0.5 shrink-0 ${
                  b.tone === "danger"
                    ? "text-red-600 dark:text-red-400"
                    : b.tone === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-sky-600 dark:text-sky-400"
                }`}
              >
                {b.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="mt-0.5 break-words text-xs text-muted-foreground sm:text-sm">
                  {b.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Time to convert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <Label className="text-sm font-medium">Live mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Follow the current time
                  </p>
                </div>
                <Switch
                  checked={liveMode}
                  onCheckedChange={(v) => (v ? resetToNow() : switchToManual())}
                />
              </div>

              {!liveMode && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Date</Label>
                      <Input
                        type="date"
                        value={dateInput}
                        onChange={(e) => {
                          setDateInput(e.target.value);
                          setFlexibleInput("");
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Time</Label>
                      <Input
                        type="time"
                        value={timeInput}
                        onChange={(e) => {
                          setTimeInput(e.target.value);
                          setFlexibleInput("");
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      …or paste any timestamp / date string
                    </Label>
                    <Input
                      value={flexibleInput}
                      onChange={(e) => setFlexibleInput(e.target.value)}
                      placeholder="1752580800 · 2025-07-15T12:00:00Z"
                      className="font-mono text-xs"
                    />
                    {flexibleInput.trim() && (
                      <p
                        className={`text-xs ${manualInstant ? "text-muted-foreground" : "text-red-500"}`}
                      >
                        {manualInstant
                          ? `Read as: ${manualInstant.interpreted}`
                          : "Could not parse this input"}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={resetToNow}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to now
                  </Button>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Source timezone</Label>
                <Select value={sourceTz} onValueChange={setSourceTz}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {Array.from(new Set([localTz, sourceTz, ...zones])).map(
                      (tz) => (
                        <SelectItem key={tz} value={tz}>
                          {getTimezoneMeta(tz).city}
                          {tz === localTz ? " (your zone)" : ""}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Bare wall-clock inputs are interpreted in this zone.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe2 className="h-4 w-4" />
                Timezones ({zones.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TimezonePicker
                selected={zones}
                onSelect={addZone}
                now={instant}
              />

              {zones.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sortedRows.map((r) => (
                    <Badge
                      key={r.tz}
                      variant="secondary"
                      className="gap-1 py-1 pr-1"
                    >
                      <span className="max-w-[10rem] truncate">
                        {r.meta.city}
                      </span>
                      <button
                        onClick={() => removeZone(r.tz)}
                        className="rounded p-0.5 hover:bg-background/60"
                        aria-label={`Remove ${r.meta.city}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {zones.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => setZones([])}
                >
                  Clear all
                </Button>
              )}

              <div className="space-y-1.5 border-t pt-3">
                <Label className="text-xs">Quick presets</Label>
                <div className="grid gap-1.5">
                  {TIMEZONE_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      className="rounded-md border px-2.5 py-1.5 text-left transition-colors hover:bg-accent"
                    >
                      <span className="block text-xs font-medium">
                        {p.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {p.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">12-hour clock</Label>
                <Switch checked={hour12} onCheckedChange={setHour12} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Show seconds</Label>
                <Switch
                  checked={showSeconds}
                  onCheckedChange={setShowSeconds}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date format</Label>
                <Select
                  value={dateStyle}
                  onValueChange={(v) =>
                    setDateStyle(v as "short" | "medium" | "full")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (Jul 15)</SelectItem>
                    <SelectItem value="medium">
                      Medium (Jul 15, 2025)
                    </SelectItem>
                    <SelectItem value="full">Full (July 15, 2025)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t pt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Work starts</Label>
                  <Select
                    value={String(workStart)}
                    onValueChange={(v) => setWorkStart(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Work ends</Label>
                  <Select
                    value={String(workEnd)}
                    onValueChange={(v) => setWorkEnd(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, "0")}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!liveMode && (
                <div className="space-y-1.5 border-t pt-3">
                  <Label className="text-xs">
                    When a local time occurs twice
                  </Label>
                  <Select
                    value={ambiguityPreference}
                    onValueChange={(v) =>
                      setAmbiguityPreference(v as "earlier" | "later")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="earlier">
                        Use the first (DST)
                      </SelectItem>
                      <SelectItem value="later">
                        Use the second (standard)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Results ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          {zones.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Globe2 className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No timezones selected</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Add a timezone or load a preset to start comparing times side
                  by side.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="cards">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cards" className="text-xs sm:text-sm">
                  Clocks
                </TabsTrigger>
                <TabsTrigger value="table" className="text-xs sm:text-sm">
                  Table
                </TabsTrigger>
                <TabsTrigger value="planner" className="text-xs sm:text-sm">
                  Planner
                </TabsTrigger>
                <TabsTrigger value="dst" className="text-xs sm:text-sm">
                  DST
                </TabsTrigger>
              </TabsList>

              {/* ── Clocks ─────────────────────────────────────────────── */}
              <TabsContent value="cards" className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    {liveMode ? (
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        Live · updating every second
                      </span>
                    ) : (
                      `Showing a fixed moment · ${getRelativeTime(instant, now)}`
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={copySummary}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={copyShareLink}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={exportJSON}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">JSON</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={exportCSV}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">CSV</span>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {sortedRows.map((r) => (
                    <Card
                      key={r.tz}
                      className={`overflow-hidden transition-shadow hover:shadow-md ${
                        r.tz === sourceTz ? "ring-2 ring-sky-500/50" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-semibold">
                                {r.meta.city}
                              </p>
                              {r.tz === sourceTz && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 px-1 py-0 text-[10px]"
                                >
                                  source
                                </Badge>
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {r.meta.country}
                            </p>
                          </div>
                          <button
                            onClick={() => removeZone(r.tz)}
                            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label={`Remove ${r.meta.city}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            copyToClipboard(
                              `${r.formatted.time} ${r.abbreviation}`,
                              r.meta.city,
                            )
                          }
                          className="group flex w-full items-baseline gap-2 text-left"
                        >
                          <span className="font-mono text-2xl font-bold tabular-nums sm:text-3xl">
                            {r.formatted.time}
                          </span>
                          <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {r.formatted.weekday}, {r.formatted.date}
                          {r.dayDiff !== 0 && (
                            <span
                              className={`ml-1.5 font-medium ${
                                r.dayDiff > 0
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-orange-600 dark:text-orange-400"
                              }`}
                            >
                              {r.dayDiff > 0 ? "+1 day" : "−1 day"}
                            </span>
                          )}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {r.offsetLabel}
                          </Badge>
                          {r.abbreviation && (
                            <Badge variant="secondary" className="text-xs">
                              {r.abbreviation}
                            </Badge>
                          )}
                          {r.dst && (
                            <Badge className="gap-1 bg-amber-500 text-xs text-white hover:bg-amber-500/90">
                              <Sun className="h-3 w-3" />
                              DST
                            </Badge>
                          )}
                          {r.weekend && (
                            <Badge variant="outline" className="text-xs">
                              Weekend
                            </Badge>
                          )}
                          <span
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${PERIOD_STYLES[r.period].cell}`}
                          >
                            {r.period === "night" ? (
                              <Moon className="h-3 w-3" />
                            ) : r.period === "early" ? (
                              <Sunrise className="h-3 w-3" />
                            ) : r.period === "evening" ? (
                              <Sunset className="h-3 w-3" />
                            ) : (
                              <Sun className="h-3 w-3" />
                            )}
                            {PERIOD_STYLES[r.period].label}
                          </span>
                        </div>

                        {r.tz !== sourceTz && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatOffsetDifference(r.diffFromSource)} of{" "}
                            {getTimezoneMeta(sourceTz).city}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ── Table ──────────────────────────────────────────────── */}
              <TabsContent value="table" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[46rem] text-sm">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="px-3 py-2.5 text-left font-medium">
                              Location
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium">
                              Time
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium">
                              Date
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium">
                              Offset
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium">
                              Zone
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium">
                              vs source
                            </th>
                            <th className="px-3 py-2.5 text-left font-medium">
                              ISO 8601
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedRows.map((r) => (
                            <tr
                              key={r.tz}
                              className="border-b transition-colors last:border-0 hover:bg-muted/30"
                            >
                              <td className="px-3 py-2.5">
                                <span className="block font-medium">
                                  {r.meta.city}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {r.tz}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 font-mono tabular-nums">
                                {r.formatted.time}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5">
                                {r.formatted.weekday}, {r.formatted.date}
                                {r.dayDiff !== 0 && (
                                  <span className="ml-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                                    {r.dayDiff > 0 ? "+1d" : "−1d"}
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">
                                {r.offsetLabel}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5">
                                <span className="flex items-center gap-1">
                                  {r.abbreviation}
                                  {r.dst && (
                                    <Sun className="h-3 w-3 text-amber-500" />
                                  )}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                                {r.tz === sourceTz
                                  ? "—"
                                  : formatOffsetDifference(r.diffFromSource)}
                              </td>
                              <td className="px-3 py-2.5">
                                <button
                                  onClick={() =>
                                    copyToClipboard(r.iso, "ISO timestamp")
                                  }
                                  className="group flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <span className="whitespace-nowrap">
                                    {r.iso}
                                  </span>
                                  <Copy className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                <p className="mt-2 px-1 text-xs text-muted-foreground sm:hidden">
                  Swipe the table horizontally to see all columns.
                </p>
              </TabsContent>

              {/* ── Meeting planner ────────────────────────────────────── */}
              <TabsContent value="planner" className="mt-4 space-y-4">
                {bestSlots.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Star className="h-4 w-4 text-amber-500" />
                        Best meeting times
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {bestSlots.map(({ slot, workCount }) => (
                        <button
                          key={slot}
                          onClick={() => {
                            const w = getWallClock(slot, sourceTz);
                            const p = (n: number) => String(n).padStart(2, "0");
                            setDateInput(`${w.year}-${p(w.month)}-${p(w.day)}`);
                            setTimeInput(`${p(w.hour)}:${p(w.minute)}`);
                            setFlexibleInput("");
                            setLiveMode(false);
                            toast.success("Applied this time slot");
                          }}
                          className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                        >
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {sortedRows.map((r) => {
                              const t = formatInZone(slot, r.tz, fmtOpts);
                              return (
                                <span
                                  key={r.tz}
                                  className="text-xs text-muted-foreground"
                                >
                                  <span className="font-medium text-foreground">
                                    {r.meta.city}
                                  </span>{" "}
                                  {t.time}
                                </span>
                              );
                            })}
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {workCount}/{sortedRows.length} in work hours
                          </Badge>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4" />
                      24-hour overlap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3 sm:p-6 sm:pt-0">
                    <div className="flex flex-wrap gap-3 text-xs">
                      {(Object.keys(PERIOD_STYLES) as DayPeriodKey[]).map(
                        (k) => (
                          <span key={k} className="flex items-center gap-1.5">
                            <span
                              className={`h-2.5 w-2.5 rounded-sm ${PERIOD_STYLES[k].dot}`}
                            />
                            {PERIOD_STYLES[k].label}
                          </span>
                        ),
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[44rem] border-separate border-spacing-0.5 text-center text-xs">
                        <thead>
                          <tr>
                            <th className="sticky left-0 z-10 bg-background px-2 py-1 text-left font-medium">
                              City
                            </th>
                            {plannerHours.map((h, i) => {
                              const hourLabel = String(
                                getWallClock(h, sourceTz).hour,
                              ).padStart(2, "0");
                              // On a fall-back day the same wall hour appears
                              // twice; mark the repeat so the column is legible.
                              const prevLabel =
                                i > 0
                                  ? String(
                                      getWallClock(
                                        plannerHours[i - 1],
                                        sourceTz,
                                      ).hour,
                                    ).padStart(2, "0")
                                  : null;
                              const repeated = prevLabel === hourLabel;
                              return (
                                <th
                                  key={h}
                                  title={
                                    repeated
                                      ? `${hourLabel}:00 (second occurrence — clocks fell back)`
                                      : `${hourLabel}:00`
                                  }
                                  className="px-0.5 py-1 font-normal text-muted-foreground"
                                >
                                  {hourLabel}
                                  {repeated && (
                                    <span className="text-amber-500">*</span>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedRows.map((r) => (
                            <tr key={r.tz}>
                              <td className="sticky left-0 z-10 max-w-[7rem] truncate bg-background px-2 py-1 text-left font-medium">
                                {r.meta.city}
                              </td>
                              {plannerHours.map((h) => {
                                const wall = getWallClock(h, r.tz);
                                const period = classifyHour(
                                  wall.hour,
                                  workStart,
                                  workEnd,
                                ) as DayPeriodKey;
                                return (
                                  <td
                                    key={h}
                                    title={`${r.meta.city} — ${formatInZone(h, r.tz, fmtOpts).time}`}
                                    className={`rounded-sm px-0.5 py-1 tabular-nums ${PERIOD_STYLES[period].cell}`}
                                  >
                                    {String(wall.hour).padStart(2, "0")}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Column headers show the hour in{" "}
                      {getTimezoneMeta(sourceTz).city}. An{" "}
                      <span className="text-amber-500">*</span> marks an hour
                      that repeats because clocks fell back. Scroll sideways on
                      small screens.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── DST detail ─────────────────────────────────────────── */}
              <TabsContent value="dst" className="mt-4 space-y-3">
                {sortedRows.map((r) => {
                  const upcoming = getUpcomingTransitions(instant, r.tz, 3);
                  const stdOffset = getStandardOffsetMinutes(instant, r.tz);
                  return (
                    <Card key={r.tz}>
                      <CardContent className="p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold">{r.meta.city}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {r.longName || r.tz}
                            </p>
                          </div>
                          {r.usesDst ? (
                            <Badge
                              className={
                                r.dst
                                  ? "gap-1 bg-amber-500 text-white hover:bg-amber-500/90"
                                  : "gap-1"
                              }
                              variant={r.dst ? "default" : "secondary"}
                            >
                              {r.dst ? (
                                <>
                                  <Sun className="h-3 w-3" /> On DST now
                                </>
                              ) : (
                                <>
                                  <Moon className="h-3 w-3" /> Standard time
                                </>
                              )}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No DST observed</Badge>
                          )}
                        </div>

                        <div className="grid gap-2 text-xs sm:grid-cols-3">
                          <div className="rounded-md border p-2">
                            <p className="text-muted-foreground">
                              Current offset
                            </p>
                            <p className="font-mono text-sm font-semibold">
                              {r.offsetLabel}
                            </p>
                          </div>
                          <div className="rounded-md border p-2">
                            <p className="text-muted-foreground">
                              Standard offset
                            </p>
                            <p className="font-mono text-sm font-semibold">
                              {formatOffset(stdOffset)}
                            </p>
                          </div>
                          <div className="rounded-md border p-2">
                            <p className="text-muted-foreground">
                              DST shift applied
                            </p>
                            <p className="font-mono text-sm font-semibold">
                              {r.offset === stdOffset
                                ? "none"
                                : `+${r.offset - stdOffset}m`}
                            </p>
                          </div>
                        </div>

                        {upcoming.length > 0 ? (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">
                              Upcoming clock changes
                            </p>
                            {upcoming.map((t) => (
                              <div
                                key={t.at}
                                className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs"
                              >
                                <ArrowRight
                                  className={`h-3.5 w-3.5 shrink-0 ${
                                    t.deltaMinutes > 0
                                      ? "text-amber-500"
                                      : "text-sky-500"
                                  }`}
                                />
                                <span className="font-medium">
                                  {t.deltaMinutes > 0
                                    ? "Spring forward"
                                    : "Fall back"}{" "}
                                  {Math.abs(t.deltaMinutes)}m
                                </span>
                                <span className="text-muted-foreground">
                                  {
                                    formatInZone(t.at, r.tz, {
                                      ...fmtOpts,
                                      dateStyle: "medium",
                                    }).date
                                  }{" "}
                                  · {formatOffset(t.offsetBefore)} →{" "}
                                  {formatOffset(t.offsetAfter)}
                                </span>
                                <span className="text-muted-foreground">
                                  ({getRelativeTime(t.at, instant)})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-muted-foreground">
                            No upcoming clock changes — this zone keeps a fixed
                            UTC offset.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </ToolsWrapper>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Read a shared zone list out of the URL hash (#tz=A,B,C). */
function readZonesFromHash(): string[] | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("tz=")) return null;
  const list = decodeURIComponent(hash.slice(3))
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && isValidTimezone(s));
  return list.length ? list : null;
}

/** Sensible starting set: the viewer's own zone plus common business hubs. */
function defaultZonesFor(local: string): string[] {
  const base = [
    "America/Los_Angeles",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
  ];
  return Array.from(new Set([local, ...base])).slice(0, 5);
}
