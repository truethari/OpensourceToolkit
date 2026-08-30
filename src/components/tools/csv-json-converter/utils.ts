/**
 * Pure CSV <-> JSON logic. No React here on purpose: everything in this file
 * can be exercised directly with `npx tsx` (see CLAUDE.md) without rendering.
 */

export type Delimiter = "," | ";" | "\t" | "|";
export type LineEnding = "lf" | "crlf";
export type QuoteMode = "minimal" | "all";
export type UnflattenMode = "auto" | "always" | "never";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export interface CsvParseOptions {
  delimiter: Delimiter;
  /** First row supplies the object keys. Off => keys become "column_1", ... */
  hasHeader: boolean;
  /** "12" -> 12, "true" -> true, "" -> null. Off keeps every value a string. */
  inferTypes: boolean;
  /** Strip surrounding whitespace from every unquoted field. */
  trimFields: boolean;
  /** Drop rows where every field is empty. */
  skipEmptyLines: boolean;
  /**
   * Turn `a.b` / `a[0]` headers back into real nested structures — the inverse
   * of the flattening done by JSON -> CSV, so a round trip returns the original
   * shape. "auto" nests only when the headers actually look flattened, leaving
   * a literal header like "2024.Q1" alone.
   */
  unflatten: UnflattenMode;
}

export interface JsonToCsvOptions {
  delimiter: Delimiter;
  lineEnding: LineEnding;
  quoteMode: QuoteMode;
  /** Emit the header row. */
  includeHeader: boolean;
  /** Flatten nested objects/arrays into dotted `a.b[0]` columns. */
  flatten: boolean;
  /** Serialise nested values as JSON text instead of flattening them. */
  stringifyNested: boolean;
  /** Placeholder written for null / undefined cells. */
  nullValue: string;
  /** Prefix formula-leading cells with `'` to defuse CSV injection. */
  sanitizeFormulas: boolean;
}

export const DEFAULT_CSV_OPTIONS: CsvParseOptions = {
  delimiter: ",",
  hasHeader: true,
  inferTypes: true,
  trimFields: true,
  skipEmptyLines: true,
  unflatten: "auto",
};

export const DEFAULT_JSON_OPTIONS: JsonToCsvOptions = {
  delimiter: ",",
  lineEnding: "lf",
  quoteMode: "minimal",
  includeHeader: true,
  flatten: true,
  stringifyNested: false,
  nullValue: "",
  sanitizeFormulas: true,
};

export const DELIMITER_LABELS: Record<Delimiter, string> = {
  ",": "Comma  ,",
  ";": "Semicolon  ;",
  "\t": "Tab  \\t",
  "|": "Pipe  |",
};

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

export interface CsvParseResult {
  /** Header names in source order. */
  headers: string[];
  /** Raw string cells, one array per record, aligned to `headers`. */
  rows: string[][];
  /** Records as objects, after type inference / unflattening. */
  records: JsonObject[];
  errors: ParseError[];
  /** Non-fatal notes: ragged rows, duplicate headers, ... */
  warnings: string[];
}

/* ------------------------------------------------------------------ *
 * CSV -> JSON
 * ------------------------------------------------------------------ */

/**
 * Split raw CSV text into rows of raw string fields, following RFC 4180:
 * double quotes wrap fields that contain the delimiter, newlines, or quotes,
 * and a literal quote inside a quoted field is written as "".
 *
 * A hand-written scanner (rather than a regex or a naive split) is what makes
 * embedded newlines work — those are the case that breaks most CSV tools.
 */
