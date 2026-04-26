"use client";

import { toast } from "sonner";
import React, { useState, useCallback, useMemo } from "react";
import {
  Search,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface DateFilter {
  type: "none" | "before" | "after" | "between" | "past";
  before?: string;
  after?: string;
  past?: string;
}

interface GoogleFilters {
  query: string;
  exactPhrase: string;
  anyWords: string;
  noneWords: string;
  site: string;
  inTitle: string;
  inUrl: string;
  inText: string;
  fileType: string;
  language: string;
  dateFilter: DateFilter;
  relatedSite: string;
  linkTo: string;
  intitle: boolean;
  inanchor: boolean;
}

interface YouTubeFilters {
  query: string;
  exactPhrase: string;
  noneWords: string;
  channel: string;
  duration: string;
  uploadDate: string;
  beforeDate: string;
  afterDate: string;
  sortBy: string;
  subtitles: boolean;
  hd: boolean;
  liveOnly: boolean;
  creative: boolean;
}

const NONE = "__none__";
const sel = (v: string) => (v === "" ? NONE : v);
const desel = (v: string) => (v === NONE ? "" : v);

const FILE_TYPES = [
  { value: NONE, label: "Any" },
  { value: "pdf", label: "PDF" },
  { value: "doc", label: "DOC" },
  { value: "docx", label: "DOCX" },
  { value: "xls", label: "XLS" },
  { value: "xlsx", label: "XLSX" },
  { value: "ppt", label: "PPT" },
  { value: "pptx", label: "PPTX" },
  { value: "txt", label: "TXT" },
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "zip", label: "ZIP" },
  { value: "mp3", label: "MP3" },
  { value: "mp4", label: "MP4" },
];

const LANGUAGES = [
  { value: NONE, label: "Any Language" },
  { value: "lang_en", label: "English" },
  { value: "lang_es", label: "Spanish" },
  { value: "lang_fr", label: "French" },
  { value: "lang_de", label: "German" },
  { value: "lang_it", label: "Italian" },
  { value: "lang_pt", label: "Portuguese" },
  { value: "lang_ru", label: "Russian" },
  { value: "lang_ja", label: "Japanese" },
  { value: "lang_ko", label: "Korean" },
  { value: "lang_zh-CN", label: "Chinese (Simplified)" },
  { value: "lang_ar", label: "Arabic" },
  { value: "lang_hi", label: "Hindi" },
];

const PAST_OPTIONS = [
  { value: NONE, label: "Any Time" },
  { value: "d", label: "Past 24 Hours" },
  { value: "w", label: "Past Week" },
  { value: "m", label: "Past Month" },
  { value: "y", label: "Past Year" },
];

const YT_DURATION = [
  { value: NONE, label: "Any Duration" },
  { value: "short", label: "Short (< 4 min)" },
  { value: "medium", label: "Medium (4–20 min)" },
  { value: "long", label: "Long (> 20 min)" },
];

