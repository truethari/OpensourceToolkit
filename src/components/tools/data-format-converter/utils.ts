import { load, loadAll, dump } from "js-yaml";
import { parse as tomlParse, stringify as tomlStringify } from "smol-toml";

export type DataFormat = "json" | "yaml" | "toml";

export interface ConvertOptions {
  indent: number;
  sortKeys: boolean;
  /** Expand YAML anchors/aliases instead of emitting references. */
  noRefs: boolean;
}

export const DEFAULT_OPTIONS: ConvertOptions = {
  indent: 2,
  sortKeys: false,
  noRefs: true,
};

export interface ConvertSuccess {
  ok: true;
  output: string;
  /** Non-fatal issues, e.g. values TOML cannot represent. */
  warnings: string[];
}

export interface ConvertFailure {
  ok: false;
  error: string;
  /** 1-based position of the syntax error, when the parser reports one. */
  line?: number;
  column?: number;
  /** Parser-rendered excerpt pointing at the offending token. */
  snippet?: string;
}

export type ConvertResult = ConvertSuccess | ConvertFailure;

export const FORMAT_LABELS: Record<DataFormat, string> = {
  json: "JSON",
  yaml: "YAML",
  toml: "TOML",
};

export const FILE_EXTENSIONS: Record<DataFormat, string> = {
  json: "json",
  yaml: "yaml",
  toml: "toml",
};

/**
 * js-yaml and smol-toml both attach positional data to their errors, but under
 * different shapes. Normalise them so the UI can render one consistent hint.
 */
function describeParseError(err: unknown, format: DataFormat): ConvertFailure {
  const label = FORMAT_LABELS[format];

  if (err && typeof err === "object") {
    // js-yaml: YAMLException carries a `mark` with 0-based line/column.
    const mark = (err as { mark?: unknown }).mark;
    if (mark && typeof mark === "object") {
      const m = mark as { line?: number; column?: number; snippet?: string };
      const reason =
        (err as { reason?: string }).reason ??
        (err as { message?: string }).message ??
        "Invalid syntax";
      return {
        ok: false,
        error: `${label} parse error: ${reason}`,
        line: typeof m.line === "number" ? m.line + 1 : undefined,
        column: typeof m.column === "number" ? m.column + 1 : undefined,
        snippet: typeof m.snippet === "string" ? m.snippet : undefined,
      };
    }

    // smol-toml: TomlError exposes 1-based line/column plus a codeblock.
    const line = (err as { line?: number }).line;
    const column = (err as { column?: number }).column;
    if (typeof line === "number") {
      const codeblock = (err as { codeblock?: string }).codeblock;
      return {
        ok: false,
        error: `${label} parse error: ${
          (err as { message?: string }).message ?? "Invalid syntax"
        }`,
        line,
        column: typeof column === "number" ? column : undefined,
        snippet: typeof codeblock === "string" ? codeblock : undefined,
      };
    }
  }

  return {
    ok: false,
    error: `${label} parse error: ${
      err instanceof Error ? err.message : "Invalid syntax"
    }`,
  };
}

/**
 * Parse `text` into a plain JS value. Multi-document YAML collapses into an
 * array of documents so downstream formats still receive a single value.
 */
export function parseInput(text: string, format: DataFormat): unknown {
  switch (format) {
    case "json":
      return JSON.parse(text);
    case "yaml": {
      const docs = loadAll(text);
      if (docs.length === 0) return undefined;
      return docs.length === 1 ? docs[0] : docs;
    }
    case "toml":
      return tomlParse(text);
  }
}

/** Recursively sort object keys so serialisers emit a stable order. */
function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    return Object.fromEntries(entries.map(([k, v]) => [k, sortValue(v)]));
  }
  return value;
}

/**
 * TOML has no null type: smol-toml silently omits null-valued keys and throws
 * on nulls inside arrays. Collect the paths up front so we can tell the user
 * exactly what would be lost rather than dropping data quietly.
 */