export function tokenizeCsv(
  text: string,
  delimiter: string,
): { rows: string[][]; quoted: boolean[][]; errors: ParseError[] } {
  const rows: string[][] = [];
  const quoted: boolean[][] = [];
  const errors: ParseError[] = [];

  let row: string[] = [];
  let rowQuoted: boolean[] = [];
  let field = "";
  let fieldWasQuoted = false;
  let inQuotes = false;
  let line = 1;
  let column = 1;
  let quoteStartLine = 1;

  const endField = () => {
    row.push(field);
    rowQuoted.push(fieldWasQuoted);
    field = "";
    fieldWasQuoted = false;
  };

  const endRow = () => {
    endField();
    rows.push(row);
    quoted.push(rowQuoted);
    row = [];
    rowQuoted = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
          column += 2;
          continue;
        }
        inQuotes = false;
        column++;
        continue;
      }
      field += char;
      if (char === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
      continue;
    }

    if (char === '"') {
      if (field.length > 0) {
        // A quote appearing mid-field is malformed; keep it literally rather
        // than discarding the user's data, but tell them where it happened.
        errors.push({
          message: "Unexpected quote in the middle of an unquoted field",
          line,
          column,
        });
        field += char;
        column++;
        continue;
      }
      inQuotes = true;
      fieldWasQuoted = true;
      quoteStartLine = line;
      column++;
      continue;
    }

    if (char === delimiter) {
      endField();
      column++;
      continue;
    }

    if (char === "\r") {
      // Consume CRLF as a single terminator; a lone CR also ends the row.
      if (text[i + 1] === "\n") i++;
      endRow();
      line++;
      column = 1;
      continue;
    }

    if (char === "\n") {
      endRow();
      line++;
      column = 1;
      continue;
    }

    field += char;
    column++;
  }

  if (inQuotes) {
    errors.push({
      message: 'Unterminated quoted field — a closing " is missing',
      line: quoteStartLine,
    });
  }

  // Trailing newline shouldn't manufacture a phantom row.
  if (field.length > 0 || row.length > 0) endRow();

  return { rows, quoted, errors };
}

/** `"12"` -> 12, `"true"` -> true, `""` -> null, everything else stays a string. */
export function inferValue(raw: string): JsonValue {
  const value = raw.trim();
  if (value === "") return null;

  const lower = value.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  if (lower === "null") return null;

  // Reject anything a round-trip wouldn't survive: leading zeros ("007"),
  // phone numbers, and values beyond IEEE-754 integer precision must stay text.
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
    const num = Number(value);
    if (Number.isFinite(num) && String(num) === value) return num;
  }

  return raw;
}

/**
 * Rebuild nested structures from flattened headers: `user.name` and `tags[0]`
 * become a real object and array. This is the inverse of `flattenObject`.
 */
export function setDeep(target: JsonObject, path: string, value: JsonValue) {
  const segments = parsePath(path);
  if (segments.length === 0) return;

  let node: JsonValue = target;

  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    const nextKey = segments[i + 1];
    const container = typeof nextKey === "number" ? [] : {};

    if (typeof key === "number") {
      const arr = node as JsonValue[];
      if (typeof arr[key] !== "object" || arr[key] === null) {
        arr[key] = container;
      }
      node = arr[key];
    } else {
      const obj = node as JsonObject;
      if (typeof obj[key] !== "object" || obj[key] === null) {
        obj[key] = container;
      }
      node = obj[key];
    }
  }

  const last = segments[segments.length - 1];
  if (typeof last === "number") {
    (node as JsonValue[])[last] = value;
  } else {
    (node as JsonObject)[last] = value;
  }
}

/** `a.b[0].c` -> ["a", "b", 0, "c"] */
function parsePath(path: string): (string | number)[] {
  const segments: (string | number)[] = [];
  const parts = path.split(".");

  for (const part of parts) {
    const match = part.match(/^([^[\]]*)((\[\d+\])*)$/);
    if (!match) {
      segments.push(part);
      continue;
    }
    const [, name, indices] = match;
    if (name) segments.push(name);
    if (indices) {
      for (const index of indices.matchAll(/\[(\d+)\]/g)) {
        segments.push(Number(index[1]));
      }
    }
  }

  return segments;
}

/**
 * Decide whether headers are flattened paths that should be rebuilt into nested
 * objects. Requires a segment structure a flattener would actually emit — a
 * non-empty name on both sides of the dot, or a trailing `[0]` index — so
 * headers that merely contain a dot ("2024.Q1", "Mr. Smith") are left flat.
 *
 * Also refuses to nest when a path would collide with a scalar column (both
 * "user" and "user.name" present), since one of the two would be destroyed.
 */
