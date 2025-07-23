"use client";

import React, { useState, useCallback } from "react";
import { Copy, Download, RefreshCw, Check, AlertCircle } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

export default function JSONFormatter() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [inputFormat, setInputFormat] = useState("json");
  const [outputFormat, setOutputFormat] = useState("json");
  const [operation, setOperation] = useState("format");
  const [error, setError] = useState("");
  const [copiedOutput, setCopiedOutput] = useState(false);

  // Format functions
  const formatJSON = useCallback(
    (text: string, minify: boolean = false): string => {
      const parsed = JSON.parse(text);
      return minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
    },
    [],
  );

  const formatXML = useCallback(
    (text: string, minify: boolean = false): string => {
      // Simple XML formatter
      if (minify) {
        return text.replace(/>\s+</g, "><").trim();
      }

      let formatted = "";
      let indent = 0;
      const tab = "  ";

      text.split(/>\s*</).forEach((node, index) => {
        if (index > 0) {
          if (node.match(/^\/\w/)) indent--;
          formatted += "\n" + tab.repeat(indent) + "<" + node + ">";
          if (node.match(/^[\w]/)) indent++;
        } else {
          formatted += index === 0 ? node + ">" : "<" + node + ">";
        }
      });

      return formatted;
    },
    [],
  );

  const jsonToYaml = useCallback((obj: unknown, indent: number = 0): string => {
    const spaces = "  ".repeat(indent);

    if (Array.isArray(obj)) {
      return obj
        .map((item) => `${spaces}- ${jsonToYaml(item, indent + 1).trim()}`)
        .join("\n");
    } else if (typeof obj === "object" && obj !== null) {
      return Object.entries(obj as Record<string, unknown>)
        .map(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            return `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
          }
          return `${spaces}${key}: ${value}`;
        })
        .join("\n");
    }

    return String(obj);
  }, []);

  const formatYAML = useCallback(
    (text: string): string => {
      // Simple YAML formatting - in a real app, you'd use a proper YAML library
      try {
        const parsed = JSON.parse(text);
        return jsonToYaml(parsed);
      } catch {
        return text; // Return as-is if not valid JSON to convert
      }
    },
    [jsonToYaml],
  );

  const yamlToJson = useCallback((yaml: string): Record<string, unknown> => {
    // Very basic YAML to JSON converter - in production, use a proper library
    const lines = yaml.split("\n").filter((line) => line.trim());
    const result: Record<string, unknown> = {};

    lines.forEach((line) => {
      const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
      if (match) {
        const [, , key, value] = match;
        if (value && !value.startsWith("\n")) {
          result[key.trim()] = isNaN(Number(value)) ? value : Number(value);
        }
      }
    });

    return result;
  }, []);

  const jsonToXml = useCallback(
    (obj: unknown, rootName: string = "root"): string => {
      const xmlify = (data: unknown, key?: string): string => {
        if (Array.isArray(data)) {
          return data.map((item) => xmlify(item, key)).join("");
        } else if (typeof data === "object" && data !== null) {
          const entries = Object.entries(data as Record<string, unknown>);
          return entries.map(([k, v]) => `<${k}>${xmlify(v)}</${k}>`).join("");
        } else {
          return String(data);
        }
      };

      return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>${xmlify(obj)}</${rootName}>`;
    },
    [],
  );

  // Conversion functions
  const convertFormat = useCallback(
    (text: string, from: string, to: string): string => {
      try {
        let parsed: unknown;

        // Parse input format
        switch (from) {
          case "json":
            parsed = JSON.parse(text);
            break;
          case "yaml":
            parsed = yamlToJson(text);
            break;
          case "xml":
            // Basic XML parsing - in production, use DOMParser or xml2js
            throw new Error("XML parsing not fully implemented in this demo");
          default:
            parsed = JSON.parse(text);
        }

        // Convert to output format
        switch (to) {
          case "json":
            return JSON.stringify(parsed, null, 2);
          case "yaml":
            return jsonToYaml(parsed);
          case "xml":
            return jsonToXml(parsed);
          default:
            return JSON.stringify(parsed, null, 2);
        }
      } catch (err) {
        throw new Error(
          `Conversion failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    },
    [yamlToJson, jsonToYaml, jsonToXml],
  );

  const handleProcess = useCallback(() => {
    if (!inputText.trim()) {
      setError("Please enter some data to process");
      setOutputText("");
      return;
    }

    try {
      setError("");
      let result = "";

      if (operation === "convert" && inputFormat !== outputFormat) {
        result = convertFormat(inputText, inputFormat, outputFormat);
      } else {
        // Format operation
        switch (inputFormat) {
          case "json":
            result = formatJSON(inputText, operation === "minify");
            break;
          case "xml":
            result = formatXML(inputText, operation === "minify");
            break;
          case "yaml":
            result = formatYAML(inputText);
            break;
          default:
            result = formatJSON(inputText, operation === "minify");
        }
      }

      setOutputText(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid format or syntax error",
      );
      setOutputText("");
    }
  }, [
    inputText,
    inputFormat,
    outputFormat,
    operation,
    convertFormat,
    formatJSON,
    formatXML,
    formatYAML,
  ]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const downloadResult = () => {
    if (!outputText) return;

    const fileExtensions: { [key: string]: string } = {
      json: "json",
      xml: "xml",
      yaml: "yml",
    };

    const extension = fileExtensions[outputFormat] || "txt";
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formatted.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setInputText("");
    setOutputText("");
    setError("");
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">
          JSON/XML/YAML Formatter & Validator
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Format, validate, and convert between JSON, XML, and YAML formats
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Choose your input format and desired operation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={operation} onValueChange={setOperation}>
            <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="format" className="text-xs sm:text-sm">
                Format & Beautify
              </TabsTrigger>
              <TabsTrigger value="minify" className="text-xs sm:text-sm">
                Minify
              </TabsTrigger>
              <TabsTrigger value="convert" className="text-xs sm:text-sm">
                Convert Format
              </TabsTrigger>
            </TabsList>

            <TabsContent value="convert" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Convert From</Label>
                  <Select value={inputFormat} onValueChange={setInputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="yaml">YAML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Convert To</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="yaml">YAML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="format" className="space-y-4">
              <div className="space-y-2">
                <Label>Input Format</Label>
                <Select value={inputFormat} onValueChange={setInputFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="minify" className="space-y-4">
              <div className="space-y-2">
                <Label>Input Format</Label>
                <Select value={inputFormat} onValueChange={setInputFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleProcess} className="w-full sm:flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              {operation === "convert"
                ? "Convert"
                : operation === "minify"
                  ? "Minify"
                  : "Format"}
            </Button>
            <Button
              variant="outline"
              onClick={clearAll}
              className="w-full sm:w-auto"
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>
              Paste your {inputFormat.toUpperCase()} data here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enter your ${inputFormat.toUpperCase()} data...`}
              className="min-h-[250px] resize-none font-mono text-xs sm:min-h-[300px] sm:text-sm"
            />
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Output</CardTitle>
              <CardDescription>
                {operation === "convert"
                  ? `Converted to ${outputFormat.toUpperCase()}`
                  : operation === "minify"
                    ? "Minified result"
                    : "Formatted result"}
              </CardDescription>
            </div>
            {outputText && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(outputText)}
                  className="w-full sm:w-auto"
                >
                  {copiedOutput ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadResult}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Textarea
              value={outputText}
              readOnly
              placeholder="Processed data will appear here..."
              className="min-h-[250px] resize-none font-mono text-xs sm:min-h-[300px] sm:text-sm"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Format Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">JSON</h4>
              <p className="text-sm text-muted-foreground">
                JavaScript Object Notation. Lightweight data-interchange format
                that&apos;s easy for humans to read and write.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">XML</h4>
              <p className="text-sm text-muted-foreground">
                Extensible Markup Language. Self-describing format that&apos;s
                both human-readable and machine-readable.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">YAML</h4>
              <p className="text-sm text-muted-foreground">
                YAML Ain&apos;t Markup Language. Human-readable data
                serialization standard often used for configuration files.
              </p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Format:</strong> Prettifies and validates your data with
                proper indentation.
              </p>
              <p>
                <strong> Minify:</strong> Removes unnecessary whitespace to
                reduce file size.
              </p>
              <p>
                <strong> Convert:</strong> Transforms data between different
                formats while preserving structure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
