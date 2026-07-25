"use client";

import { toast } from "sonner";
import React, { useState, useCallback, useMemo } from "react";
import {
  Search,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  Download,
  Copy,
  ExternalLink,
  Link2,
  Image as ImageIcon,
  FileCode2,
  Hash,
  Gauge,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

import {
  GooglePreview,
  FacebookPreview,
  TwitterPreview,
  SlackPreview,
} from "./Previews";
import {
  analyzeHtml,
  formatBytes,
  truncate,
  type ISeoAnalysis,
  type ICheck,
  type CheckCategory,
  type CheckStatus,
} from "./seo-utils";

const CATEGORIES: CheckCategory[] = [
  "Meta & Content",
  "Social Sharing",
  "Indexing & Crawling",
  "Structure & Semantics",
  "Performance & Delivery",
];

const STATUS_META: Record<
  CheckStatus,
  { icon: React.ReactNode; className: string; label: string }
> = {
  pass: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: "text-emerald-600 dark:text-emerald-400",
    label: "Pass",
  },
  warn: {
    icon: <AlertTriangle className="h-4 w-4" />,
    className: "text-amber-600 dark:text-amber-400",
    label: "Warning",
  },
  fail: {
    icon: <XCircle className="h-4 w-4" />,
    className: "text-red-600 dark:text-red-400",
    label: "Fail",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    className: "text-sky-600 dark:text-sky-400",
    label: "Info",
  },
};

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-500";
  if (score >= 70) return "text-amber-500";
  return "text-red-500";
}

function scoreRing(score: number): string {
  if (score >= 90) return "stroke-emerald-500";
  if (score >= 70) return "stroke-amber-500";
  return "stroke-red-500";
}