export function looksFlattened(headers: string[]): boolean {
  // A segment is an identifier-ish run with no surrounding whitespace: a real
  // flattener emits "obj.name", never "Mr. Smith".
  const segment = "[^\\s.[\\]]+";
  const dotted = new RegExp(`^${segment}(\\.${segment})+$`);
  const indexed = new RegExp(`^${segment}(\\.${segment})*(\\[\\d+\\])+$`);
  const paths = headers.filter((h) => dotted.test(h) || indexed.test(h));
  if (paths.length === 0) return false;

  // A root that also exists as its own column can't become an object.
  const roots = new Set(paths.map((h) => h.split(/[.[]/)[0]));
  for (const header of headers) {
    if (roots.has(header)) return false;
  }

  return true;
}

export function parseCsv(
  text: string,
  options: CsvParseOptions,
): CsvParseResult {
  const warnings: string[] = [];

  if (text.trim() === "") {
    return { headers: [], rows: [], records: [], errors: [], warnings };
  }

  // Strip a UTF-8 BOM — Excel writes one and it would poison the first header.
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const {
    rows: rawRows,
    quoted,
    errors,
  } = tokenizeCsv(clean, options.delimiter);

  let rows = rawRows;
  let quotedFlags = quoted;

  if (options.skipEmptyLines) {
    const kept: number[] = [];
    rows.forEach((row, i) => {
      if (!row.every((cell) => cell.trim() === "")) kept.push(i);
    });
    rows = kept.map((i) => rows[i]);
    quotedFlags = kept.map((i) => quotedFlags[i]);
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], records: [], errors, warnings };
  }

  const width = Math.max(...rows.map((row) => row.length));

  let headers: string[];
  let bodyStart: number;

  if (options.hasHeader) {
    headers = normalizeHeaders(rows[0], width, warnings);
    bodyStart = 1;
  } else {
    headers = Array.from({ length: width }, (_, i) => `column_${i + 1}`);
    bodyStart = 0;
  }

  // Resolved once per parse rather than per cell, so "auto" inspects the whole
  // header set instead of guessing column by column.
  const nest =
    options.unflatten === "always" ||
    (options.unflatten === "auto" && looksFlattened(headers));

  const bodyRows = rows.slice(bodyStart);
  const bodyQuoted = quotedFlags.slice(bodyStart);
  const records: JsonObject[] = [];
  let ragged = 0;

  bodyRows.forEach((row, rowIndex) => {
    if (row.length !== headers.length) ragged++;

    const record: JsonObject = {};

    headers.forEach((header, colIndex) => {
      const rawCell = row[colIndex];
      const missing = rawCell === undefined;
      const cell = missing ? "" : rawCell;
      const wasQuoted = bodyQuoted[rowIndex]?.[colIndex] ?? false;
      const trimmed = options.trimFields && !wasQuoted ? cell.trim() : cell;

      // A quoted "" is a deliberate empty string; a bare one is absent data.
      let value: JsonValue;
      if (options.inferTypes && !wasQuoted) {
        value = missing ? null : inferValue(trimmed);
      } else {
        value = trimmed;
      }

      if (nest) {
        setDeep(record, header, value);
      } else {
        record[header] = value;
      }
    });

    records.push(record);
  });

  if (ragged > 0) {
    warnings.push(
      `${ragged} row${ragged === 1 ? "" : "s"} had a different column count than the header; missing cells were filled with empty values.`,
    );
  }

  return { headers, rows: bodyRows, records, errors, warnings };
}

function normalizeHeaders(
  raw: string[],
  width: number,
  warnings: string[],
): string[] {
  const headers: string[] = [];
  const seen = new Map<string, number>();
  let blanks = 0;
  let duplicates = 0;

  for (let i = 0; i < width; i++) {
    let name = (raw[i] ?? "").trim();

    if (name === "") {
      name = `column_${i + 1}`;
      blanks++;
    }

    // Duplicate keys would silently overwrite each other in an object.
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count > 0) {
      duplicates++;
      name = `${name}_${count + 1}`;
    }

    headers.push(name);
  }

  if (blanks > 0) {
    warnings.push(
      `${blanks} header cell${blanks === 1 ? " was" : "s were"} empty and got a generated name.`,
    );
  }
  if (duplicates > 0) {
    warnings.push(
      `${duplicates} duplicate header name${duplicates === 1 ? " was" : "s were"} suffixed to keep keys unique.`,
    );
  }

  return headers;
}

/* ------------------------------------------------------------------ *
 * JSON -> CSV
 * ------------------------------------------------------------------ */

