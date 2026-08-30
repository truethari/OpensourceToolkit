// Base64 URL encode/decode functions
export const base64UrlEncode = (str: string) => {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

export const base64UrlDecode = (str: string) => {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) {
    str += "=".repeat(4 - pad);
  }
  return atob(str);
};

// Simple HMAC SHA256 implementation (for demo purposes)
export const hmacSha256 = async (message: string, secret: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
};

/* ------------------------------------------------------------------ *
 * Registered claim inspection
 * ------------------------------------------------------------------ */

/**
 * Claims registered with IANA (RFC 7519 §4.1) plus the few de-facto standards
 * that show up in nearly every real token. Anything not listed here is treated
 * as a custom claim and left untouched.
 */
export const REGISTERED_CLAIMS: Record<
  string,
  { label: string; description: string; kind: "time" | "text" | "list" }
> = {
  iss: { label: "Issuer", description: "Who issued the token", kind: "text" },
  sub: {
    label: "Subject",
    description: "Who the token is about",
    kind: "text",
  },
  aud: {
    label: "Audience",
    description: "Who the token is intended for",
    kind: "list",
  },
  exp: {
    label: "Expires at",
    description: "Token is rejected at or after this time",
    kind: "time",
  },
  nbf: {
    label: "Not before",
    description: "Token is rejected before this time",
    kind: "time",
  },
  iat: { label: "Issued at", description: "When it was issued", kind: "time" },
  jti: {
    label: "JWT ID",
    description: "Unique token identifier",
    kind: "text",
  },
  // Common non-registered claims worth surfacing.
  azp: {
    label: "Authorized party",
    description: "Client the token was issued to",
    kind: "text",
  },
  scope: {
    label: "Scope",
    description: "Granted OAuth scopes",
    kind: "text",
  },
  auth_time: {
    label: "Authenticated at",
    description: "When the user actually authenticated",
    kind: "time",
  },
  updated_at: {
    label: "Profile updated at",
    description: "When the profile last changed",
    kind: "time",
  },
};

/** Header parameters worth naming (RFC 7515 §4.1). */
export const HEADER_PARAMS: Record<string, string> = {
  alg: "Algorithm",
  typ: "Type",
  kid: "Key ID",
  cty: "Content type",
  jku: "JWK Set URL",
  jwk: "JSON Web Key",
  x5t: "X.509 thumbprint",
  x5u: "X.509 URL",
  crit: "Critical",
};

/**
 * A NumericDate is seconds since the epoch (RFC 7519 §2). Only accept values
 * that land in a plausible range so an ordinary number like `"version": 2`
 * is never rendered as a 1970 date.
 *
 * Bounds: 2001-09-09 .. 2286-11-20, i.e. 10-digit second timestamps.
 */
export function isPlausibleTimestamp(value: unknown): value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (!Number.isInteger(value)) return false;
  return value >= 1_000_000_000 && value <= 9_999_999_999;
}

export interface FormattedTime {
  local: string;
  utc: string;
  relative: string;
  /** True when the instant has already passed. */
  past: boolean;
}

/** Human "3 days ago" / "in 2 hours" for a delta in seconds. */
function relativeFromSeconds(deltaSeconds: number): string {
  const past = deltaSeconds < 0;
  const abs = Math.abs(deltaSeconds);

  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [2_592_000, "day"],
    [31_536_000, "month"],
  ];

  let amount = Math.round(abs / 31_536_000);
  let unit: Intl.RelativeTimeFormatUnit = "year";

  for (let i = 0; i < units.length; i++) {
    const [limit, name] = units[i];
    if (abs < limit) {
      const divisor = i === 0 ? 1 : units[i - 1][0];
      amount = Math.round(abs / divisor);
      unit = name;
      break;
    }
  }

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  return rtf.format(past ? -amount : amount, unit);
}

/**
 * Render a NumericDate in the viewer's own timezone, with UTC and a relative
 * description alongside. `now` is injectable so this stays testable.
 */
