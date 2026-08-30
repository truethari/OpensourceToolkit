"use client";

import { toast } from "sonner";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Maximize2,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

import DataTable from "./DataTable";
import ColumnStats from "./ColumnStats";
import ViewerDialog from "./ViewerDialog";
import { SAMPLE_CSV, SAMPLE_JSON } from "./data";
import {
  analyzeColumns,
  DEFAULT_CSV_OPTIONS,
  DEFAULT_JSON_OPTIONS,
  DELIMITER_LABELS,
  describeJsonError,
  detectDelimiter,
  extractRecords,
  formatBytes,
  jsonToCsv,
  looksLikeJson,
  parseCsv,
  parseNdjson,
  toNdjson,
  type Delimiter,
  type JsonObject,
  type JsonValue,
  type LineEnding,
  type QuoteMode,
  type UnflattenMode,
} from "./utils";

type Direction = "csv-to-json" | "json-to-csv";
type JsonShape = "array" | "pretty" | "ndjson" | "columns";

const DELIMITERS: Delimiter[] = [",", ";", "\t", "|"];
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export default function CsvJsonConverter() {
  const [direction, setDirection] = useState<Direction>("csv-to-json");
  const [csvInput, setCsvInput] = useState("");
  const [jsonInput, setJsonInput] = useState("");

  const [csvOptions, setCsvOptions] = useState(DEFAULT_CSV_OPTIONS);
  const [jsonOptions, setJsonOptions] = useState(DEFAULT_JSON_OPTIONS);
  const [jsonShape, setJsonShape] = useState<JsonShape>("pretty");
  const [indent, setIndent] = useState(2);
  const [viewerOpen, setViewerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCsvToJson = direction === "csv-to-json";

  /* ---------------- CSV -> JSON ---------------- */

  const csvResult = useMemo(
    () => parseCsv(csvInput, csvOptions),
    [csvInput, csvOptions],
  );

  const jsonOutput = useMemo(() => {
    if (!isCsvToJson || csvResult.records.length === 0) return "";

    switch (jsonShape) {
      case "array":
        return JSON.stringify(csvResult.records);
      case "ndjson":
        return toNdjson(csvResult.records as JsonValue[]);
      case "columns": {
        // Column-oriented: one array per field, the layout pandas and most
        // charting libraries want.
        const columns: Record<string, JsonValue[]> = {};
        for (const header of csvResult.headers) {
          columns[header] = csvResult.records.map((r) => r[header] ?? null);
        }
        return JSON.stringify(columns, null, indent);
      }
      default:
        return JSON.stringify(csvResult.records, null, indent);
    }
  }, [isCsvToJson, csvResult, jsonShape, indent]);

  /* ---------------- JSON -> CSV ---------------- */

  const jsonParsed = useMemo(() => {
    if (isCsvToJson || jsonInput.trim() === "") {
      return { records: [] as JsonValue[], error: null, notes: [] as string[] };
    }

    const notes: string[] = [];

    // Accept NDJSON as well: a leading "{" with no wrapping array is the
    // signature of log-style line-delimited JSON.
    const trimmed = jsonInput.trim();
    if (!looksLikeJson(trimmed) && trimmed.startsWith("{")) {
      try {
        const records = parseNdjson(trimmed);
        notes.push("Parsed input as NDJSON (one JSON object per line).");
        return { records, error: null, notes };
      } catch {
        // Fall through to the normal parser for a precise error position.
      }
    }

    try {
      const parsed = JSON.parse(trimmed) as JsonValue;
      const extracted = extractRecords(parsed);
      if (extracted.note) notes.push(extracted.note);
      return { records: extracted.records, error: null, notes };
    } catch (error) {
      return {
        records: [] as JsonValue[],
        error: describeJsonError(error, trimmed),
        notes,
      };
    }
  }, [isCsvToJson, jsonInput]);

  const csvOutput = useMemo(() => {
    if (isCsvToJson || jsonParsed.records.length === 0) {
      return { csv: "", headers: [], rowCount: 0, notes: [] };
    }
    return jsonToCsv(jsonParsed.records, jsonOptions);
  }, [isCsvToJson, jsonParsed.records, jsonOptions]);

  /* ---------------- Shared derived state ---------------- */

  const output = isCsvToJson ? jsonOutput : csvOutput.csv;
  const outputLanguage = isCsvToJson ? "json" : "csv";

  // Preview and stats always read from the CSV side of the pipeline, so
  // JSON -> CSV gets a table too (by re-parsing the generated CSV).
  const previewData = useMemo((): {
    headers: string[];
    records: JsonObject[];
  } => {
    if (isCsvToJson) {
      return { headers: csvResult.headers, records: csvResult.records };
    }
    if (!csvOutput.csv) return { headers: [], records: [] };
    const reparsed = parseCsv(csvOutput.csv, {
      ...DEFAULT_CSV_OPTIONS,
      delimiter: jsonOptions.delimiter,
      // The preview table mirrors the CSV columns as written, so dotted
      // headers must stay flat here even though CSV -> JSON would nest them.
      unflatten: "never",
    });
    return { headers: reparsed.headers, records: reparsed.records };
  }, [isCsvToJson, csvResult, csvOutput.csv, jsonOptions.delimiter]);

  const stats = useMemo(
    () => analyzeColumns(previewData.headers, previewData.records),
    [previewData],
  );

  const errors = isCsvToJson
    ? csvResult.errors
    : jsonParsed.error
      ? [jsonParsed.error]
      : [];

  const warnings = isCsvToJson
    ? csvResult.warnings
    : [...jsonParsed.notes, ...csvOutput.notes];

  const hasInput = (isCsvToJson ? csvInput : jsonInput).trim() !== "";
  const outputBytes = useMemo(() => new Blob([output]).size, [output]);

  /* ---------------- Actions ---------------- */

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    if (!text) {
      toast.error("Nothing to copy yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  const download = useCallback(
    (content: string, filename: string, mime: string) => {
      if (!content) {
        toast.error("Nothing to download yet");
        return;
      }
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    },
    [],
  );

  const downloadOutput = useCallback(() => {
    const stamp = Date.now();
    if (isCsvToJson) {
      const ext = jsonShape === "ndjson" ? "ndjson" : "json";
      download(output, `converted-${stamp}.${ext}`, "application/json");
    } else {
      download(output, `converted-${stamp}.csv`, "text/csv;charset=utf-8");
    }
  }, [download, isCsvToJson, jsonShape, output]);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error(
        `File is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_FILE_BYTES)}`,
      );
      return;
    }

    const text = await file.text();
    const name = file.name.toLowerCase();
    const isJsonFile =
      name.endsWith(".json") || name.endsWith(".ndjson") || looksLikeJson(text);

    if (isJsonFile) {
      setDirection("json-to-csv");
      setJsonInput(text);
    } else {
      setDirection("csv-to-json");
      setCsvInput(text);
      const detected = detectDelimiter(text);
      setCsvOptions((prev) => ({ ...prev, delimiter: detected }));
      if (detected !== ",") {
        toast.info(`Detected ${DELIMITER_LABELS[detected].trim()} delimiter`);
      }
    }

    toast.success(`Loaded ${file.name} (${formatBytes(file.size)})`);
  }, []);

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void handleFile(file);
      // Reset so re-picking the same file fires change again.
      event.target.value = "";
    },
    [handleFile],
  );

  /** Send the current output back to the input, flipped — chained conversions. */
  const swapDirection = useCallback(() => {
    if (output) {
      if (isCsvToJson) {
        setJsonInput(output);
      } else {
        setCsvInput(output);
        setCsvOptions((prev) => ({
          ...prev,
          delimiter: jsonOptions.delimiter,
        }));
      }
      toast.success("Output moved to input");
    }
    setDirection(isCsvToJson ? "json-to-csv" : "csv-to-json");
  }, [isCsvToJson, jsonOptions.delimiter, output]);

  const clearAll = useCallback(() => {
    setCsvInput("");
    setJsonInput("");
    toast.success("Cleared");
  }, []);

  const loadSample = useCallback(() => {
    if (isCsvToJson) {
      setCsvInput(SAMPLE_CSV);
      setCsvOptions((prev) => ({ ...prev, delimiter: "," }));
    } else {
      setJsonInput(SAMPLE_JSON);
    }
    toast.success("Sample data loaded");
  }, [isCsvToJson]);

  const inputValue = isCsvToJson ? csvInput : jsonInput;
  const setInputValue = isCsvToJson ? setCsvInput : setJsonInput;

  return (
    <ToolsWrapper>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <FileSpreadsheet className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          CSV ⇄ JSON Converter
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 sm:text-lg">
          Convert spreadsheets to JSON and back, with a full-screen viewer,
          sortable preview and column analysis — all in your browser
        </p>
      </div>

      {/* Direction switch */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant={isCsvToJson ? "default" : "outline"}
          onClick={() => setDirection("csv-to-json")}
        >
          CSV → JSON
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={swapDirection}
          title="Swap"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={!isCsvToJson ? "default" : "outline"}
          onClick={() => setDirection("json-to-csv")}
        >
          JSON → CSV
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* -------- Options sidebar -------- */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Delimiter</Label>
                <Select
                  value={
                    isCsvToJson ? csvOptions.delimiter : jsonOptions.delimiter
                  }
                  onValueChange={(value) => {
                    const delimiter = value as Delimiter;
                    if (isCsvToJson) {
                      setCsvOptions((p) => ({ ...p, delimiter }));
                    } else {
                      setJsonOptions((p) => ({ ...p, delimiter }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIMITERS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DELIMITER_LABELS[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isCsvToJson ? (
                <>
                  <div className="space-y-2">
                    <Label>JSON shape</Label>
                    <Select
                      value={jsonShape}
                      onValueChange={(v) => setJsonShape(v as JsonShape)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pretty">Pretty array</SelectItem>
                        <SelectItem value="array">Minified array</SelectItem>
                        <SelectItem value="ndjson">
                          NDJSON (one per line)
                        </SelectItem>
                        <SelectItem value="columns">Column arrays</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(jsonShape === "pretty" || jsonShape === "columns") && (
                    <div className="space-y-2">
                      <Label htmlFor="indent">Indent spaces</Label>
                      <Input
                        id="indent"
                        type="number"
                        min={0}
                        max={8}
                        value={indent}
                        onChange={(e) =>
                          setIndent(
                            Math.min(
                              8,
                              Math.max(0, Number(e.target.value) || 0),
                            ),
                          )
                        }
                      />
                    </div>
                  )}

                  <ToggleRow
                    id="has-header"
                    label="First row is a header"
                    checked={csvOptions.hasHeader}
                    onChange={(v) =>
                      setCsvOptions((p) => ({ ...p, hasHeader: v }))
                    }
                  />
                  <ToggleRow
                    id="infer-types"
                    label="Infer numbers & booleans"
                    checked={csvOptions.inferTypes}
                    onChange={(v) =>
                      setCsvOptions((p) => ({ ...p, inferTypes: v }))
                    }
                  />
                  <ToggleRow
                    id="trim"
                    label="Trim whitespace"
                    checked={csvOptions.trimFields}
                    onChange={(v) =>
                      setCsvOptions((p) => ({ ...p, trimFields: v }))
                    }
                  />
                  <ToggleRow
                    id="skip-empty"
                    label="Skip empty lines"
                    checked={csvOptions.skipEmptyLines}
                    onChange={(v) =>
                      setCsvOptions((p) => ({ ...p, skipEmptyLines: v }))
                    }
                  />
                  <div className="space-y-2">
                    <Label>Nested objects</Label>
                    <Select
                      value={csvOptions.unflatten}
                      onValueChange={(v) =>
                        setCsvOptions((p) => ({
                          ...p,
                          unflatten: v as UnflattenMode,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">
                          Auto — nest dotted headers
                        </SelectItem>
                        <SelectItem value="always">Always nest</SelectItem>
                        <SelectItem value="never">Keep keys flat</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {csvOptions.unflatten === "never"
                        ? "obj.name stays a single flat key."
                        : "obj.name → { obj: { name } }"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Line endings</Label>
                    <Select
                      value={jsonOptions.lineEnding}
                      onValueChange={(v) =>
                        setJsonOptions((p) => ({
                          ...p,
                          lineEnding: v as LineEnding,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lf">LF (Unix)</SelectItem>
                        <SelectItem value="crlf">
                          CRLF (Windows/Excel)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quoting</Label>
                    <Select
                      value={jsonOptions.quoteMode}
                      onValueChange={(v) =>
                        setJsonOptions((p) => ({
                          ...p,
                          quoteMode: v as QuoteMode,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">
                          Only when needed
                        </SelectItem>
                        <SelectItem value="all">Quote every field</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="null-value">Null placeholder</Label>
                    <Input
                      id="null-value"
                      value={jsonOptions.nullValue}
                      placeholder="(empty)"
                      onChange={(e) =>
                        setJsonOptions((p) => ({
                          ...p,
                          nullValue: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <ToggleRow
                    id="include-header"
                    label="Include header row"
                    checked={jsonOptions.includeHeader}
                    onChange={(v) =>
                      setJsonOptions((p) => ({ ...p, includeHeader: v }))
                    }
                  />
                  <ToggleRow
                    id="flatten"
                    label="Flatten nested objects"
                    hint="{ a: { b } } → column a.b"
                    checked={
                      jsonOptions.flatten && !jsonOptions.stringifyNested
                    }
                    disabled={jsonOptions.stringifyNested}
                    onChange={(v) =>
                      setJsonOptions((p) => ({ ...p, flatten: v }))
                    }
                  />
                  <ToggleRow
                    id="stringify"
                    label="Keep nested as JSON text"
                    checked={jsonOptions.stringifyNested}
                    onChange={(v) =>
                      setJsonOptions((p) => ({ ...p, stringifyNested: v }))
                    }
                  />
                  <ToggleRow
                    id="sanitize"
                    label="Escape spreadsheet formulas"
                    hint="Prevents =SUM() running in Excel"
                    checked={jsonOptions.sanitizeFormulas}
                    onChange={(v) =>
                      setJsonOptions((p) => ({ ...p, sanitizeFormulas: v }))
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          {previewData.records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <SummaryCell
                  label="Rows"
                  value={previewData.records.length.toLocaleString()}
                />
                <SummaryCell
                  label="Columns"
                  value={String(previewData.headers.length)}
                />
                <SummaryCell
                  label="Output size"
                  value={formatBytes(outputBytes)}
                />
                <SummaryCell
                  label="Cells"
                  value={(
                    previewData.records.length * previewData.headers.length
                  ).toLocaleString()}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* -------- Main panel -------- */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {isCsvToJson ? "CSV input" : "JSON input"}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.json,.ndjson,text/csv,application/json"
                  onChange={onFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Upload</span>
                </Button>
                <Button variant="outline" size="sm" onClick={loadSample}>
                  <Sparkles className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sample</span>
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) void handleFile(file);
              }}
            >
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isCsvToJson
                    ? "Paste CSV here, upload a file, or drop one onto this box..."
                    : "Paste JSON (array, object, or NDJSON) here, upload a file, or drop one..."
                }
                spellCheck={false}
                className="min-h-[180px] font-mono text-xs"
              />
            </CardContent>
          </Card>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>
                      {error.message}
                      {error.line !== undefined && (
                        <span className="opacity-80">
                          {" "}
                          (line {error.line}
                          {error.column !== undefined
                            ? `, column ${error.column}`
                            : ""}
                          )
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                Output
                {hasInput && errors.length === 0 && output && (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Valid
                  </Badge>
                )}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewerOpen(true)}
                  disabled={!output}
                >
                  <Maximize2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Full screen</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(output, isCsvToJson ? "JSON" : "CSV")
                  }
                >
                  <Copy className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button variant="outline" size="sm" onClick={downloadOutput}>
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="output">
                <TabsList>
                  <TabsTrigger value="output">
                    {isCsvToJson ? "JSON" : "CSV"}
                  </TabsTrigger>
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="stats">Columns</TabsTrigger>
                </TabsList>

                <TabsContent value="output" className="mt-4">
                  {output ? (
                    <div className="max-h-[28rem] overflow-auto rounded-md border bg-muted/30">
                      <pre className="whitespace-pre p-3 font-mono text-xs leading-5">
                        {output}
                      </pre>
                    </div>
                  ) : (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      {hasInput
                        ? "Nothing to output — check the errors above."
                        : "Output appears here as you type."}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="table" className="mt-4">
                  <DataTable
                    headers={previewData.headers}
                    records={previewData.records}
                  />
                </TabsContent>

                <TabsContent value="stats" className="mt-4">
                  <ColumnStats
                    stats={stats}
                    totalRows={previewData.records.length}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <ViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        title={isCsvToJson ? "JSON output" : "CSV output"}
        content={output}
        language={outputLanguage}
        onCopy={() => copyToClipboard(output, isCsvToJson ? "JSON" : "CSV")}
        onDownload={downloadOutput}
      />
    </ToolsWrapper>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-mono text-sm font-medium">{value}</p>
    </div>
  );
}