export function flattenObject(
  value: JsonValue,
  prefix = "",
  out: Record<string, JsonValue> = {},
): Record<string, JsonValue> {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      out[prefix || "value"] = "";
      return out;
    }
    value.forEach((item, i) => flattenObject(item, `${prefix}[${i}]`, out));
    return out;
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      out[prefix || "value"] = "";
      return out;
    }
    for (const [key, child] of entries) {
      flattenObject(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
  }

  out[prefix || "value"] = value;
  return out;
}

/**
 * Locate the array of records inside arbitrary JSON. Accepts a bare array, a
 * single object (one row), or a wrapper like `{ data: [...] }` — the shape most
 * APIs actually return.
 */
export function extractRecords(parsed: JsonValue): {
  records: JsonValue[];
  note?: string;
} {
  if (Array.isArray(parsed)) return { records: parsed };

  if (parsed !== null && typeof parsed === "object") {
    const entries = Object.entries(parsed);
    const arrayEntries = entries.filter(([, v]) => Array.isArray(v));

    if (arrayEntries.length === 1) {
      const [key, value] = arrayEntries[0];
      return {
        records: value as JsonValue[],
        note: `Used the array at "${key}" as the row source.`,
      };
    }

    return { records: [parsed], note: "Converted a single object to one row." };
  }

  return { records: [parsed] };
}

export function escapeCsvField(
  value: string,
  delimiter: string,
  quoteMode: QuoteMode,
): string {
  const needsQuotes =
    quoteMode === "all" ||
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value !== value.trim();

  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Spreadsheets execute a cell that starts with = + - or @. Prefixing with a
 * single quote keeps the text visible but inert (CSV injection defence).
 */
function sanitizeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export interface JsonToCsvResult {
  csv: string;
  headers: string[];
  rowCount: number;
  notes: string[];
}

export function jsonToCsv(
  records: JsonValue[],
  options: JsonToCsvOptions,
): JsonToCsvResult {
  const notes: string[] = [];

  const flatRows: Record<string, JsonValue>[] = records.map((record) => {
    if (record === null || typeof record !== "object") {
      return { value: record };
    }
    if (options.flatten && !options.stringifyNested) {
      return flattenObject(record);
    }
    // Keep top-level keys, serialise anything nested as JSON text.
    const row: Record<string, JsonValue> = {};
    for (const [key, value] of Object.entries(record)) {
      row[key] =
        value !== null && typeof value === "object"
          ? JSON.stringify(value)
          : value;
    }
    return row;
  });

  // Union of every key, in first-seen order, so sparse records still line up.
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const row of flatRows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }

  const eol = options.lineEnding === "crlf" ? "\r\n" : "\n";
  const lines: string[] = [];

  if (options.includeHeader && headers.length > 0) {
    lines.push(
      headers
        .map((h) => escapeCsvField(h, options.delimiter, options.quoteMode))
        .join(options.delimiter),
    );
  }

  for (const row of flatRows) {
    const cells = headers.map((header) => {
      const value = row[header];
      let text: string;

      if (value === null || value === undefined) {
        text = options.nullValue;
      } else if (typeof value === "object") {
        text = JSON.stringify(value);
      } else {
        text = String(value);
      }

      if (options.sanitizeFormulas) text = sanitizeCell(text);
      return escapeCsvField(text, options.delimiter, options.quoteMode);
    });
    lines.push(cells.join(options.delimiter));
  }

  if (records.some((r) => r === null || typeof r !== "object")) {
    notes.push(
      'Some entries were primitives rather than objects; they were placed in a "value" column.',
    );
  }

  return {
    csv: lines.join(eol),
    headers,
    rowCount: flatRows.length,
    notes,
  };
}

/* ------------------------------------------------------------------ *
 * Analysis & helpers
 * ------------------------------------------------------------------ */

export type ColumnType =
  | "string"
  | "number"
  | "boolean"
  | "empty"
  | "mixed"
  | "object";

export interface ColumnStat {
  name: string;
  type: ColumnType;
  filled: number;
  empty: number;
  unique: number;
  min?: number;
  max?: number;
  sample: string;
}