export function formatTimestamp(
  seconds: number,
  now = Date.now(),
): FormattedTime {
  const date = new Date(seconds * 1000);

  return {
    local: new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "long",
    }).format(date),
    utc: date.toISOString().replace("T", " ").replace(".000Z", " UTC"),
    relative: relativeFromSeconds(seconds - Math.floor(now / 1000)),
    past: seconds * 1000 < now,
  };
}

export type ClaimStatus = "ok" | "expired" | "not-yet-valid" | "none";

export interface ClaimRow {
  key: string;
  label: string;
  description: string;
  /** Display-ready value. */
  display: string;
  /** Raw value, used for copying. */
  raw: string;
  time?: FormattedTime;
  status: ClaimStatus;
}

export interface TokenValidity {
  expired: boolean;
  notYetValid: boolean;
  /** Seconds until exp; negative once expired. Undefined when there is no exp. */
  secondsRemaining?: number;
  lifetimeSeconds?: number;
}

function stringifyClaim(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Split a decoded payload into the registered claims (with timestamps resolved)
 * and everything else, so the UI can present the standard fields separately.
 */
export function inspectClaims(
  payload: Record<string, unknown>,
  now = Date.now(),
): {
  standard: ClaimRow[];
  custom: ClaimRow[];
  validity: TokenValidity;
} {
  const standard: ClaimRow[] = [];
  const custom: ClaimRow[] = [];

  const nowSeconds = Math.floor(now / 1000);
  const exp = payload.exp;
  const nbf = payload.nbf;
  const iat = payload.iat;

  const expired = isPlausibleTimestamp(exp) ? exp < nowSeconds : false;
  const notYetValid = isPlausibleTimestamp(nbf) ? nbf > nowSeconds : false;

  for (const [key, value] of Object.entries(payload)) {
    const meta = REGISTERED_CLAIMS[key];
    const raw = stringifyClaim(value);

    if (!meta) {
      custom.push({
        key,
        label: key,
        description: "",
        display: raw,
        raw,
        status: "none",
      });
      continue;
    }

    // Only format as a date when the value really is a NumericDate; otherwise
    // fall back to showing it verbatim rather than inventing a 1970 timestamp.
    const isTime = meta.kind === "time" && isPlausibleTimestamp(value);
    const time = isTime ? formatTimestamp(value as number, now) : undefined;

    let status: ClaimStatus = "none";
    if (key === "exp" && isTime) status = expired ? "expired" : "ok";
    if (key === "nbf" && isTime) status = notYetValid ? "not-yet-valid" : "ok";

    standard.push({
      key,
      label: meta.label,
      description: meta.description,
      display: time ? time.local : raw,
      raw,
      time,
      status,
    });
  }

  // Present standard claims in a predictable, spec-ish order rather than
  // whatever order the token happened to serialise them in.
  const order = Object.keys(REGISTERED_CLAIMS);
  standard.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  const validity: TokenValidity = {
    expired,
    notYetValid,
    secondsRemaining: isPlausibleTimestamp(exp) ? exp - nowSeconds : undefined,
    lifetimeSeconds:
      isPlausibleTimestamp(exp) && isPlausibleTimestamp(iat)
        ? exp - iat
        : undefined,
  };

  return { standard, custom, validity };
}

/** "2h 15m" / "3d 4h" — a compact duration for the countdown badge. */
export function formatDuration(totalSeconds: number): string {
  const abs = Math.abs(Math.trunc(totalSeconds));
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Header parameters as display rows, mirroring the payload claim rows. */
export function inspectHeader(header: Record<string, unknown>): ClaimRow[] {
  return Object.entries(header).map(([key, value]) => {
    const raw = stringifyClaim(value);
    return {
      key,
      label: HEADER_PARAMS[key] ?? key,
      description: "",
      display: raw,
      raw,
      status: "none" as ClaimStatus,
    };
  });
}