const YT_UPLOAD = [
  { value: NONE, label: "Any Time" },
  { value: "hour", label: "Last Hour" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const YT_SORT = [
  { value: NONE, label: "Relevance" },
  { value: "upload_date", label: "Upload Date" },
  { value: "view_count", label: "View Count" },
  { value: "rating", label: "Rating" },
];

function buildGoogleQuery(f: GoogleFilters): string {
  const parts: string[] = [];

  if (f.query.trim()) parts.push(f.query.trim());
  if (f.exactPhrase.trim()) parts.push(`"${f.exactPhrase.trim()}"`);
  if (f.anyWords.trim()) {
    const words = f.anyWords
      .trim()
      .split(/\s+/)
      .map((w) => w)
      .join(" OR ");
    parts.push(`(${words})`);
  }
  if (f.noneWords.trim()) {
    f.noneWords
      .trim()
      .split(/\s+/)
      .forEach((w) => parts.push(`-${w}`));
  }
  if (f.site.trim()) parts.push(`site:${f.site.trim()}`);
  if (f.inTitle.trim()) parts.push(`intitle:${f.inTitle.trim()}`);
  if (f.inUrl.trim()) parts.push(`inurl:${f.inUrl.trim()}`);
  if (f.inText.trim()) parts.push(`intext:${f.inText.trim()}`);
  if (f.fileType) parts.push(`filetype:${f.fileType}`);
  if (f.relatedSite.trim()) parts.push(`related:${f.relatedSite.trim()}`);
  if (f.linkTo.trim()) parts.push(`link:${f.linkTo.trim()}`);

  return parts.join(" ");
}

function buildGoogleUrl(f: GoogleFilters): string {
  const q = buildGoogleQuery(f);
  if (!q) return "";

  const params = new URLSearchParams();
  params.set("q", q);

  if (f.language) params.set("lr", f.language);
  if (f.dateFilter.past) {
    params.set("tbs", `qdr:${f.dateFilter.past}`);
  } else if (f.dateFilter.type === "before" && f.dateFilter.before) {
    const d = f.dateFilter.before.replace(/-/g, "/");
    params.set("tbs", `cdr:1,cd_max:${d}`);
  } else if (f.dateFilter.type === "after" && f.dateFilter.after) {
    const d = f.dateFilter.after.replace(/-/g, "/");
    params.set("tbs", `cdr:1,cd_min:${d}`);
  } else if (
    f.dateFilter.type === "between" &&
    f.dateFilter.after &&
    f.dateFilter.before
  ) {
    const dmin = f.dateFilter.after.replace(/-/g, "/");
    const dmax = f.dateFilter.before.replace(/-/g, "/");
    params.set("tbs", `cdr:1,cd_min:${dmin},cd_max:${dmax}`);
  }

  return `https://www.google.com/search?${params.toString()}`;
}

function buildYouTubeQuery(f: YouTubeFilters): string {
  const parts: string[] = [];
  if (f.query.trim()) parts.push(f.query.trim());
  if (f.exactPhrase.trim()) parts.push(`"${f.exactPhrase.trim()}"`);
  if (f.noneWords.trim()) {
    f.noneWords
      .trim()
      .split(/\s+/)
      .forEach((w) => parts.push(`-${w}`));
  }
  if (f.channel.trim()) parts.push(`channel:${f.channel.trim()}`);
  if (f.afterDate) parts.push(`after:${f.afterDate}`);
  if (f.beforeDate) parts.push(`before:${f.beforeDate}`);
  return parts.join(" ");
}

function buildYouTubeUrl(f: YouTubeFilters): string {
  let q = buildYouTubeQuery(f);
  if (f.beforeDate) q += ` before:${f.beforeDate}`;
  if (f.afterDate) q += ` after:${f.afterDate}`;
  q = q.trim();
  if (!q) return "";

  const params = new URLSearchParams();
  params.set("search_query", q);

  const sp: string[] = [];
  if (f.duration)
    sp.push(
      `EG${f.duration === "short" ? "2" : f.duration === "medium" ? "3" : "4"}AA`,
    );
  if (f.uploadDate) {
    const uploadMap: Record<string, string> = {
      hour: "EgIIAQ%3D%3D",
      today: "EgIIAg%3D%3D",
      week: "EgIIAw%3D%3D",
      month: "EgIIBA%3D%3D",
      year: "EgIIBQ%3D%3D",
    };
    if (uploadMap[f.uploadDate]) {
      params.set("sp", uploadMap[f.uploadDate]);
      return `https://www.youtube.com/results?${params.toString()}`;
    }
  }
  if (f.sortBy) {
    const sortMap: Record<string, string> = {
      upload_date: "CAI",
      view_count: "CAM",
      rating: "CAE",
    };
    if (sortMap[f.sortBy]) params.set("sp", sortMap[f.sortBy]);
  }
  if (f.hd) params.set("sp", "EgIQAQ%3D%3D");
  if (f.liveOnly) params.set("sp", "EgJAAQ%3D%3D");

  void sp;
  return `https://www.youtube.com/results?${params.toString()}`;
}

const defaultGoogle: GoogleFilters = {
  query: "",
  exactPhrase: "",
  anyWords: "",
  noneWords: "",
  site: "",
  inTitle: "",
  inUrl: "",
  inText: "",
  fileType: "",
  language: "",
  dateFilter: { type: "none" },
  relatedSite: "",
  linkTo: "",
  intitle: false,
  inanchor: false,
};

const defaultYouTube: YouTubeFilters = {
  query: "",
  exactPhrase: "",
  noneWords: "",
  channel: "",
  duration: "",
  uploadDate: "",
  beforeDate: "",
  afterDate: "",
  sortBy: "",
  subtitles: false,
  hd: false,
  liveOnly: false,
  creative: false,
};

interface OperatorChip {
  label: string;
  value: string;
}

const GOOGLE_OPERATOR_CHIPS: OperatorChip[] = [
  { label: "site:", value: "site:" },
  { label: "intitle:", value: "intitle:" },
  { label: "inurl:", value: "inurl:" },
  { label: "intext:", value: "intext:" },
  { label: "filetype:", value: "filetype:" },
  { label: "related:", value: "related:" },
  { label: "before:", value: "before:" },
  { label: "after:", value: "after:" },
  { label: `"exact"`, value: `""` },
  { label: "-exclude", value: "-" },
  { label: "OR", value: " OR " },
  { label: "AND", value: " AND " },
];

export default function AdvancedSearch() {
  const [google, setGoogle] = useState<GoogleFilters>(defaultGoogle);
  const [youtube, setYouTube] = useState<YouTubeFilters>(defaultYouTube);
  const [manualQuery, setManualQuery] = useState("");

  const googleUrl = useMemo(() => buildGoogleUrl(google), [google]);
  const googleQuery = useMemo(() => buildGoogleQuery(google), [google]);
  const youtubeUrl = useMemo(() => buildYouTubeUrl(youtube), [youtube]);
  const youtubeQuery = useMemo(() => buildYouTubeQuery(youtube), [youtube]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  const updateGoogle = useCallback(
    <K extends keyof GoogleFilters>(key: K, value: GoogleFilters[K]) => {
      setGoogle((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateYouTube = useCallback(
    <K extends keyof YouTubeFilters>(key: K, value: YouTubeFilters[K]) => {
      setYouTube((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateGoogleDate = useCallback(
    <K extends keyof DateFilter>(key: K, value: DateFilter[K]) => {
      setGoogle((prev) => ({
        ...prev,
        dateFilter: { ...prev.dateFilter, [key]: value },
      }));
    },
    [],
  );

  const appendToManual = useCallback((op: string) => {
    setManualQuery((prev) => prev + op);
  }, []);

  return (
    <ToolsWrapper>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <Search className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
          Advanced Search Builder
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Build powerful Google and YouTube search queries using advanced
          operators — generate direct search links instantly
        </p>
      </div>

      <Tabs defaultValue="google">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="google">Google Search</TabsTrigger>
          <TabsTrigger value="youtube">YouTube Search</TabsTrigger>
          <TabsTrigger value="manual">Manual Builder</TabsTrigger>
        </TabsList>

        {/* ── GOOGLE TAB ── */}
        <TabsContent value="google">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Filters */}
            <div className="space-y-4 lg:col-span-3">
              {/* Basic */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Query</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>All these words</Label>
                    <Input
                      placeholder="e.g. nextjs tutorial"
                      value={google.query}
                      onChange={(e) => updateGoogle("query", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Exact phrase</Label>
                    <Input
                      placeholder='e.g. "open source toolkit"'
                      value={google.exactPhrase}
                      onChange={(e) =>
                        updateGoogle("exactPhrase", e.target.value)
                      }
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Wraps your phrase in quotes automatically
                    </p>
                  </div>
                  <div>
                    <Label>Any of these words</Label>
                    <Input
                      placeholder="e.g. react vue angular"
                      value={google.anyWords}
                      onChange={(e) => updateGoogle("anyWords", e.target.value)}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Joined with OR operator
                    </p>
                  </div>
                  <div>
                    <Label>None of these words</Label>
                    <Input
                      placeholder="e.g. spam ads"
                      value={google.noneWords}
                      onChange={(e) =>
                        updateGoogle("noneWords", e.target.value)
                      }
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Prefixed with - operator
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Site & URL */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Site & URL Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>
                      Site <span className="text-xs text-blue-500">site:</span>
                    </Label>
                    <Input
                      placeholder="e.g. github.com or .edu"
                      value={google.site}
                      onChange={(e) => updateGoogle("site", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      Word in title{" "}
                      <span className="text-xs text-blue-500">intitle:</span>
                    </Label>
                    <Input
                      placeholder="e.g. tutorial"
                      value={google.inTitle}
                      onChange={(e) => updateGoogle("inTitle", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      Word in URL{" "}
                      <span className="text-xs text-blue-500">inurl:</span>
                    </Label>
                    <Input
                      placeholder="e.g. blog"
                      value={google.inUrl}
                      onChange={(e) => updateGoogle("inUrl", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      Word in page text{" "}
                      <span className="text-xs text-blue-500">intext:</span>
                    </Label>
                    <Input
                      placeholder="e.g. open source"
                      value={google.inText}
                      onChange={(e) => updateGoogle("inText", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      Related site{" "}
                      <span className="text-xs text-blue-500">related:</span>
                    </Label>
                    <Input
                      placeholder="e.g. nytimes.com"
                      value={google.relatedSite}
                      onChange={(e) =>
                        updateGoogle("relatedSite", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      Links to URL{" "}
                      <span className="text-xs text-blue-500">link:</span>
                    </Label>
                    <Input
                      placeholder="e.g. example.com/page"
                      value={google.linkTo}
                      onChange={(e) => updateGoogle("linkTo", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* File & Language */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    File Type & Language
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>File Type</Label>
                    <Select
                      value={sel(google.fileType)}
                      onValueChange={(v) => updateGoogle("fileType", desel(v))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Any file type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILE_TYPES.map((ft) => (
                          <SelectItem key={ft.value} value={ft.value}>
                            {ft.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Language</Label>
                    <Select
                      value={sel(google.language)}
                      onValueChange={(v) => updateGoogle("language", desel(v))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Any language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Date */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Date Filter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Quick date range</Label>
                    <Select
                      value={sel(google.dateFilter.past ?? "")}
                      onValueChange={(v) => {
                        const raw = desel(v);
                        setGoogle((prev) => ({
                          ...prev,
                          dateFilter: {
                            type: raw ? "past" : "none",
                            past: raw,
                          },
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Any time" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAST_OPTIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>
                        After{" "}
                        <span className="text-xs text-blue-500">after:</span>
                      </Label>
                      <Input
                        type="date"
                        value={google.dateFilter.after ?? ""}
                        onChange={(e) => {
                          updateGoogleDate("after", e.target.value);
                          if (e.target.value) updateGoogleDate("type", "after");
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>
                        Before{" "}
                        <span className="text-xs text-blue-500">before:</span>
                      </Label>
                      <Input
                        type="date"
                        value={google.dateFilter.before ?? ""}
                        onChange={(e) => {
                          updateGoogleDate("before", e.target.value);
                          if (e.target.value)
                            updateGoogleDate("type", "before");
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Fill both dates for a range (before + after)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Generated Query & Link */}
            <div className="space-y-4 lg:col-span-2">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base">Generated Query</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {googleQuery ? (
                    <>
                      <div className="break-all rounded-lg bg-gray-100 p-3 font-mono text-sm dark:bg-gray-800">
                        {googleQuery}
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(googleQuery, "Search query")
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy Query
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Fill in filters above to generate your query
                    </p>
                  )}

                  {googleUrl && (
                    <>
                      <div className="break-all rounded-lg bg-gray-100 p-3 text-xs dark:bg-gray-800">
                        <span className="font-semibold text-blue-600">
                          Search URL:
                        </span>
                        <br />
                        <span className="text-gray-600 dark:text-gray-400">
                          {googleUrl}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(googleUrl, "Search URL")
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" /> Copy URL
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => window.open(googleUrl, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" /> Open
                        </Button>
                      </div>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full text-gray-500"
                    onClick={() => setGoogle(defaultGoogle)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset All
                  </Button>
                </CardContent>
              </Card>

              {/* Operator reference */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Operator Reference
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    {[
                      ["site:", "Limit results to a domain"],
                      ["intitle:", "Keyword must appear in title"],
                      ["inurl:", "Keyword must appear in URL"],
                      ["intext:", "Keyword must appear in page body"],
                      ["filetype:", "Filter by file extension"],
                      ["related:", "Sites similar to given URL"],
                      ["link:", "Pages linking to a URL"],
                      ['"phrase"', "Exact phrase match"],
                      ["-word", "Exclude results with this word"],
                      ["OR", "Either term must match"],
                      ["before:YYYY-MM-DD", "Results before date"],
                      ["after:YYYY-MM-DD", "Results after date"],
                    ].map(([op, desc]) => (
                      <div key={op} className="flex gap-2">
                        <code className="w-36 shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono dark:bg-gray-800">
                          {op}
                        </code>
                        <span className="text-gray-600 dark:text-gray-400">
                          {desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── YOUTUBE TAB ── */}
        <TabsContent value="youtube">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Query</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>All these words</Label>
                    <Input
                      placeholder="e.g. react hooks tutorial"
                      value={youtube.query}
                      onChange={(e) => updateYouTube("query", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Exact phrase</Label>
                    <Input
                      placeholder='e.g. "full stack developer"'
                      value={youtube.exactPhrase}
                      onChange={(e) =>
                        updateYouTube("exactPhrase", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Exclude words</Label>
                    <Input
                      placeholder="e.g. shorts"
                      value={youtube.noneWords}
                      onChange={(e) =>
                        updateYouTube("noneWords", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Channel</Label>
                    <Input
                      placeholder="e.g. Fireship"
                      value={youtube.channel}
                      onChange={(e) => updateYouTube("channel", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Duration</Label>
                    <Select
                      value={sel(youtube.duration)}
                      onValueChange={(v) => updateYouTube("duration", desel(v))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Any duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {YT_DURATION.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Upload Date (quick)</Label>
                    <Select
                      value={sel(youtube.uploadDate)}
                      onValueChange={(v) => {
                        updateYouTube("uploadDate", desel(v));
                        updateYouTube("beforeDate", "");
                        updateYouTube("afterDate", "");
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Any time" />
                      </SelectTrigger>
                      <SelectContent>
                        {YT_UPLOAD.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>
                        After{" "}
                        <span className="text-xs text-blue-500">after:</span>
                      </Label>
                      <Input
                        type="date"
                        value={youtube.afterDate}
                        onChange={(e) => {
                          updateYouTube("afterDate", e.target.value);
                          if (e.target.value) updateYouTube("uploadDate", "");
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>
                        Before{" "}
                        <span className="text-xs text-blue-500">before:</span>
                      </Label>
                      <Input
                        type="date"
                        value={youtube.beforeDate}
                        onChange={(e) => {
                          updateYouTube("beforeDate", e.target.value);
                          if (e.target.value) updateYouTube("uploadDate", "");
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Custom dates override the quick picker above
                  </p>
                  <div>
                    <Label>Sort By</Label>
                    <Select
                      value={sel(youtube.sortBy)}
                      onValueChange={(v) => updateYouTube("sortBy", desel(v))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Relevance" />
                      </SelectTrigger>
                      <SelectContent>
                        {YT_SORT.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {[
                      {
                        key: "hd" as const,
                        label: "HD only",
                        active: youtube.hd,
                      },
                      {
                        key: "liveOnly" as const,
                        label: "Live only",
                        active: youtube.liveOnly,
                      },
                      {
                        key: "subtitles" as const,
                        label: "Has subtitles",
                        active: youtube.subtitles,
                      },
                      {
                        key: "creative" as const,
                        label: "Creative Commons",
                        active: youtube.creative,
                      },
                    ].map(({ key, label, active }) => (
                      <Badge
                        key={key}
                        variant={active ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => updateYouTube(key, !active)}
                      >
                        {active ? (
                          "✓ "
                        ) : (
                          <Plus className="mr-1 inline h-3 w-3" />
                        )}
                        {label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base">Generated Query</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {youtubeQuery ? (
                    <>
                      <div className="break-all rounded-lg bg-gray-100 p-3 font-mono text-sm dark:bg-gray-800">
                        {youtubeQuery}
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(youtubeQuery, "Search query")
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy Query
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Fill in filters above to generate your query
                    </p>
                  )}

                  {youtubeUrl && (
                    <>
                      <div className="break-all rounded-lg bg-gray-100 p-3 text-xs dark:bg-gray-800">
                        <span className="font-semibold text-red-600">
                          YouTube URL:
                        </span>
                        <br />
                        <span className="text-gray-600 dark:text-gray-400">
                          {youtubeUrl}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(youtubeUrl, "YouTube URL")
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" /> Copy URL
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => window.open(youtubeUrl, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" /> Open
                        </Button>
                      </div>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full text-gray-500"
                    onClick={() => setYouTube(defaultYouTube)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset All
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── MANUAL TAB ── */}
        <TabsContent value="manual">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Manual Query Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Quick-insert operators</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {GOOGLE_OPERATOR_CHIPS.map((chip) => (
                        <Badge
                          key={chip.label}
                          variant="outline"
                          className="cursor-pointer select-none font-mono hover:bg-blue-50 dark:hover:bg-blue-900"
                          onClick={() => appendToManual(chip.value)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          {chip.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Your query</Label>
                    <div className="relative mt-1">
                      <textarea
                        className="w-full rounded-lg border border-gray-200 bg-white p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        rows={4}
                        placeholder='site:github.com "open source" -spam after:2023-01-01 filetype:pdf'
                        value={manualQuery}
                        onChange={(e) => setManualQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500"
                    onClick={() => setManualQuery("")}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Clear
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Common Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      {
                        desc: "Find PDFs on a site",
                        q: 'site:example.com filetype:pdf "annual report"',
                      },
                      {
                        desc: "News from a period",
                        q: "climate change after:2024-01-01 before:2024-12-31",
                      },
                      {
                        desc: "GitHub repos",
                        q: "site:github.com intitle:react hooks stars",
                      },
                      {
                        desc: "Exclude social media",
                        q: "best javascript frameworks -site:reddit.com -site:quora.com",
                      },
                      {
                        desc: "Academic papers",
                        q: "machine learning filetype:pdf site:.edu OR site:.ac.uk",
                      },
                      {
                        desc: "Job listings",
                        q: 'intitle:"software engineer" inurl:jobs -internship',
                      },
                    ].map(({ desc, q }) => (
                      <div
                        key={desc}
                        className="cursor-pointer rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        onClick={() => setManualQuery(q)}
                      >
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {desc}
                        </p>
                        <code className="mt-1 block text-xs text-blue-600 dark:text-blue-400">
                          {q}
                        </code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base">Search Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {manualQuery.trim() ? (
                    <>
                      <div className="break-all rounded-lg bg-gray-100 p-3 font-mono text-sm dark:bg-gray-800">
                        {manualQuery}
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(manualQuery, "Search query")
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy Query
                      </Button>
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Open in
                        </p>
                        {[
                          {
                            name: "Google",
                            url: `https://www.google.com/search?q=${encodeURIComponent(manualQuery)}`,
                            color: "text-blue-600",
                          },
                          {
                            name: "Bing",
                            url: `https://www.bing.com/search?q=${encodeURIComponent(manualQuery)}`,
                            color: "text-teal-600",
                          },
                          {
                            name: "DuckDuckGo",
                            url: `https://duckduckgo.com/?q=${encodeURIComponent(manualQuery)}`,
                            color: "text-orange-600",
                          },
                          {
                            name: "YouTube",
                            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(manualQuery)}`,
                            color: "text-red-600",
                          },
                        ].map(({ name, url, color }) => (
                          <div
                            key={name}
                            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
                          >
                            <span className={`text-sm font-medium ${color}`}>
                              {name}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={() =>
                                  copyToClipboard(url, `${name} URL`)
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={() => window.open(url, "_blank")}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Type or build a query to generate search links
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </ToolsWrapper>
  );
}