export function analyzeColumns(
  headers: string[],
  records: JsonObject[],
): ColumnStat[] {
  return headers.map((name) => {
    const values = records.map((r) => r[name]);
    const types = new Set<string>();
    const uniques = new Set<string>();
    let empty = 0;
    let min: number | undefined;
    let max: number | undefined;
    let sample = "";

    for (const value of values) {
      if (value === null || value === undefined || value === "") {
        empty++;
        continue;
      }

      uniques.add(
        typeof value === "object" ? JSON.stringify(value) : String(value),
      );
      if (!sample)
        sample =
          typeof value === "object" ? JSON.stringify(value) : String(value);

      if (typeof value === "number") {
        types.add("number");
        min = min === undefined ? value : Math.min(min, value);
        max = max === undefined ? value : Math.max(max, value);
      } else if (typeof value === "boolean") {
        types.add("boolean");
      } else if (typeof value === "object") {
        types.add("object");
      } else {
        types.add("string");
      }
    }

    let type: ColumnType;
    if (types.size === 0) type = "empty";
    else if (types.size === 1) type = [...types][0] as ColumnType;
    else type = "mixed";

    return {
      name,
      type,
      filled: values.length - empty,
      empty,
      unique: uniques.size,
      min,
      max,
      sample: sample.length > 40 ? `${sample.slice(0, 40)}…` : sample,
    };
  });
}

/**
 * Guess the delimiter by testing each candidate and preferring the one that
 * yields a consistent column count across lines — more reliable than simply
 * counting occurrences, which punctuation inside text easily fools.
 */
export function detectDelimiter(text: string): Delimiter {
  const candidates: Delimiter[] = [",", ";", "\t", "|"];
  const sample = text.split(/\r?\n/).slice(0, 20).join("\n");
  if (!sample.trim()) return ",";

  let best: Delimiter = ",";
  let bestScore = -1;

  for (const candidate of candidates) {
    const { rows } = tokenizeCsv(sample, candidate);
    const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
    if (nonEmpty.length === 0) continue;

    const width = nonEmpty[0].length;
    if (width < 2) continue;

    const consistent = nonEmpty.filter((r) => r.length === width).length;
    const score = width * (consistent / nonEmpty.length);

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

/** Cheap structural check so the UI can pick the right tab for a paste. */
export function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
}

/**
 * Turn a JSON.parse failure into a line/column the editor can point at.
 *
 * V8's message format has changed across Node/browser versions — some report
 * "at position N", newer ones "at line L column C", and some only quote the
 * offending token — so all three shapes are handled here.
 */
export function describeJsonError(error: unknown, text: string): ParseError {
  const raw = error instanceof Error ? error.message : String(error);

  const lineCol = raw.match(/line (\d+) column (\d+)/);
  if (lineCol) {
    return {
      message: cleanJsonMessage(raw),
      line: Number(lineCol[1]),
      column: Number(lineCol[2]),
    };
  }

  const position = raw.match(/position (\d+)/);
  if (position) {
    return {
      message: cleanJsonMessage(raw),
      ...locate(text, Number(position[1])),
    };
  }

  // Last resort: the message quotes the unexpected token, so find it in the
  // source. Only useful when it occurs once, but that is the common case.
  const token = raw.match(/Unexpected token '(.)'/);
  if (token) {
    const index = findLikelyOffset(text, token[1]);
    if (index >= 0)
      return { message: cleanJsonMessage(raw), ...locate(text, index) };
  }

  return { message: cleanJsonMessage(raw) };
}

function cleanJsonMessage(message: string): string {
  return message
    .replace(/,?\s*"[\s\S]*" is not valid JSON$/, "")
    .replace(/\s*in JSON at position \d+.*$/, "")
    .trim();
}

function locate(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index);
  return {
    line: before.split("\n").length,
    column: index - before.lastIndexOf("\n"),
  };
}

/**
 * Find the first structurally invalid occurrence of `char`, ignoring any inside
 * string literals so a comma in a value doesn't get blamed.
 */
function findLikelyOffset(text: string, char: string): number {
  let inString = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }

    if (c === char) {
      // A comma or colon is only wrong when the next meaningful character
      // cannot legally follow it.
      const next = text.slice(i + 1).match(/\S/);
      if (char === "," || char === ":") {
        if (next && /[,:}\]]/.test(next[0])) return i;
        continue;
      }
      return i;
    }
  }

  return -1;
}

export function toNdjson(records: JsonValue[]): string {
  return records.map((r) => JSON.stringify(r)).join("\n");
}

export function parseNdjson(text: string): JsonValue[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as JsonValue);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
