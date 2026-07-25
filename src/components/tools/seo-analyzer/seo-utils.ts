/**
 * SEO analysis engine.
 *
 * Pure functions over an HTML string — no React, no network — so the scoring
 * rules can be exercised directly with `npx tsx` (see CLAUDE.md, "Verifying
 * Logic Without a Test Framework").
 *
 * Parsing uses DOMParser in the browser. `parseHtml` is injectable so the same
 * logic can be driven from Node in a scratch test.
 */

export interface IFetchMeta {
  finalUrl: string;
  status: number;
  redirected: boolean;
  responseTimeMs: number;
  sizeBytes: number;
  truncated: boolean;
  headers: Record<string, string>;
}

export type CheckStatus = "pass" | "warn" | "fail" | "info";

export interface ICheck {
  id: string;
  label: string;
  status: CheckStatus;
  /** What was found — shown as the check's detail line. */
  detail: string;
  /** Concrete remediation, only present when not passing. */
  fix?: string;
  category: CheckCategory;
  /** Relative importance when computing the score. */
  weight: number;
}

export type CheckCategory =
  | "Meta & Content"
  | "Social Sharing"
  | "Indexing & Crawling"
  | "Structure & Semantics"
  | "Performance & Delivery";

export interface IHeading {
  level: number;
  text: string;
}

export interface IImageInfo {
  src: string;
  alt: string | null;
  hasDimensions: boolean;
  loading: string | null;
}

export interface ILinkInfo {
  href: string;
  text: string;
  isInternal: boolean;
  rel: string | null;
  isNofollow: boolean;
}

export interface ISeoAnalysis {
  meta: IFetchMeta;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  viewport: string | null;
  charset: string | null;
  lang: string | null;
  favicon: string | null;
  themeColor: string | null;
  openGraph: Record<string, string>;
  /** og: tags wrongly declared with name= instead of property= (ignored by scrapers). */
  openGraphMisdeclared: Record<string, string>;
  twitter: Record<string, string>;
  headings: IHeading[];
  images: IImageInfo[];
  links: ILinkInfo[];
  structuredData: { type: string; raw: string; valid: boolean }[];
  hreflang: { lang: string; href: string }[];
  wordCount: number;
  textToHtmlRatio: number;
  keywords: { word: string; count: number; density: number }[];
  checks: ICheck[];
  score: number;
  scoreByCategory: Record<CheckCategory, { score: number; max: number }>;
}

// ── Recommended limits (Google SERP truncation points) ──────────────────────
export const TITLE_MIN = 30;
export const TITLE_MAX = 60;
export const DESC_MIN = 70;
export const DESC_MAX = 160;

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "up",
  "about",
  "into",
  "over",
  "after",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "should",
  "could",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "as",
  "if",
  "then",
  "than",
  "so",
  "such",
  "you",
  "your",
  "we",
  "our",
  "they",
  "their",
  "he",
  "she",
  "his",
  "her",
  "i",
  "me",
  "my",
  "not",
  "no",
  "yes",
  "all",
  "any",
  "can",
  "may",
  "more",
  "most",
  "other",
  "some",
  "only",
  "own",
  "same",
  "too",
  "very",
  "just",
  "also",
  "here",
  "there",
  "when",
  "where",
  "how",
  "what",
  "which",
  "who",
  "whom",
  "why",
  "because",
  "while",
  "during",
  "before",
  "above",
  "below",
  "between",
  "under",
  "again",
  "further",
  "once",
  "each",
  "few",
  "both",
  "he's",
]);

/** Parse HTML into a Document. Overridable so Node tests can inject a parser. */
export type HtmlParser = (html: string) => Document;

const defaultParser: HtmlParser = (html) =>
  new DOMParser().parseFromString(html, "text/html");

function attr(el: Element | null, name: string): string | null {
  const v = el?.getAttribute(name);
  return v && v.trim() ? v.trim() : null;
}

