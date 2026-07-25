import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side fetch for the SEO analyzer.
 *
 * This has to run on the server: browsers block cross-origin reads of arbitrary
 * HTML, so the page source can't be inspected from the client. The route only
 * returns the raw HTML plus transport metadata — all parsing and scoring is done
 * client-side so the analysis logic stays inspectable and testable.
 */

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — plenty for HTML, guards against huge bodies
const TIMEOUT_MS = 15_000;

/**
 * Reject anything that isn't a public http(s) URL.
 *
 * Without this the route is an SSRF vector: a user could point it at
 * 169.254.169.254 (cloud metadata) or hosts inside the deployment's network.
 */
function validateUrl(raw: string): { url: URL } | { error: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { error: "That doesn't look like a valid URL" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { error: "Only http:// and https:// URLs can be analyzed" };
  }

  const host = url.hostname.toLowerCase();

  // Block loopback / link-local / private ranges and bare hostnames.
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    // IPv6 loopback / unique-local / link-local
    host === "::1" ||
    host === "[::1]" ||
    /^\[?f[cd][0-9a-f]{2}:/i.test(host) ||
    /^\[?fe80:/i.test(host);

  if (blocked) {
    return { error: "Private and loopback addresses cannot be analyzed" };
  }

  // A public hostname must contain a dot (rejects intranet names like "router").
  if (!host.includes(".") && !host.startsWith("[")) {
    return { error: "Enter a full public domain, e.g. example.com" };
  }

  return { url };
}

export async function POST(request: NextRequest) {
  let target: string;
  try {
    const body = await request.json();
    target = typeof body?.url === "string" ? body.url.trim() : "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!target) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  // Default to https:// when the user omits the scheme.
  if (!/^https?:\/\//i.test(target)) {
    target = `https://${target}`;
  }

  const validated = validateUrl(target);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(validated.url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Identify honestly rather than impersonating a browser, but send an
        // Accept header so servers return HTML rather than an API response.
        "User-Agent":
          "Mozilla/5.0 (compatible; OpensourceToolkit-SEO-Analyzer/1.0; +https://opensourcetoolkit.com)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const responseTimeMs = Date.now() - startedAt;
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("html") && !contentType.includes("xml")) {
      return NextResponse.json(
        {
          error: `That URL returned "${contentType || "an unknown type"}" rather than an HTML page`,
        },
        { status: 415 },
      );
    }

    // Read with a hard byte cap so a huge response can't exhaust memory.
    const reader = response.body?.getReader();
    let html = "";
    let bytes = 0;
    let truncated = false;

    if (reader) {
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_BYTES) {
          truncated = true;
          await reader.cancel();
          break;
        }
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();
    } else {
      html = await response.text();
      bytes = html.length;
    }

    // Surface security-relevant headers; the client scores them.
    const headerNames = [
      "content-type",
      "content-encoding",
      "strict-transport-security",
      "content-security-policy",
      "x-content-type-options",
      "x-frame-options",
      "referrer-policy",
      "cache-control",
      "server",
      "x-robots-tag",
    ];
    const headers: Record<string, string> = {};
    for (const name of headerNames) {
      const value = response.headers.get(name);
      if (value) headers[name] = value;
    }

    return NextResponse.json({
      html,
      finalUrl: response.url || validated.url.toString(),
      status: response.status,
      redirected: response.redirected,
      responseTimeMs,
      sizeBytes: bytes,
      truncated,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `The site took longer than ${TIMEOUT_MS / 1000}s to respond`
        : "Could not reach that URL — check the address and that the site is online";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