export default function SeoAnalyzer() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ISeoAnalysis | null>(null);

  const runAnalysis = useCallback(async () => {
    const target = url.trim();
    if (!target) {
      toast.error("Enter a URL to analyze");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/seo-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Analysis failed");
        setAnalysis(null);
        toast.error(data.error ?? "Analysis failed");
        return;
      }

      const { html, ...meta } = data;
      const result = analyzeHtml(html, meta);
      setAnalysis(result);
      toast.success(`Analyzed — SEO score ${result.score}/100`);
    } catch (err) {
      console.error(err);
      const message = "Could not reach the analyzer. Check your connection.";
      setError(message);
      setAnalysis(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  const exportReport = useCallback(() => {
    if (!analysis) return;
    const report = {
      url: analysis.meta.finalUrl,
      score: analysis.score,
      scoreByCategory: analysis.scoreByCategory,
      fetchedAt: new Date().toISOString(),
      responseTimeMs: analysis.meta.responseTimeMs,
      title: analysis.title,
      description: analysis.description,
      canonical: analysis.canonical,
      openGraph: analysis.openGraph,
      twitter: analysis.twitter,
      headings: analysis.headings,
      wordCount: analysis.wordCount,
      structuredData: analysis.structuredData.map((s) => ({
        type: s.type,
        valid: s.valid,
      })),
      checks: analysis.checks.map((c) => ({
        id: c.id,
        label: c.label,
        status: c.status,
        detail: c.detail,
        fix: c.fix,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `seo-report-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    toast.success("Report exported");
  }, [analysis]);

  const issues = useMemo(
    () =>
      analysis
        ? analysis.checks.filter(
            (c) => c.status === "fail" || c.status === "warn",
          )
        : [],
    [analysis],
  );

  const grouped = useMemo(() => {
    if (!analysis) return [];
    return CATEGORIES.map((cat) => ({
      category: cat,
      checks: analysis.checks.filter((c) => c.category === cat),
      score: analysis.scoreByCategory[cat],
    })).filter((g) => g.checks.length > 0);
  }, [analysis]);

  return (
    <ToolsWrapper>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <Search className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Website SEO Analyzer
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 sm:text-lg">
          Audit any page&apos;s SEO and see exactly how it looks on Google,
          Facebook, X and Slack.
        </p>
      </div>

      {/* ── URL input ────────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) runAnalysis();
                }}
                placeholder="example.com or https://example.com/page"
                className="pl-9"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <Button
              onClick={runAnalysis}
              disabled={loading}
              className="gap-2 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!analysis && !error && !loading && (
            <p className="mt-3 text-xs text-muted-foreground">
              The page is fetched server-side, so sites that block cross-origin
              requests can still be analyzed. Only public URLs are allowed.
            </p>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Fetching and analyzing the page…
            </p>
          </CardContent>
        </Card>
      )}

      {analysis && !loading && (
        <>
          {/* ── Score summary ──────────────────────────────────────────── */}
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="relative h-32 w-32">
                  <svg
                    className="h-full w-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="fill-none stroke-muted"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className={`fill-none ${scoreRing(analysis.score)}`}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(analysis.score / 100) * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className={`text-4xl font-bold ${scoreColor(analysis.score)}`}
                    >
                      {analysis.score}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      out of 100
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-center text-sm font-medium">
                  {analysis.score >= 90
                    ? "Excellent"
                    : analysis.score >= 70
                      ? "Good — some fixes needed"
                      : "Needs work"}
                </p>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  {issues.length} issue{issues.length !== 1 ? "s" : ""} found
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="h-4 w-4" />
                  Category breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {grouped.map(({ category, score }) => {
                  const pct =
                    score.max > 0
                      ? Math.round((score.score / score.max) * 100)
                      : 0;
                  return (
                    <div key={category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="truncate">{category}</span>
                        <span
                          className={`shrink-0 font-medium ${scoreColor(pct)}`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 90
                              ? "bg-emerald-500"
                              : pct >= 70
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-wrap gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {analysis.meta.status}
                    {analysis.meta.redirected && " (redirected)"}
                  </span>
                  <span>·</span>
                  <span>{analysis.meta.responseTimeMs} ms</span>
                  <span>·</span>
                  <span>{formatBytes(analysis.meta.sizeBytes)}</span>
                  <span>·</span>
                  <a
                    href={analysis.meta.finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open page
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Detail tabs ────────────────────────────────────────────── */}
          <Tabs defaultValue="previews">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
              <TabsTrigger value="previews" className="text-xs sm:text-sm">
                Previews
              </TabsTrigger>
              <TabsTrigger value="checks" className="text-xs sm:text-sm">
                Checks
              </TabsTrigger>
              <TabsTrigger value="content" className="text-xs sm:text-sm">
                Content
              </TabsTrigger>
              <TabsTrigger value="links" className="text-xs sm:text-sm">
                Links
              </TabsTrigger>
              <TabsTrigger value="tags" className="text-xs sm:text-sm">
                Tags
              </TabsTrigger>
            </TabsList>

            {/* ── Previews ───────────────────────────────────────────── */}
            <TabsContent value="previews" className="mt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Approximations of how this page appears when shared. Exact
                rendering varies by platform and changes over time.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Google search result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GooglePreview a={analysis} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Facebook / LinkedIn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FacebookPreview a={analysis} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">X (Twitter) card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TwitterPreview a={analysis} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Slack unfurl</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SlackPreview a={analysis} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Checks ─────────────────────────────────────────────── */}
            <TabsContent value="checks" className="mt-4 space-y-4">
              {issues.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Priority fixes ({issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {issues
                      .slice()
                      .sort((x, y) =>
                        x.status === y.status
                          ? y.weight - x.weight
                          : x.status === "fail"
                            ? -1
                            : 1,
                      )
                      .map((check) => (
                        <CheckRow key={check.id} check={check} />
                      ))}
                  </CardContent>
                </Card>
              )}

              {grouped.map(({ category, checks }) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {checks.map((check) => (
                      <CheckRow key={check.id} check={check} />
                    ))}
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={exportReport}
                className="w-full gap-2 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export full report (JSON)
              </Button>
            </TabsContent>

            {/* ── Content ────────────────────────────────────────────── */}
            <TabsContent value="content" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Words"
                  value={analysis.wordCount.toLocaleString()}
                />
                <StatCard
                  label="Text/HTML ratio"
                  value={`${analysis.textToHtmlRatio.toFixed(1)}%`}
                />
                <StatCard
                  label="Headings"
                  value={String(analysis.headings.length)}
                />
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Hash className="h-4 w-4" />
                    Heading outline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.headings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No headings found on this page.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {analysis.headings.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm"
                          style={{ paddingLeft: `${(h.level - 1) * 14}px` }}
                        >
                          <Badge
                            variant="outline"
                            className="shrink-0 px-1.5 py-0 font-mono text-[10px]"
                          >
                            H{h.level}
                          </Badge>
                          <span className="min-w-0 break-words">
                            {h.text || (
                              <span className="italic text-muted-foreground">
                                (empty)
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.keywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Not enough text to derive keywords.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keywords.map((k) => (
                        <Badge
                          key={k.word}
                          variant="secondary"
                          className="gap-1.5"
                        >
                          {k.word}
                          <span className="text-muted-foreground">
                            {k.count} · {k.density.toFixed(1)}%
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ImageIcon className="h-4 w-4" />
                    Images ({analysis.images.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.images.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No images found.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[32rem] text-sm">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="px-2 py-2 text-left font-medium">
                              Source
                            </th>
                            <th className="px-2 py-2 text-left font-medium">
                              Alt text
                            </th>
                            <th className="px-2 py-2 text-left font-medium">
                              Lazy
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.images.slice(0, 50).map((img, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="max-w-[16rem] truncate px-2 py-2 font-mono text-xs">
                                {img.src.split("/").pop() || img.src}
                              </td>
                              <td className="px-2 py-2">
                                {img.alt === null ? (
                                  <Badge
                                    variant="outline"
                                    className="border-red-500/50 text-red-500"
                                  >
                                    missing
                                  </Badge>
                                ) : img.alt === "" ? (
                                  <span className="text-xs text-muted-foreground">
                                    empty (decorative)
                                  </span>
                                ) : (
                                  truncate(img.alt, 50)
                                )}
                              </td>
                              <td className="px-2 py-2 text-xs text-muted-foreground">
                                {img.loading === "lazy" ? "yes" : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Links ──────────────────────────────────────────────── */}
            <TabsContent value="links" className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Internal links"
                  value={String(
                    analysis.links.filter((l) => l.isInternal).length,
                  )}
                />
                <StatCard
                  label="External links"
                  value={String(
                    analysis.links.filter((l) => !l.isInternal).length,
                  )}
                />
                <StatCard
                  label="Nofollow"
                  value={String(
                    analysis.links.filter((l) => l.isNofollow).length,
                  )}
                />
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Link2 className="h-4 w-4" />
                    All links ({analysis.links.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.links.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No links found.
                    </p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-1">
                        {analysis.links.slice(0, 200).map((l, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
                          >
                            <Badge
                              variant="outline"
                              className="shrink-0 px-1.5 py-0 text-[10px]"
                            >
                              {l.isInternal ? "int" : "ext"}
                            </Badge>
                            {l.isNofollow && (
                              <Badge
                                variant="secondary"
                                className="shrink-0 px-1.5 py-0 text-[10px]"
                              >
                                nofollow
                              </Badge>
                            )}
                            <span className="min-w-0 flex-1 truncate">
                              {l.text || (
                                <span className="italic text-muted-foreground">
                                  (no anchor text)
                                </span>
                              )}
                            </span>
                            <span className="hidden max-w-[14rem] shrink-0 truncate font-mono text-xs text-muted-foreground sm:inline">
                              {l.href}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tags ───────────────────────────────────────────────── */}
            <TabsContent value="tags" className="mt-4 space-y-4">
              <TagCard
                title="Core meta tags"
                rows={[
                  ["Title", analysis.title],
                  ["Description", analysis.description],
                  ["Canonical", analysis.canonical],
                  ["Robots", analysis.robotsMeta],
                  ["Viewport", analysis.viewport],
                  ["Charset", analysis.charset],
                  ["Language", analysis.lang],
                  ["Theme color", analysis.themeColor],
                ]}
                onCopy={copyToClipboard}
              />

              <TagCard
                title="Open Graph"
                rows={Object.entries(analysis.openGraph)}
                onCopy={copyToClipboard}
                emptyMessage="No Open Graph tags found."
              />

              {Object.keys(analysis.openGraphMisdeclared).length > 0 && (
                <Card className="border-red-500/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Open Graph tags using the wrong attribute
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-sm text-muted-foreground">
                      These use <code className="font-mono">name=</code>, but
                      Open Graph requires{" "}
                      <code className="font-mono">property=</code>. Facebook,
                      LinkedIn and Slack ignore them, so no preview is
                      generated.
                    </p>
                    <div className="space-y-2">
                      {Object.entries(analysis.openGraphMisdeclared).map(
                        ([k, v]) => (
                          <div
                            key={k}
                            className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0 sm:flex-row sm:gap-3"
                          >
                            <span className="w-full shrink-0 font-mono text-xs text-red-500 sm:w-40">
                              {k}
                            </span>
                            <span className="min-w-0 flex-1 break-words text-sm">
                              {v}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <TagCard
                title="Twitter Card"
                rows={Object.entries(analysis.twitter)}
                onCopy={copyToClipboard}
                emptyMessage="No Twitter Card tags found."
              />

              {analysis.hreflang.length > 0 && (
                <TagCard
                  title="Hreflang"
                  rows={analysis.hreflang.map((h) => [h.lang, h.href])}
                  onCopy={copyToClipboard}
                />
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileCode2 className="h-4 w-4" />
                    Structured data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.structuredData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No JSON-LD structured data found.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {analysis.structuredData.map((sd, i) => (
                        <div key={i} className="rounded-lg border p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <Badge
                              variant={sd.valid ? "secondary" : "destructive"}
                            >
                              {sd.valid ? sd.type : "Invalid JSON"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-7 gap-1.5"
                              onClick={() =>
                                copyToClipboard(sd.raw, "Structured data")
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                            {truncate(sd.raw, 1500)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Response headers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[28rem] text-sm">
                      <tbody>
                        {Object.entries(analysis.meta.headers).map(([k, v]) => (
                          <tr key={k} className="border-b last:border-0">
                            <td className="px-2 py-2 font-mono text-xs text-muted-foreground">
                              {k}
                            </td>
                            <td className="break-all px-2 py-2 font-mono text-xs">
                              {v}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </ToolsWrapper>
  );
}

// ── Small presentational helpers ────────────────────────────────────────────

function CheckRow({ check }: { check: ICheck }) {
  const s = STATUS_META[check.status];
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <div className={`mt-0.5 shrink-0 ${s.className}`}>{s.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{check.label}</p>
        <p className="mt-0.5 break-words text-xs text-muted-foreground">
          {check.detail}
        </p>
        {check.fix && (
          <p className="mt-1.5 break-words rounded bg-muted/60 px-2 py-1 text-xs">
            <span className="font-medium">Fix: </span>
            {check.fix}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function TagCard({
  title,
  rows,
  onCopy,
  emptyMessage,
}: {
  title: string;
  rows: [string, string | null][] | string[][];
  onCopy: (text: string, label: string) => void;
  emptyMessage?: string;
}) {
  const entries = (rows as [string, string | null][]).filter(
    ([, v]) => v !== undefined,
  );
  const present = entries.filter(([, v]) => v);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {present.length === 0 && emptyMessage ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:gap-3"
              >
                <span className="w-full shrink-0 font-mono text-xs text-muted-foreground sm:w-40">
                  {key}
                </span>
                {value ? (
                  <>
                    <span className="min-w-0 flex-1 break-words text-sm">
                      {value}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 shrink-0 px-2"
                      onClick={() => onCopy(value, key)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <span className="flex-1 text-sm italic text-muted-foreground">
                    not set
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
