"use client";

import React from "react";
import { Globe, ImageOff } from "lucide-react";

import {
  serpTitle,
  serpDescription,
  serpDisplayUrl,
  truncate,
  type ISeoAnalysis,
} from "./seo-utils";

/**
 * Preview renderers that approximate how each platform displays a shared link.
 * These are visual approximations — exact typography and truncation differ per
 * platform and change over time.
 */

function resolveAsset(value: string | undefined, base: string): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

/** Social image with a graceful fallback when the URL can't be loaded. */
function PreviewImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground ${className}`}
      >
        <ImageOff className="h-6 w-6" />
        <span className="px-2 text-center text-[11px]">
          {src ? "Image failed to load" : "No image tag set"}
        </span>
      </div>
    );
  }

  return (
    // next/image can't be used here: these are arbitrary third-party hosts that
    // aren't in the remotePatterns allowlist, and the preview must render the
    // exact asset the page declares.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}

export function GooglePreview({ a }: { a: ISeoAnalysis }) {
  const url = a.canonical ?? a.meta.finalUrl;
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    host = url;
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-[#202124]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-white">
          {a.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote host
            <img
              src={a.favicon}
              alt=""
              className="h-4 w-4"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm text-[#202124] dark:text-[#e8eaed]">
            {host}
          </div>
          <div className="truncate text-xs text-[#4d5156] dark:text-[#bdc1c6]">
            {serpDisplayUrl(url)}
          </div>
        </div>
      </div>

      <h3 className="mt-1.5 text-xl leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
        {serpTitle(a.title, host)}
      </h3>
      <p className="mt-1 text-sm leading-snug text-[#4d5156] dark:text-[#bdc1c6]">
        {serpDescription(a.description)}
      </p>
    </div>
  );
}

export function FacebookPreview({ a }: { a: ISeoAnalysis }) {
  const base = a.meta.finalUrl;
  const image =
    resolveAsset(a.openGraph["og:image"], base) ??
    resolveAsset(a.twitter["twitter:image"], base);
  const title = a.openGraph["og:title"] ?? a.title ?? "";
  const desc = a.openGraph["og:description"] ?? a.description ?? "";
  let host = "";
  try {
    host = new URL(base).hostname.replace(/^www\./, "");
  } catch {
    host = base;
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white dark:bg-[#242526]">
      <PreviewImage
        src={image}
        alt="Open Graph preview"
        className="aspect-[1.91/1] w-full bg-muted object-cover"
      />
      <div className="border-t bg-[#f2f3f5] px-3 py-2 dark:bg-[#3a3b3c]">
        <div className="text-[11px] uppercase tracking-wide text-[#606770] dark:text-[#b0b3b8]">
          {host}
        </div>
        <div className="mt-0.5 line-clamp-2 font-semibold leading-tight text-[#1c1e21] dark:text-[#e4e6eb]">
          {title || "No og:title set"}
        </div>
        {desc && (
          <div className="mt-0.5 line-clamp-1 text-sm text-[#606770] dark:text-[#b0b3b8]">
            {truncate(desc, 120)}
          </div>
        )}
      </div>
    </div>
  );
}

export function TwitterPreview({ a }: { a: ISeoAnalysis }) {
  const base = a.meta.finalUrl;
  const card = a.twitter["twitter:card"] ?? "summary";
  const isLarge = card === "summary_large_image" && !!a.openGraph["og:image"];
  const image =
    resolveAsset(a.twitter["twitter:image"], base) ??
    resolveAsset(a.openGraph["og:image"], base);
  const title =
    a.twitter["twitter:title"] ?? a.openGraph["og:title"] ?? a.title ?? "";
  const desc =
    a.twitter["twitter:description"] ??
    a.openGraph["og:description"] ??
    a.description ??
    "";
  let host = "";
  try {
    host = new URL(base).hostname.replace(/^www\./, "");
  } catch {
    host = base;
  }

  if (isLarge) {
    return (
      <div className="overflow-hidden rounded-2xl border bg-white dark:bg-black">
        <PreviewImage
          src={image}
          alt="Twitter card preview"
          className="aspect-[1.91/1] w-full bg-muted object-cover"
        />
        <div className="px-3 py-2">
          <div className="line-clamp-1 text-[15px] text-[#0f1419] dark:text-[#e7e9ea]">
            {title || "No title set"}
          </div>
          {desc && (
            <div className="line-clamp-2 text-[15px] text-[#536471] dark:text-[#71767b]">
              {truncate(desc, 120)}
            </div>
          )}
          <div className="mt-0.5 text-[15px] text-[#536471] dark:text-[#71767b]">
            {host}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden rounded-2xl border bg-white dark:bg-black">
      <PreviewImage
        src={image}
        alt="Twitter card preview"
        className="h-[130px] w-[130px] shrink-0 bg-muted object-cover"
      />
      <div className="min-w-0 flex-1 px-3 py-2">
        <div className="text-[15px] text-[#536471] dark:text-[#71767b]">
          {host}
        </div>
        <div className="line-clamp-1 text-[15px] text-[#0f1419] dark:text-[#e7e9ea]">
          {title || "No title set"}
        </div>
        {desc && (
          <div className="line-clamp-2 text-[15px] text-[#536471] dark:text-[#71767b]">
            {truncate(desc, 100)}
          </div>
        )}
      </div>
    </div>
  );
}

export function SlackPreview({ a }: { a: ISeoAnalysis }) {
  const base = a.meta.finalUrl;
  const image = resolveAsset(a.openGraph["og:image"], base);
  const title = a.openGraph["og:title"] ?? a.title ?? "";
  const desc = a.openGraph["og:description"] ?? a.description ?? "";
  const siteName = a.openGraph["og:site_name"];
  let host = "";
  try {
    host = new URL(base).hostname.replace(/^www\./, "");
  } catch {
    host = base;
  }

  return (
    <div className="rounded-md bg-white p-3 dark:bg-[#1a1d21]">
      <div className="border-l-4 border-[#e8e8e8] pl-3 dark:border-[#35373b]">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#1d1c1d] dark:text-[#d1d2d3]">
          {a.favicon && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote host
            <img
              src={a.favicon}
              alt=""
              className="h-4 w-4"
              referrerPolicy="no-referrer"
            />
          )}
          {siteName ?? host}
        </div>
        <div className="mt-0.5 text-[15px] font-bold text-[#1264a3] dark:text-[#1d9bd1]">
          {title || "No title set"}
        </div>
        {desc && (
          <div className="mt-0.5 text-[15px] leading-snug text-[#1d1c1d] dark:text-[#d1d2d3]">
            {truncate(desc, 180)}
          </div>
        )}
        {image && (
          <PreviewImage
            src={image}
            alt="Slack unfurl preview"
            className="mt-2 max-h-52 rounded-lg object-cover"
          />
        )}
      </div>
    </div>
  );
}