function findNullPaths(
  value: unknown,
  path: string[] = [],
  /** True when `value` sits directly in an array, which TOML rejects outright. */
  inArray = false,
): { path: string; inArray: boolean }[] {
  const here = path.length ? path.join(".") : "(root)";
  if (value === null) return [{ path: here, inArray }];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) =>
      findNullPaths(item, [...path, `${i}`], true),
    );
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      findNullPaths(v, [...path, k], false),
    );
  }
  return [];
}

function formatPathList(paths: string[]): string {
  const shown = paths.slice(0, 5).join(", ");
  return paths.length > 5 ? `${shown} (+${paths.length - 5} more)` : shown;
}

function serialize(
  value: unknown,
  format: DataFormat,
  options: ConvertOptions,
): ConvertSuccess {
  const warnings: string[] = [];
  const data = options.sortKeys ? sortValue(value) : value;

  switch (format) {
    case "json":
      return {
        ok: true,
        output: JSON.stringify(data, null, options.indent),
        warnings,
      };

    case "yaml":
      return {
        ok: true,
        output: dump(data, {
          indent: options.indent,
          sortKeys: options.sortKeys,
          noRefs: options.noRefs,
          lineWidth: -1,
        }),
        warnings,
      };

    case "toml": {
      if (data === null || typeof data !== "object" || Array.isArray(data)) {
        throw new Error(
          "TOML documents must have a table (object) at the top level. " +
            "Wrap this value in an object before converting.",
        );
      }

      // A null sitting directly in an array is fatal for smol-toml, whereas a
      // null-valued key is merely dropped — surface each case accordingly.
      const nulls = findNullPaths(data);
      const nullsInArrays = nulls.filter((n) => n.inArray);
      if (nullsInArrays.length > 0) {
        throw new Error(
          `TOML arrays cannot contain null values. Remove or replace: ${formatPathList(
            nullsInArrays.map((n) => n.path),
          )}`,
        );
      }
      if (nulls.length > 0) {
        warnings.push(
          `TOML has no null type — ${nulls.length} null value(s) were omitted: ${formatPathList(
            nulls.map((n) => n.path),
          )}`,
        );
      }

      return { ok: true, output: tomlStringify(data), warnings };
    }
  }
}

/** Parse `text` as `from` and re-emit it as `to`. */
export function convert(
  text: string,
  from: DataFormat,
  to: DataFormat,
  options: ConvertOptions = DEFAULT_OPTIONS,
): ConvertResult {
  if (!text.trim()) {
    return { ok: false, error: "Enter some data to convert." };
  }

  let parsed: unknown;
  try {
    parsed = parseInput(text, from);
  } catch (err) {
    return describeParseError(err, from);
  }

  if (parsed === undefined) {
    return { ok: false, error: `No ${FORMAT_LABELS[from]} document found.` };
  }

  try {
    return serialize(parsed, to, options);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : `Failed to write ${FORMAT_LABELS[to]}.`,
    };
  }
}

/** Validate without converting — used by the live status indicator. */
export function validate(text: string, format: DataFormat): ConvertResult {
  if (!text.trim()) return { ok: false, error: "" };
  try {
    parseInput(text, format);
    return { ok: true, output: "", warnings: [] };
  } catch (err) {
    return describeParseError(err, format);
  }
}

/**
 * Guess the format of pasted text so the input selector can follow along.
 * Returns null when the content is ambiguous.
 */
export function detectFormat(text: string): DataFormat | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      // Fall through — may still be YAML flow syntax.
    }
  }

  // TOML's table headers and `key = value` lines are unambiguous enough,
  // provided we ignore comments and blank lines first.
  const lines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const hasTomlAssignment = lines.some((l) => /^[A-Za-z0-9_."'-]+\s*=/.test(l));
  const hasTomlTable = lines.some((l) => /^\[\[?[^\]]+\]\]?$/.test(l));
  if ((hasTomlTable || hasTomlAssignment) && !trimmed.startsWith("{")) {
    try {
      tomlParse(trimmed);
      return "toml";
    } catch {
      // Not TOML after all.
    }
  }

  try {
    const result = load(trimmed);
    // A bare string means YAML accepted arbitrary prose; that's not a signal.
    if (result !== null && typeof result === "object") return "yaml";
  } catch {
    // Not YAML either.
  }

  return null;
}
