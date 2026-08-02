"use client";

import { toast } from "sonner";
import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Copy,
  Info,
  Trash2,
  Upload,
  Download,
  FileCode2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeftRight,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

import { SAMPLES } from "./data";
import { applyEdit, indentSelection, newlineWithIndent } from "./editor";
import {
  convert,
  validate,
  detectFormat,
  FORMAT_LABELS,
  FILE_EXTENSIONS,
  DEFAULT_OPTIONS,
  type DataFormat,
} from "./utils";

const FORMATS: DataFormat[] = ["json", "yaml", "toml"];

export default function DataFormatConverter() {
  const [input, setInput] = useState("");
  const [inputFormat, setInputFormat] = useState<DataFormat>("yaml");
  const [outputFormat, setOutputFormat] = useState<DataFormat>("json");
  const [indent, setIndent] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);
  // Set by Escape so the following Tab moves focus instead of indenting. Held
  // in a ref as well as state: consecutive keydowns fire before React re-renders,
  // so the handler must read the new value synchronously.
  const [tabExits, setTabExits] = useState(false);
  const tabExitsRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setTabExit = useCallback((next: boolean) => {
    tabExitsRef.current = next;
    setTabExits(next);
  }, []);

  const options = useMemo(
    () => ({ ...DEFAULT_OPTIONS, indent, sortKeys }),
    [indent, sortKeys],
  );

  const result = useMemo(
    () => convert(input, inputFormat, outputFormat, options),
    [input, inputFormat, outputFormat, options],
  );

  // Distinguishes "input is broken" from "input is fine but the target format
  // can't represent it", so the status badge doesn't blame the wrong side.
  const inputStatus = useMemo(
    () => validate(input, inputFormat),
    [input, inputFormat],
  );

  const output = result.ok ? result.output : "";
  const warnings = result.ok ? result.warnings : [];

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      // Only auto-detect on a paste-sized change, so typing never fights the
      // user's own format selection.
      if (value.length > 20 && value.length - input.length > 15) {
        const detected = detectFormat(value);
        if (detected && detected !== inputFormat) {
          setInputFormat(detected);
          if (detected === outputFormat) {
            setOutputFormat(
              FORMATS.find((f) => f !== detected) ?? outputFormat,
            );
          }
          toast.info(`Detected ${FORMAT_LABELS[detected]} input`);
        }
      }
    },
    [input.length, inputFormat, outputFormat],
  );

  /**
   * Give the input real editor behaviour: Tab indents instead of moving focus,
   * Shift+Tab outdents, and Enter keeps the current line's indentation.
   *
   * Trapping Tab would strand keyboard-only users, so Escape first "arms" an
   * exit — the next Tab then moves focus normally (the standard textarea
   * accessibility escape hatch).
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = event.currentTarget;

      if (event.key === "Escape") {
        setTabExit(true);
        return;
      }

      // Any other key re-arms indentation.
      if (event.key !== "Tab" && tabExitsRef.current) setTabExit(false);

      const state = {
        value: el.value,
        selectionStart: el.selectionStart,
        selectionEnd: el.selectionEnd,
      };

      if (event.key === "Tab") {
        if (tabExitsRef.current) {
          setTabExit(false);
          return; // Let the browser move focus.
        }
        event.preventDefault();
        applyEdit(el, indentSelection(state, indent, event.shiftKey));
        return;
      }

      // Let Shift+Enter and modifier combos fall through to default behaviour.
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        applyEdit(el, newlineWithIndent(state, indent));
      }
    },
    [indent, setTabExit],
  );

  const swapFormats = useCallback(() => {
    setInputFormat(outputFormat);
    setOutputFormat(inputFormat);
    // Carry the converted result across so the swap round-trips visibly.
    if (result.ok && result.output) setInput(result.output);
  }, [inputFormat, outputFormat, result]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  const downloadOutput = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${FILE_EXTENSIONS[outputFormat]}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File downloaded");
  }, [output, outputFormat]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        setInput(text);
        const detected = detectFormat(text);
        if (detected) {
          setInputFormat(detected);
          if (detected === outputFormat) {
            setOutputFormat(
              FORMATS.find((f) => f !== detected) ?? outputFormat,
            );
          }
        }
        toast.success(`Loaded ${file.name}`);
      };
      reader.onerror = () => toast.error("Failed to read file");
      reader.readAsText(file);
      event.target.value = "";
    },
    [outputFormat],
  );

  const loadSample = useCallback(() => {
    setInput(SAMPLES[inputFormat]);
    toast.success(`Loaded ${FORMAT_LABELS[inputFormat]} sample`);
  }, [inputFormat]);

  const clearAll = useCallback(() => {
    setInput("");
    toast.success("Cleared");
  }, []);

  return (
    <ToolsWrapper>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white">
          <FileCode2 className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          YAML ⇄ JSON ⇄ TOML Converter
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 sm:text-lg">
          Convert between YAML, JSON, and TOML with real parsers, precise error
          positions, and no data sent anywhere.
        </p>
      </div>

      {/* Format controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="input-format">Convert from</Label>
              <Select
                value={inputFormat}
                onValueChange={(v) => setInputFormat(v as DataFormat)}
              >
                <SelectTrigger id="input-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FORMAT_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={swapFormats}
              aria-label="Swap input and output formats"
              className="shrink-0 self-center md:mb-1 md:self-auto"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div className="flex-1 space-y-2">
              <Label htmlFor="output-format">Convert to</Label>
              <Select
                value={outputFormat}
                onValueChange={(v) => setOutputFormat(v as DataFormat)}
              >
                <SelectTrigger id="output-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FORMAT_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="indent" className="text-sm">
                Indent
              </Label>
              <Select
                value={String(indent)}
                onValueChange={(v) => setIndent(Number(v))}
              >
                <SelectTrigger id="indent" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="sort-keys"
                checked={sortKeys}
                onCheckedChange={setSortKeys}
              />
              <Label htmlFor="sort-keys" className="text-sm">
                Sort keys alphabetically
              </Label>
            </div>

            <div className="ml-auto flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml,.toml,.txt,application/json,text/yaml,text/plain"
                onChange={handleFileUpload}
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
                <span>Sample</span>
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editors */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">
                {FORMAT_LABELS[inputFormat]} input
              </CardTitle>
              {input.trim() &&
                (inputStatus.ok ? (
                  <Badge className="bg-green-600 hover:bg-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Invalid
                  </Badge>
                ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setTabExit(false)}
              placeholder={`Paste ${FORMAT_LABELS[inputFormat]} here, or upload a file…`}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="min-h-[420px] resize-y font-mono text-sm"
            />
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">
                {input.split("\n").length} lines · {input.length} chars
                <span className="hidden sm:inline">
                  {" "}
                  · Tab indents
                  {tabExits ? " (Tab now exits)" : ", Esc then Tab exits"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(input, "Input")}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                {FORMAT_LABELS[outputFormat]} output
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!output}
                  onClick={() =>
                    copyToClipboard(output, FORMAT_LABELS[outputFormat])
                  }
                >
                  <Copy className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!output}
                  onClick={downloadOutput}
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={output}
              readOnly
              placeholder="Converted output appears here as you type…"
              spellCheck={false}
              className="min-h-[420px] resize-y bg-muted/40 font-mono text-sm"
            />
            {output && (
              <div className="text-xs text-muted-foreground">
                {output.split("\n").length} lines · {output.length} chars
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Errors and warnings */}
      {!result.ok && input.trim() && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">{result.error}</div>
            {typeof result.line === "number" && (
              <div className="mt-1 text-sm">
                At line {result.line}
                {typeof result.column === "number"
                  ? `, column ${result.column}`
                  : ""}
              </div>
            )}
            {result.snippet && (
              <pre className="mt-2 overflow-x-auto rounded bg-black/10 p-2 text-xs dark:bg-black/30">
                {result.snippet}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}

      {warnings.map((warning) => (
        <Alert key={warning} className="mt-6">
          <Info className="h-4 w-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ))}

      {/* Reference */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Conversion notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 text-sm text-muted-foreground md:grid-cols-3">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">JSON</h3>
            <p>
              The strictest of the three: no comments, no trailing commas, and
              keys must be quoted strings. Comments in YAML or TOML input are
              dropped when converting to JSON.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">YAML</h3>
            <p>
              Supports anchors, aliases, and multiple documents in one file.
              Multi-document input is converted into an array, one entry per
              document.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">TOML</h3>
            <p>
              Requires a table at the top level, so a bare array or scalar
              cannot be converted. TOML has no null type — null values are
              reported and omitted rather than silently lost.
            </p>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
