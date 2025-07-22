"use client";

import React, { useState, useCallback } from "react";
import {
  Copy,
  Upload,
  Download,
  Check,
  Binary,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

export default function Base64Tool() {
  const [inputText, setInputText] = useState("");
  const [encodedText, setEncodedText] = useState("");
  const [decodedText, setDecodedText] = useState("");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [encoding, setEncoding] = useState("utf-8");
  const [urlSafe, setUrlSafe] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileResult, setFileResult] = useState("");
  const [batchInput, setBatchInput] = useState("");
  const [batchResults, setBatchResults] = useState<
    Array<{
      input: string;
      output: string;
      type: "encode" | "decode";
    }>
  >([]);

  const copyToClipboard = async (text: string, item: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const encodeBase64 = useCallback(
    (text: string): string => {
      try {
        setError("");
        let encoded = btoa(unescape(encodeURIComponent(text)));

        if (urlSafe) {
          encoded = encoded
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");
        }

        return encoded;
      } catch {
        setError("Error encoding text. Please check your input.");
        return "";
      }
    },
    [urlSafe],
  );

  const decodeBase64 = useCallback(
    (text: string): string => {
      try {
        setError("");
        let cleanText = text.trim();

        if (urlSafe) {
          cleanText = cleanText.replace(/-/g, "+").replace(/_/g, "/");
          while (cleanText.length % 4) {
            cleanText += "=";
          }
        }

        return decodeURIComponent(escape(atob(cleanText)));
      } catch {
        setError("Invalid Base64 input. Please check your text.");
        return "";
      }
    },
    [urlSafe],
  );

  const handleEncode = () => {
    const result = encodeBase64(inputText);
    setEncodedText(result);
  };

  const handleDecode = () => {
    const result = decodeBase64(inputText);
    setDecodedText(result);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        const encoded = encodeBase64(result);
        setFileResult(encoded);
      } else if (result instanceof ArrayBuffer) {
        const binary = String.fromCharCode(...new Uint8Array(result));
        const encoded = btoa(binary);
        setFileResult(
          urlSafe
            ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
            : encoded,
        );
      }
    };

    if (file.type.startsWith("text/")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processBatch = (operation: "encode" | "decode") => {
    if (!batchInput.trim()) return;

    const lines = batchInput.split("\n").filter((line) => line.trim());
    const results = lines.map((line) => {
      const input = line.trim();
      let output = "";

      if (operation === "encode") {
        output = encodeBase64(input);
      } else {
        output = decodeBase64(input);
      }

      return { input, output, type: operation };
    });

    setBatchResults(results);
  };

  const clearAll = () => {
    setInputText("");
    setEncodedText("");
    setDecodedText("");
    setError("");
    setSelectedFile(null);
    setFileResult("");
    setBatchInput("");
    setBatchResults([]);
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Base64 Encoder/Decoder</h1>
        <p className="text-muted-foreground">
          Encode and decode text, files, and URLs to/from Base64 format with
          advanced options
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="text">Text Converter</TabsTrigger>
          <TabsTrigger value="file">File Converter</TabsTrigger>
          <TabsTrigger value="batch" className="hidden md:block">
            Batch Process
          </TabsTrigger>
          <TabsTrigger value="settings" className="hidden md:block">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsList className="mt-2 grid w-full grid-cols-2 md:hidden">
          <TabsTrigger value="batch">Batch Process</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Binary className="h-5 w-5" />
                Text Base64 Converter
              </CardTitle>
              <CardDescription>
                Encode and decode text to/from Base64 format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="input-text">Input Text</Label>
                <Textarea
                  id="input-text"
                  placeholder="Enter your text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  className="font-mono"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleEncode} disabled={!inputText}>
                  Encode to Base64
                </Button>
                <Button onClick={handleDecode} disabled={!inputText}>
                  Decode from Base64
                </Button>
                <Button variant="outline" onClick={clearAll}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>

              {encodedText && (
                <div className="space-y-2">
                  <Label>Encoded Result (Base64)</Label>
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={encodedText}
                      readOnly
                      rows={3}
                      className="font-mono"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(encodedText, "encoded")}
                      >
                        {copiedItem === "encoded" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          downloadAsFile(encodedText, "encoded.txt")
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {decodedText && (
                <div className="space-y-2">
                  <Label>Decoded Result</Label>
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={decodedText}
                      readOnly
                      rows={3}
                      className="font-mono"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(decodedText, "decoded")}
                      >
                        {copiedItem === "decoded" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          downloadAsFile(decodedText, "decoded.txt")
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Base64 Converter
              </CardTitle>
              <CardDescription>
                Upload files and convert them to Base64 format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file-input">Select File</Label>
                <Input
                  id="file-input"
                  type="file"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>

              {fileResult && (
                <div className="space-y-2">
                  <Label>File Base64 Result</Label>
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={fileResult}
                      readOnly
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(fileResult, "file")}
                      >
                        {copiedItem === "file" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          downloadAsFile(
                            fileResult,
                            `${selectedFile?.name || "file"}.base64`,
                          )
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Batch Base64 Processing
              </CardTitle>
              <CardDescription>
                Process multiple lines of text at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-input">Input Lines (one per line)</Label>
                <Textarea
                  id="batch-input"
                  placeholder="Enter multiple lines of text..."
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  rows={6}
                  className="font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => processBatch("encode")}
                  disabled={!batchInput.trim()}
                >
                  Encode All
                </Button>
                <Button
                  onClick={() => processBatch("decode")}
                  disabled={!batchInput.trim()}
                >
                  Decode All
                </Button>
              </div>

              {batchResults.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Batch Results</h3>
                  <div className="space-y-3">
                    {batchResults.map((result, index) => (
                      <div key={index} className="rounded-lg bg-muted p-4">
                        <div className="mb-2 text-sm font-medium">
                          Input:{" "}
                          <span className="font-mono">{result.input}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <span className="text-sm">
                              {result.type === "encode" ? "Encoded" : "Decoded"}
                              :{" "}
                            </span>
                            <span className="break-all font-mono">
                              {result.output}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(result.output, `batch-${index}`)
                            }
                          >
                            {copiedItem === `batch-${index}` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base64 Options</CardTitle>
              <CardDescription>
                Configure encoding and decoding settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="encoding-select">Character Encoding</Label>
                <Select value={encoding} onValueChange={setEncoding}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utf-8">UTF-8</SelectItem>
                    <SelectItem value="ascii">ASCII</SelectItem>
                    <SelectItem value="latin1">Latin-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="url-safe"
                  checked={urlSafe}
                  onChange={(e) => setUrlSafe(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="url-safe">Use URL-safe Base64</Label>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-semibold">Current Settings</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Character Encoding:{" "}
                    <span className="font-mono">{encoding}</span>
                  </div>
                  <div>
                    URL-safe:{" "}
                    <span className="font-mono">{urlSafe ? "Yes" : "No"}</span>
                  </div>
                  <div className="mt-2 text-muted-foreground">
                    {urlSafe
                      ? "URL-safe Base64 replaces + with -, / with _, and removes padding =."
                      : "Standard Base64 encoding with +, /, and = characters."}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Base64 Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">What is Base64?</h4>
              <div className="space-y-2 text-sm">
                <p>
                  Base64 is a binary-to-text encoding scheme that represents
                  binary data in an ASCII string format using 64 characters
                  (A-Z, a-z, 0-9, +, /).
                </p>
                <p>
                  It&apos;s commonly used for encoding data in email, data URLs,
                  and web APIs.
                </p>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Use Cases</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Data URLs:</strong> Embed images in CSS/HTML
                </div>
                <div>
                  <strong>API Authentication:</strong> Basic auth headers
                </div>
                <div>
                  <strong>Email Attachments:</strong> MIME encoding
                </div>
                <div>
                  <strong>JWT Tokens:</strong> Payload encoding
                </div>
                <div>
                  <strong>File Transfer:</strong> Binary data over text
                  protocols
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
