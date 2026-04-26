"use client";

import { toast } from "sonner";
import React, { useState, useMemo, useCallback } from "react";
import {
  Type,
  Copy,
  RotateCcw,
  Hash,
  AlignLeft,
  CaseSensitive,
  BarChart2,
  Regex,
  ListOrdered,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

// ─── helpers ────────────────────────────────────────────────────────────────

function toTitleCase(s: string) {
  return s.replace(
    /\w\S*/g,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );
}

function toSentenceCase(s: string) {
  return s
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
}

function toCamelCase(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase());
}

function toPascalCase(s: string) {
  const c = toCamelCase(s);
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function toSnakeCase(s: string) {
  return s
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
}

function toKebabCase(s: string) {
  return s
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
}

function toConstantCase(s: string) {
  return toSnakeCase(s).toUpperCase();
}

function toDotCase(s: string) {
  return s
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .toLowerCase();
}

function toAlternatingCase(s: string) {
  return s
    .split("")
    .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
    .join("");
}

function toInverseCase(s: string) {
  return s
    .split("")
    .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
    .join("");
}

function stripExtraSpaces(s: string) {
  return s.replace(/[ \t]+/g, " ").trim();
}

function reverseText(s: string) {
  return s.split("").reverse().join("");
}

function reverseWords(s: string) {
  return s.split(/\s+/).reverse().join(" ");
}

function removeDuplicateLines(s: string) {
  const seen = new Set<string>();
  return s
    .split("\n")
    .filter((l) => {
      if (seen.has(l)) return false;
      seen.add(l);
      return true;
    })
    .join("\n");
}

function sortLines(s: string, dir: "asc" | "desc") {
  const lines = s.split("\n");
  lines.sort((a, b) => a.localeCompare(b));
  if (dir === "desc") lines.reverse();
  return lines.join("\n");
}

// ─── analysis ───────────────────────────────────────────────────────────────

interface Stats {
  chars: number;
  charsNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  spaces: number;
  digits: number;
  letters: number;
  uppercase: number;
  lowercase: number;
  punctuation: number;
  specialChars: string[];
  uniqueWords: number;
  avgWordLength: number;
  avgSentenceLength: number;
  longestWord: string;
  shortestWord: string;
  readingTimeMin: number;
  speakingTimeMin: number;
  wordFrequency: [string, number][];
  charFrequency: [string, number][];
}

function analyze(text: string): Stats {
  const chars = text.length;
  const spaces = (text.match(/ /g) ?? []).length;
  const charsNoSpaces = chars - spaces;
  const digits = (text.match(/\d/g) ?? []).length;
  const letters = (text.match(/[a-zA-Z]/g) ?? []).length;
  const uppercase = (text.match(/[A-Z]/g) ?? []).length;
  const lowercase = (text.match(/[a-z]/g) ?? []).length;
  const punctuation = (
    text.match(/[.,!?;:'"()\-[\]{}/\\@#$%^&*+=<>|~`]/g) ?? []
  ).length;

  const specialSet = new Set<string>();
  for (const c of text) {
    if (!/[a-zA-Z0-9\s]/.test(c)) specialSet.add(c);
  }
  const specialChars = [...specialSet].sort();

  const rawWords = text.trim() === "" ? [] : text.trim().split(/\s+/);
  const words = rawWords.length;
  const sentences =
    text === ""
      ? 0
      : (text.match(/[^.!?]*[.!?]+/g) ?? []).length || (text.trim() ? 1 : 0);
  const paragraphs =
    text === ""
      ? 0
      : text.split(/\n\s*\n/).filter((p) => p.trim()).length ||
        (text.trim() ? 1 : 0);
  const lines = text === "" ? 0 : text.split("\n").length;

  const uniqueWords = new Set(
    rawWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")),
  ).size;
  const totalWordLen = rawWords.reduce(
    (s, w) => s + w.replace(/[^a-zA-Z0-9]/g, "").length,
    0,
  );
  const avgWordLength = words > 0 ? totalWordLen / words : 0;
  const avgSentenceLength = sentences > 0 ? words / sentences : 0;

  const sorted = [...rawWords].sort((a, b) => b.length - a.length);
  const longestWord = sorted[0] ?? "";
  const shortestWord = sorted[sorted.length - 1] ?? "";

  const readingTimeMin = words / 238;
  const speakingTimeMin = words / 130;

  // word frequency (top 20, ignore stop words of len ≤ 2)
  const wfreq: Record<string, number> = {};
  for (const w of rawWords) {
    const k = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (k.length > 2) wfreq[k] = (wfreq[k] ?? 0) + 1;
  }
  const wordFrequency = Object.entries(wfreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20) as [string, number][];

  // char frequency (letters only, top 15)
  const cfreq: Record<string, number> = {};
  for (const c of text.toLowerCase()) {
    if (/[a-z]/.test(c)) cfreq[c] = (cfreq[c] ?? 0) + 1;
  }
  const charFrequency = Object.entries(cfreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15) as [string, number][];

  return {
    chars,
    charsNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    spaces,
    digits,
    letters,
    uppercase,
    lowercase,
    punctuation,
    specialChars,
    uniqueWords,
    avgWordLength,
    avgSentenceLength,
    longestWord,
    shortestWord,
    readingTimeMin,
    speakingTimeMin,
    wordFrequency,
    charFrequency,
  };
}

function formatTime(min: number) {
  if (min < 1) return `${Math.round(min * 60)}s`;
  return `${Math.floor(min)}m ${Math.round((min % 1) * 60)}s`;
}

// ─── case transforms ─────────────────────────────────────────────────────────

const CASE_TRANSFORMS: {
  label: string;
  key: string;
  fn: (s: string) => string;
}[] = [
  { label: "UPPERCASE", key: "upper", fn: (s) => s.toUpperCase() },
  { label: "lowercase", key: "lower", fn: (s) => s.toLowerCase() },
  { label: "Title Case", key: "title", fn: toTitleCase },
  { label: "Sentence case", key: "sentence", fn: toSentenceCase },
  { label: "camelCase", key: "camel", fn: toCamelCase },
  { label: "PascalCase", key: "pascal", fn: toPascalCase },
  { label: "snake_case", key: "snake", fn: toSnakeCase },
  { label: "kebab-case", key: "kebab", fn: toKebabCase },
  { label: "CONSTANT_CASE", key: "constant", fn: toConstantCase },
  { label: "dot.case", key: "dot", fn: toDotCase },
  { label: "aLtErNaTiNg", key: "alternating", fn: toAlternatingCase },
  { label: "iNVERSE cASE", key: "inverse", fn: toInverseCase },
];

// ─── component ───────────────────────────────────────────────────────────────

export default function TextAnalyzer() {
  const [text, setText] = useState("");

  const stats = useMemo(() => analyze(text), [text]);

  const copy = useCallback(async (s: string, label: string) => {
    try {
      await navigator.clipboard.writeText(s);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  const applyTransform = useCallback(
    (fn: (s: string) => string) => {
      setText(fn(text));
      toast.success("Text transformed");
    },
    [text],
  );

  const maxWFreq = stats.wordFrequency[0]?.[1] ?? 1;
  const maxCFreq = stats.charFrequency[0]?.[1] ?? 1;

  return (
    <ToolsWrapper>
      {/* header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-white">
          <Type className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
          Text Analyzer
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Analyze, transform, and inspect text — word counts, case conversion,
          frequency analysis, and more
        </p>
      </div>

      {/* live stat bar */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { label: "Characters", value: stats.chars },
          { label: "No Spaces", value: stats.charsNoSpaces },
          { label: "Words", value: stats.words },
          { label: "Sentences", value: stats.sentences },
          { label: "Lines", value: stats.lines },
          { label: "Paragraphs", value: stats.paragraphs },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="text-2xl font-bold text-violet-600">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* left: textarea */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <AlignLeft className="h-4 w-4" /> Input Text
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-gray-400"
                  onClick={() => setText("")}
                >
                  <RotateCcw className="mr-1 h-3 w-3" /> Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="h-[420px] w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Paste or type your text here…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy(text, "Text")}
                  disabled={!text}
                >
                  <Copy className="mr-1 h-3 w-3" /> Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* right: tabs */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="stats">
            <TabsList className="mb-4 grid w-full grid-cols-4">
              <TabsTrigger value="stats" className="flex items-center gap-1">
                <Hash className="h-3 w-3" /> Stats
              </TabsTrigger>
              <TabsTrigger value="case" className="flex items-center gap-1">
                <CaseSensitive className="h-3 w-3" /> Case
              </TabsTrigger>
              <TabsTrigger
                value="frequency"
                className="flex items-center gap-1"
              >
                <BarChart2 className="h-3 w-3" /> Frequency
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-1">
                <Regex className="h-3 w-3" /> Tools
              </TabsTrigger>
            </TabsList>

            {/* ── STATS TAB ── */}
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Character Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { label: "Total Characters", value: stats.chars },
                      { label: "Without Spaces", value: stats.charsNoSpaces },
                      { label: "Spaces", value: stats.spaces },
                      { label: "Letters", value: stats.letters },
                      { label: "Digits", value: stats.digits },
                      { label: "Punctuation", value: stats.punctuation },
                      { label: "Uppercase", value: stats.uppercase },
                      { label: "Lowercase", value: stats.lowercase },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
                      >
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {value}
                        </p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Word &amp; Sentence Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { label: "Total Words", value: stats.words },
                      { label: "Unique Words", value: stats.uniqueWords },
                      {
                        label: "Avg Word Length",
                        value: stats.avgWordLength.toFixed(1),
                      },
                      { label: "Sentences", value: stats.sentences },
                      {
                        label: "Avg Sentence Length",
                        value: stats.avgSentenceLength.toFixed(1) + " words",
                      },
                      { label: "Paragraphs", value: stats.paragraphs },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
                      >
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {value}
                        </p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Reading &amp; Speaking Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
                    <p className="text-xl font-bold text-blue-600">
                      {formatTime(stats.readingTimeMin)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Reading (238 wpm avg)
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20">
                    <p className="text-xl font-bold text-green-600">
                      {formatTime(stats.speakingTimeMin)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Speaking (130 wpm avg)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Word Extremes</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Longest word</p>
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
                      {stats.longestWord || "—"}
                    </code>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Shortest word</p>
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
                      {stats.shortestWord || "—"}
                    </code>
                  </div>
                </CardContent>
              </Card>

              {stats.specialChars.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Special Characters Used ({stats.specialChars.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {stats.specialChars.map((c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="cursor-pointer font-mono text-sm"
                          onClick={() => copy(c, `"${c}"`)}
                          title="Click to copy"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── CASE TAB ── */}
            <TabsContent value="case">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CaseSensitive className="h-4 w-4" /> Case Transformations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!text && (
                    <p className="text-sm text-gray-500">
                      Enter text in the input to see transformations.
                    </p>
                  )}
                  {CASE_TRANSFORMS.map(({ label, key, fn }) => {
                    const result = text ? fn(text) : "";
                    return (
                      <div
                        key={key}
                        className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="mb-0.5 text-xs font-medium text-gray-500">
                            {label}
                          </p>
                          <p className="truncate text-sm text-gray-800 dark:text-gray-200">
                            {result || (
                              <span className="italic text-gray-400">—</span>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            disabled={!text}
                            onClick={() => copy(result, label)}
                            title="Copy"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            disabled={!text}
                            onClick={() => applyTransform(fn)}
                            title="Apply to input"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── FREQUENCY TAB ── */}
            <TabsContent value="frequency" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ListOrdered className="h-4 w-4" /> Word Frequency (top 20)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.wordFrequency.length === 0 ? (
                    <p className="text-sm text-gray-500">No words yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {stats.wordFrequency.map(([word, count]) => (
                        <div key={word} className="flex items-center gap-2">
                          <span className="w-28 shrink-0 font-mono text-sm text-gray-800 dark:text-gray-200">
                            {word}
                          </span>
                          <div className="flex flex-1 items-center gap-2">
                            <div
                              className="h-2 rounded-full bg-violet-400"
                              style={{
                                width: `${(count / maxWFreq) * 100}%`,
                              }}
                            />
                            <span className="text-xs text-gray-500">
                              {count}×
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart2 className="h-4 w-4" /> Character Frequency
                    (letters, top 15)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.charFrequency.length === 0 ? (
                    <p className="text-sm text-gray-500">No letters yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {stats.charFrequency.map(([char, count]) => (
                        <div key={char} className="flex items-center gap-2">
                          <span className="w-6 shrink-0 font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                            {char}
                          </span>
                          <div className="flex flex-1 items-center gap-2">
                            <div
                              className="h-2 rounded-full bg-blue-400"
                              style={{
                                width: `${(count / maxCFreq) * 100}%`,
                              }}
                            />
                            <span className="text-xs text-gray-500">
                              {count}×
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TOOLS TAB ── */}
            <TabsContent value="tools" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Text Transformations
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {[
                    {
                      label: "Strip Extra Spaces",
                      fn: stripExtraSpaces,
                    },
                    {
                      label: "Reverse Text",
                      fn: reverseText,
                    },
                    {
                      label: "Reverse Words",
                      fn: reverseWords,
                    },
                    {
                      label: "Remove Duplicate Lines",
                      fn: removeDuplicateLines,
                    },
                    {
                      label: "Sort Lines A→Z",
                      fn: (s: string) => sortLines(s, "asc"),
                    },
                    {
                      label: "Sort Lines Z→A",
                      fn: (s: string) => sortLines(s, "desc"),
                    },
                    {
                      label: "Remove Empty Lines",
                      fn: (s: string) =>
                        s
                          .split("\n")
                          .filter((l) => l.trim())
                          .join("\n"),
                    },
                    {
                      label: "Trim Each Line",
                      fn: (s: string) =>
                        s
                          .split("\n")
                          .map((l) => l.trim())
                          .join("\n"),
                    },
                    {
                      label: "Remove Numbers",
                      fn: (s: string) => s.replace(/\d/g, ""),
                    },
                    {
                      label: "Remove Punctuation",
                      fn: (s: string) =>
                        s.replace(/[.,!?;:'"()\-[\]{}/\\@#$%^&*+=<>|~`]/g, ""),
                    },
                    {
                      label: "Remove Special Chars",
                      fn: (s: string) => s.replace(/[^a-zA-Z0-9\s]/g, ""),
                    },
                    {
                      label: "Collapse Newlines",
                      fn: (s: string) => s.replace(/\n+/g, "\n").trim(),
                    },
                  ].map(({ label, fn }) => (
                    <Button
                      key={label}
                      variant="outline"
                      size="sm"
                      disabled={!text}
                      onClick={() => applyTransform(fn)}
                    >
                      {label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Find &amp; Replace</CardTitle>
                </CardHeader>
                <FindReplace text={text} setText={setText} />
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Add Prefix / Suffix to Each Line
                  </CardTitle>
                </CardHeader>
                <PrefixSuffix text={text} setText={setText} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ToolsWrapper>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function FindReplace({
  text,
  setText,
}: {
  text: string;
  setText: (s: string) => void;
}) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const count = useMemo(() => {
    if (!find || !text) return 0;
    try {
      const flags = caseSensitive ? "g" : "gi";
      const pattern = useRegex
        ? find
        : find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return (text.match(new RegExp(pattern, flags)) ?? []).length;
    } catch {
      return 0;
    }
  }, [find, text, useRegex, caseSensitive]);

  const handleReplace = () => {
    if (!find) return;
    try {
      const flags = caseSensitive ? "g" : "gi";
      const pattern = useRegex
        ? find
        : find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      setText(text.replace(new RegExp(pattern, flags), replace));
      toast.success(`Replaced ${count} occurrence${count !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Invalid regular expression");
    }
  };

  return (
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Find</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Search…"
            value={find}
            onChange={(e) => setFind(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Replace with</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="Replacement…"
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={useRegex}
            onChange={(e) => setUseRegex(e.target.checked)}
          />
          Regex
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Case sensitive
        </label>
        {find && (
          <span className="font-medium text-violet-600">
            {count} match{count !== 1 ? "es" : ""}
          </span>
        )}
      </div>
      <Button size="sm" disabled={!find || !text} onClick={handleReplace}>
        Replace All
      </Button>
    </CardContent>
  );
}

function PrefixSuffix({
  text,
  setText,
}: {
  text: string;
  setText: (s: string) => void;
}) {
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");

  const handleApply = () => {
    if (!prefix && !suffix) return;
    const result = text
      .split("\n")
      .map((l) => `${prefix}${l}${suffix}`)
      .join("\n");
    setText(result);
    toast.success("Prefix/suffix applied");
  };

  return (
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Prefix</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder='e.g. "- " or "  "'
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Suffix</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder='e.g. "," or ";"'
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
          />
        </div>
      </div>
      <Button
        size="sm"
        disabled={!text || (!prefix && !suffix)}
        onClick={handleApply}
      >
        Apply to Each Line
      </Button>
    </CardContent>
  );
}