/** Resolve a possibly-relative URL against the page URL; null if unresolvable. */
function resolveUrl(href: string | null, base: string): string | null {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function getMetaContent(doc: Document, selectors: string[]): string | null {
  for (const sel of selectors) {
    const v = attr(doc.querySelector(sel), "content");
    if (v) return v;
  }
  return null;
}

/** Extract visible text, excluding script/style/noscript. */
function extractText(doc: Document): string {
  // An empty or malformed response can leave documentElement/body null, so
  // fall back through each level rather than throwing.
  let root: Element | null = null;
  try {
    root = doc.body ?? doc.documentElement ?? null;
  } catch {
    root = null;
  }
  if (!root) return "";

  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("script, style, noscript, template, svg")
    .forEach((el) => el.remove());
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function analyzeHtml(
  html: string,
  meta: IFetchMeta,
  parseHtml: HtmlParser = defaultParser,
): ISeoAnalysis {
  const doc = parseHtml(html);
  const base = meta.finalUrl;

  // ── Core meta ────────────────────────────────────────────────────────────
  const title = doc.querySelector("title")?.textContent?.trim() || null;
  const description = getMetaContent(doc, ['meta[name="description" i]']);
  const canonical = resolveUrl(
    attr(doc.querySelector('link[rel="canonical" i]'), "href"),
    base,
  );
  const robotsMeta = getMetaContent(doc, ['meta[name="robots" i]']);
  const viewport = getMetaContent(doc, ['meta[name="viewport" i]']);
  const themeColor = getMetaContent(doc, ['meta[name="theme-color" i]']);
  // documentElement is null for an empty/malformed response.
  const lang = attr(doc.documentElement ?? null, "lang");

  const charsetEl = doc.querySelector("meta[charset]");
  const charset =
    attr(charsetEl, "charset") ??
    getMetaContent(doc, ['meta[http-equiv="content-type" i]']);

  const favicon = resolveUrl(
    attr(
      doc.querySelector(
        'link[rel="icon" i], link[rel="shortcut icon" i], link[rel="apple-touch-icon" i]',
      ),
      "href",
    ),
    base,
  );

  // ── Open Graph / Twitter ─────────────────────────────────────────────────
  const openGraph: Record<string, string> = {};
  doc.querySelectorAll('meta[property^="og:" i]').forEach((el) => {
    const k = el.getAttribute("property")?.toLowerCase();
    const v = el.getAttribute("content");
    if (k && v && !openGraph[k]) openGraph[k] = v.trim();
  });

  // Open Graph requires `property=`; `name=` is a common mistake that scrapers
  // (including Facebook's) ignore. Track these separately so the check can say
  // exactly what's wrong instead of just reporting the tags as missing.
  const openGraphMisdeclared: Record<string, string> = {};
  doc.querySelectorAll('meta[name^="og:" i]').forEach((el) => {
    const k = el.getAttribute("name")?.toLowerCase();
    const v = el.getAttribute("content");
    if (k && v && !openGraph[k] && !openGraphMisdeclared[k]) {
      openGraphMisdeclared[k] = v.trim();
    }
  });

  const twitter: Record<string, string> = {};
  doc.querySelectorAll('meta[name^="twitter:" i]').forEach((el) => {
    const k = el.getAttribute("name")?.toLowerCase();
    const v = el.getAttribute("content");
    if (k && v && !twitter[k]) twitter[k] = v.trim();
  });

  // ── Structure ────────────────────────────────────────────────────────────
  const headings: IHeading[] = Array.from(
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  ).map((el) => ({
    level: Number(el.tagName.slice(1)),
    text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
  }));

  const images: IImageInfo[] = Array.from(doc.querySelectorAll("img")).map(
    (el) => ({
      src: resolveUrl(el.getAttribute("src"), base) ?? "",
      alt: el.hasAttribute("alt") ? (el.getAttribute("alt") ?? "") : null,
      hasDimensions: el.hasAttribute("width") && el.hasAttribute("height"),
      loading: el.getAttribute("loading"),
    }),
  );

  let baseHost = "";
  try {
    baseHost = new URL(base).hostname;
  } catch {
    /* keep empty — everything counts as external */
  }

  const links: ILinkInfo[] = Array.from(doc.querySelectorAll("a[href]"))
    .map((el) => {
      const raw = el.getAttribute("href") ?? "";
      const resolved = resolveUrl(raw, base);
      if (!resolved || !/^https?:/i.test(resolved)) return null;
      const rel = el.getAttribute("rel");
      let isInternal = false;
      try {
        isInternal = new URL(resolved).hostname === baseHost;
      } catch {
        /* treat as external */
      }
      return {
        href: resolved,
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        isInternal,
        rel,
        isNofollow: !!rel && /\bnofollow\b/i.test(rel),
      };
    })
    .filter((l): l is ILinkInfo => l !== null);

  const structuredData = Array.from(
    doc.querySelectorAll('script[type="application/ld+json" i]'),
  ).map((el) => {
    const raw = el.textContent ?? "";
    let type = "Unknown";
    let valid = true;
    try {
      const parsed = JSON.parse(raw);
      const node = Array.isArray(parsed) ? parsed[0] : parsed;
      type = node?.["@type"] ?? node?.["@graph"]?.[0]?.["@type"] ?? "Unknown";
      if (Array.isArray(type)) type = type[0];
    } catch {
      valid = false;
    }
    return { type: String(type), raw: raw.trim(), valid };
  });

  const hreflang = Array.from(
    doc.querySelectorAll('link[rel="alternate" i][hreflang]'),
  ).map((el) => ({
    lang: el.getAttribute("hreflang") ?? "",
    href: resolveUrl(el.getAttribute("href"), base) ?? "",
  }));

  // ── Content metrics ──────────────────────────────────────────────────────
  const text = extractText(doc);
  const words = text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  const wordCount = words.length;
  const textToHtmlRatio =
    html.length > 0 ? (text.length / html.length) * 100 : 0;

  const freq = new Map<string, number>();
  for (const raw of words) {
    const w = raw.toLowerCase().replace(/[^a-z0-9'-]/g, "");
    if (w.length < 3 || STOP_WORDS.has(w) || /^\d+$/.test(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const keywords = Array.from(freq.entries())
    .map(([word, count]) => ({
      word,
      count,
      density: wordCount ? (count / wordCount) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const analysisBase = {
    meta,
    title,
    description,
    canonical,
    robotsMeta,
    viewport,
    charset,
    lang,
    favicon,
    themeColor,
    openGraph,
    openGraphMisdeclared,
    twitter,
    headings,
    images,
    links,
    structuredData,
    hreflang,
    wordCount,
    textToHtmlRatio,
    keywords,
  };

  const checks = runChecks(analysisBase);
  const { score, scoreByCategory } = scoreChecks(checks);

  return { ...analysisBase, checks, score, scoreByCategory };
}

type AnalysisBase = Omit<ISeoAnalysis, "checks" | "score" | "scoreByCategory">;

/** Build the full check list. Each check states what was found and how to fix it. */
export function runChecks(a: AnalysisBase): ICheck[] {
  const checks: ICheck[] = [];
  const add = (c: ICheck) => checks.push(c);

  // ── Meta & Content ───────────────────────────────────────────────────────
  const titleLen = a.title?.length ?? 0;
  add({
    id: "title",
    label: "Title tag",
    category: "Meta & Content",
    weight: 10,
    ...(!a.title
      ? {
          status: "fail" as const,
          detail: "No <title> tag found",
          fix: "Add a unique <title> of 30–60 characters describing the page.",
        }
      : titleLen > TITLE_MAX
        ? {
            status: "warn" as const,
            detail: `${titleLen} characters — likely truncated in search results`,
            fix: `Shorten to ${TITLE_MAX} characters or fewer so it isn't cut off.`,
          }
        : titleLen < TITLE_MIN
          ? {
              status: "warn" as const,
              detail: `Only ${titleLen} characters — thin for search results`,
              fix: `Expand toward ${TITLE_MIN}–${TITLE_MAX} characters with descriptive keywords.`,
            }
          : {
              status: "pass" as const,
              detail: `${titleLen} characters — within the ideal range`,
            }),
  });

  const descLen = a.description?.length ?? 0;
  add({
    id: "description",
    label: "Meta description",
    category: "Meta & Content",
    weight: 8,
    ...(!a.description
      ? {
          status: "fail" as const,
          detail: "No meta description found",
          fix: 'Add <meta name="description"> of 70–160 characters; it\'s the snippet users read.',
        }
      : descLen > DESC_MAX
        ? {
            status: "warn" as const,
            detail: `${descLen} characters — will be truncated`,
            fix: `Trim to ${DESC_MAX} characters or fewer.`,
          }
        : descLen < DESC_MIN
          ? {
              status: "warn" as const,
              detail: `Only ${descLen} characters — leaves snippet space unused`,
              fix: `Expand toward ${DESC_MIN}–${DESC_MAX} characters.`,
            }
          : {
              status: "pass" as const,
              detail: `${descLen} characters — within the ideal range`,
            }),
  });

  const h1s = a.headings.filter((h) => h.level === 1);
  add({
    id: "h1",
    label: "H1 heading",
    category: "Structure & Semantics",
    weight: 7,
    ...(h1s.length === 0
      ? {
          status: "fail" as const,
          detail: "No H1 found",
          fix: "Add exactly one H1 stating the page's main topic.",
        }
      : h1s.length > 1
        ? {
            status: "warn" as const,
            detail: `${h1s.length} H1 tags found`,
            fix: "Use a single H1 and demote the rest to H2 for a clear hierarchy.",
          }
        : {
            status: "pass" as const,
            detail: `One H1: “${truncate(h1s[0].text, 60)}”`,
          }),
  });

  // Heading order — flag skipped levels (e.g. H2 straight to H4).
  const skipped = findSkippedHeadingLevels(a.headings);
  add({
    id: "heading-order",
    label: "Heading hierarchy",
    category: "Structure & Semantics",
    weight: 3,
    ...(a.headings.length === 0
      ? {
          status: "warn" as const,
          detail: "No headings found",
          fix: "Structure content with H1–H3 headings.",
        }
      : skipped.length > 0
        ? {
            status: "warn" as const,
            detail: `Skips a level (${skipped.slice(0, 3).join(", ")})`,
            fix: "Don't jump heading levels — follow H1 → H2 → H3 in order.",
          }
        : {
            status: "pass" as const,
            detail: `${a.headings.length} headings in a logical order`,
          }),
  });

  // ── Indexing & Crawling ──────────────────────────────────────────────────
  const noindex = /\bnoindex\b/i.test(a.robotsMeta ?? "");
  const xRobots = a.meta.headers["x-robots-tag"] ?? "";
  const noindexHeader = /\bnoindex\b/i.test(xRobots);
  add({
    id: "indexable",
    label: "Indexable by search engines",
    category: "Indexing & Crawling",
    weight: 10,
    ...(noindex || noindexHeader
      ? {
          status: "fail" as const,
          detail: `Blocked by ${noindex ? "robots meta tag" : "X-Robots-Tag header"}`,
          fix: "Remove `noindex` if this page should appear in search results.",
        }
      : {
          status: "pass" as const,
          detail: a.robotsMeta
            ? `Allowed (robots: ${a.robotsMeta})`
            : "No directive blocking indexing",
        }),
  });

  add({
    id: "canonical",
    label: "Canonical URL",
    category: "Indexing & Crawling",
    weight: 6,
    ...(!a.canonical
      ? {
          status: "warn" as const,
          detail: "No canonical link",
          fix: 'Add <link rel="canonical"> to consolidate duplicate URLs.',
        }
      : {
          status: "pass" as const,
          detail: a.canonical,
        }),
  });

  add({
    id: "https",
    label: "HTTPS",
    category: "Indexing & Crawling",
    weight: 8,
    ...(a.meta.finalUrl.startsWith("https://")
      ? { status: "pass" as const, detail: "Served over HTTPS" }
      : {
          status: "fail" as const,
          detail: "Served over plain HTTP",
          fix: "Serve the site over HTTPS — it's a confirmed ranking signal.",
        }),
  });

  add({
    id: "lang",
    label: "Language declaration",
    category: "Structure & Semantics",
    weight: 3,
    ...(a.lang
      ? { status: "pass" as const, detail: `<html lang="${a.lang}">` }
      : {
          status: "warn" as const,
          detail: "No lang attribute on <html>",
          fix: 'Add lang (e.g. <html lang="en">) for accessibility and correct indexing.',
        }),
  });

  add({
    id: "viewport",
    label: "Mobile viewport",
    category: "Performance & Delivery",
    weight: 8,
    ...(a.viewport
      ? { status: "pass" as const, detail: a.viewport }
      : {
          status: "fail" as const,
          detail: "No viewport meta tag",
          fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> — required for mobile ranking.',
        }),
  });

  add({
    id: "charset",
    label: "Character encoding",
    category: "Structure & Semantics",
    weight: 2,
    ...(a.charset
      ? { status: "pass" as const, detail: a.charset }
      : {
          status: "warn" as const,
          detail: "No charset declared",
          fix: 'Add <meta charset="utf-8"> as the first element in <head>.',
        }),
  });

  // ── Social sharing ───────────────────────────────────────────────────────
  const ogRequired = ["og:title", "og:description", "og:image"];
  const ogMissing = ogRequired.filter((k) => !a.openGraph[k]);
  const misdeclared = Object.keys(a.openGraphMisdeclared);

  add({
    id: "opengraph",
    label: "Open Graph tags",
    category: "Social Sharing",
    weight: 7,
    ...(ogMissing.length === 0
      ? {
          status: "pass" as const,
          detail: "og:title, og:description and og:image are all set",
        }
      : // Distinguish "absent" from "present but using the wrong attribute" —
        // the latter looks correct in the source but is silently ignored.
        misdeclared.length > 0
        ? {
            status: "fail" as const,
            detail: `${misdeclared.length} og: tag(s) use name= instead of property= (${misdeclared
              .slice(0, 3)
              .join(", ")}${misdeclared.length > 3 ? "…" : ""})`,
            fix: 'Open Graph requires property=, e.g. <meta property="og:title" …>. Tags declared with name= are ignored by Facebook, LinkedIn and Slack.',
          }
        : ogMissing.length === ogRequired.length
          ? {
              status: "fail" as const,
              detail: "No Open Graph tags found",
              fix: "Add og:title, og:description and og:image so shared links render a rich preview.",
            }
          : {
              status: "warn" as const,
              detail: `Missing ${ogMissing.join(", ")}`,
              fix: `Add the missing tag${ogMissing.length > 1 ? "s" : ""} for complete social previews.`,
            }),
  });

  const hasTwitterCard = !!a.twitter["twitter:card"];
  add({
    id: "twitter",
    label: "Twitter Card",
    category: "Social Sharing",
    weight: 4,
    ...(hasTwitterCard
      ? {
          status: "pass" as const,
          detail: `card type: ${a.twitter["twitter:card"]}`,
        }
      : a.openGraph["og:image"]
        ? {
            status: "info" as const,
            detail: "No twitter:card — X/Twitter will fall back to Open Graph",
            fix: 'Add <meta name="twitter:card" content="summary_large_image"> for a full-width image.',
          }
        : {
            status: "warn" as const,
            detail: "No Twitter Card and no Open Graph image to fall back on",
            fix: "Add twitter:card and twitter:image, or the Open Graph equivalents.",
          }),
  });

  // ── Images ───────────────────────────────────────────────────────────────
  const missingAlt = a.images.filter((i) => i.alt === null);
  add({
    id: "img-alt",
    label: "Image alt text",
    category: "Structure & Semantics",
    weight: 5,
    ...(a.images.length === 0
      ? { status: "info" as const, detail: "No images on the page" }
      : missingAlt.length === 0
        ? {
            status: "pass" as const,
            detail: `All ${a.images.length} images have an alt attribute`,
          }
        : {
            status: "warn" as const,
            detail: `${missingAlt.length} of ${a.images.length} images missing alt`,
            fix: 'Add descriptive alt text (or alt="" for decorative images).',
          }),
  });

  // ── Structured data ──────────────────────────────────────────────────────
  const invalidLd = a.structuredData.filter((s) => !s.valid);
  add({
    id: "structured-data",
    label: "Structured data (JSON-LD)",
    category: "Structure & Semantics",
    weight: 5,
    ...(a.structuredData.length === 0
      ? {
          status: "warn" as const,
          detail: "No JSON-LD structured data",
          fix: "Add schema.org JSON-LD to become eligible for rich results.",
        }
      : invalidLd.length > 0
        ? {
            status: "fail" as const,
            detail: `${invalidLd.length} JSON-LD block(s) contain invalid JSON`,
            fix: "Fix the JSON syntax — invalid blocks are ignored by search engines.",
          }
        : {
            status: "pass" as const,
            detail: `${a.structuredData.length} block(s): ${a.structuredData
              .map((s) => s.type)
              .join(", ")}`,
          }),
  });

  // ── Content depth ────────────────────────────────────────────────────────
  add({
    id: "word-count",
    label: "Content length",
    category: "Meta & Content",
    weight: 4,
    ...(a.wordCount < 300
      ? {
          status: "warn" as const,
          detail: `${a.wordCount} words — thin content`,
          fix: "Aim for 300+ words of substantive content so the page's topic is clear.",
        }
      : {
          status: "pass" as const,
          detail: `${a.wordCount.toLocaleString()} words`,
        }),
  });

  // ── Performance & delivery ───────────────────────────────────────────────
  add({
    id: "response-time",
    label: "Server response time",
    category: "Performance & Delivery",
    weight: 6,
    ...(a.meta.responseTimeMs > 2000
      ? {
          status: "fail" as const,
          detail: `${a.meta.responseTimeMs} ms — slow`,
          fix: "Reduce server response time below 600 ms (caching, CDN).",
        }
      : a.meta.responseTimeMs > 600
        ? {
            status: "warn" as const,
            detail: `${a.meta.responseTimeMs} ms`,
            fix: "Aim for under 600 ms; consider caching or a CDN.",
          }
        : {
            status: "pass" as const,
            detail: `${a.meta.responseTimeMs} ms`,
          }),
  });

  add({
    id: "compression",
    label: "Response compression",
    category: "Performance & Delivery",
    weight: 3,
    ...(a.meta.headers["content-encoding"]
      ? {
          status: "pass" as const,
          detail: a.meta.headers["content-encoding"],
        }
      : {
          status: "warn" as const,
          detail: "No content-encoding header",
          fix: "Enable gzip or brotli compression to cut transfer size.",
        }),
  });

  add({
    id: "hsts",
    label: "HSTS header",
    category: "Performance & Delivery",
    weight: 2,
    ...(a.meta.headers["strict-transport-security"]
      ? { status: "pass" as const, detail: "Strict-Transport-Security is set" }
      : {
          status: "info" as const,
          detail: "No Strict-Transport-Security header",
          fix: "Add HSTS to force HTTPS on repeat visits.",
        }),
  });

  return checks;
}

/** Weighted score. `info` checks are advisory and excluded from the total. */
export function scoreChecks(checks: ICheck[]): {
  score: number;
  scoreByCategory: Record<CheckCategory, { score: number; max: number }>;
} {
  const categories: CheckCategory[] = [
    "Meta & Content",
    "Social Sharing",
    "Indexing & Crawling",
    "Structure & Semantics",
    "Performance & Delivery",
  ];

  const byCategory = {} as Record<
    CheckCategory,
    { score: number; max: number }
  >;
  for (const c of categories) byCategory[c] = { score: 0, max: 0 };

  let earned = 0;
  let total = 0;

  for (const check of checks) {
    if (check.status === "info") continue;
    const value =
      check.status === "pass"
        ? check.weight
        : check.status === "warn"
          ? check.weight * 0.5
          : 0;
    earned += value;
    total += check.weight;
    byCategory[check.category].score += value;
    byCategory[check.category].max += check.weight;
  }

  return {
    score: total > 0 ? Math.round((earned / total) * 100) : 0,
    scoreByCategory: byCategory,
  };
}

/** Heading levels that jump by more than one (e.g. H2 → H4). */
export function findSkippedHeadingLevels(headings: IHeading[]): string[] {
  const issues: string[] = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const cur = headings[i].level;
    if (cur > prev + 1) issues.push(`H${prev}→H${cur}`);
  }
  return issues;
}

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

/** How Google is likely to render the title (it truncates by pixel width). */
export function serpTitle(title: string | null, fallback: string): string {
  const t = title?.trim() || fallback;
  return truncate(t, TITLE_MAX);
}

export function serpDescription(desc: string | null): string {
  if (!desc?.trim()) {
    return "No meta description — search engines will pick text from the page.";
  }
  return truncate(desc.trim(), DESC_MAX);
}

/** Display form of a URL for SERP previews: host + breadcrumb path. */
export function serpDisplayUrl(url: string): string {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return u.hostname;
    return `${u.hostname} › ${segments.slice(0, 3).join(" › ")}`;
  } catch {
    return url;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`;
}
