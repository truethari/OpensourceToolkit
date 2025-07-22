"use client";

import CryptoJS from "crypto-js";
import React, { useState, useEffect, useCallback } from "react";
import {
  Hash,
  Copy,
  Check,
  Upload,
  FileText,
  RefreshCw,
  Download,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface HashResult {
  algorithm: string;
  hash: string;
  length: number;
}

interface HashAlgorithm {
  name: string;
  key: string;
  description: string;
  enabled: boolean;
}

export default function HashGenerator() {
  const [inputText, setInputText] = useState("");
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [hashResults, setHashResults] = useState<HashResult[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("text");

  const [algorithms, setAlgorithms] = useState<HashAlgorithm[]>([
    {
      name: "MD5",
      key: "md5",
      description: "128-bit hash (deprecated for security)",
      enabled: true,
    },
    {
      name: "SHA-1",
      key: "sha1",
      description: "160-bit hash (deprecated for security)",
      enabled: true,
    },
    {
      name: "SHA-256",
      key: "sha256",
      description: "256-bit secure hash (recommended)",
      enabled: true,
    },
    {
      name: "SHA-384",
      key: "sha384",
      description: "384-bit secure hash",
      enabled: true,
    },
    {
      name: "SHA-512",
      key: "sha512",
      description: "512-bit secure hash (most secure)",
      enabled: true,
    },
  ]);

  const generateHashes = useCallback(
    async (data: string | ArrayBuffer) => {
      setIsProcessing(true);
      const results: HashResult[] = [];

      try {
        const enabledAlgorithms = algorithms.filter((alg) => alg.enabled);

        for (const algorithm of enabledAlgorithms) {
          let hash = "";

          if (typeof data === "string") {
            // Text data
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data) as unknown as ArrayBuffer;
            hash = await computeHash(dataBuffer, algorithm.key);
          } else {
            // File data (ArrayBuffer)
            hash = await computeHash(data, algorithm.key);
          }

          results.push({
            algorithm: algorithm.name,
            hash,
            length: hash.length,
          });
        }

        setHashResults(results);
      } catch (error) {
        console.error("Error generating hashes:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [algorithms],
  );

  const computeHash = async (
    data: ArrayBuffer,
    algorithm: string,
  ): Promise<string> => {
    let hashAlgorithm = "";

    switch (algorithm) {
      case "md5":
        // Note: MD5 is not available in Web Crypto API
        // We'll use a lightweight MD5 implementation
        return await computeMD5(data);
      case "sha1":
        hashAlgorithm = "SHA-1";
        break;
      case "sha256":
        hashAlgorithm = "SHA-256";
        break;
      case "sha384":
        hashAlgorithm = "SHA-384";
        break;
      case "sha512":
        hashAlgorithm = "SHA-512";
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    const hashBuffer = await crypto.subtle.digest(hashAlgorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // MD5 implementation using crypto-js
  const computeMD5 = async (data: ArrayBuffer): Promise<string> => {
    // Convert ArrayBuffer to WordArray for crypto-js
    const uint8Array = new Uint8Array(data);
    const wordArray = CryptoJS.lib.WordArray.create(uint8Array);
    return CryptoJS.MD5(wordArray).toString();
  };

  useEffect(() => {
    if (activeTab === "text" && inputText.trim()) {
      generateHashes(inputText);
    }
  }, [inputText, algorithms, activeTab, generateHashes]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setInputFile(file);

    try {
      const arrayBuffer = await file.arrayBuffer();
      await generateHashes(arrayBuffer);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  };

  const copyToClipboard = async (hash: string, algorithm: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(`${algorithm}-${hash}`);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const downloadResults = () => {
    const results = {
      input: activeTab === "text" ? inputText : inputFile?.name || "file",
      timestamp: new Date().toISOString(),
      hashes: hashResults,
    };

    const jsonData = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hash-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleAlgorithm = (index: number) => {
    setAlgorithms((prev) =>
      prev.map((alg, i) =>
        i === index ? { ...alg, enabled: !alg.enabled } : alg,
      ),
    );
  };

  const clearAll = () => {
    setInputText("");
    setInputFile(null);
    setHashResults([]);
    setCopiedHash(null);
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Hash Generator</h1>
        <p className="text-muted-foreground">
          Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes for text and
          files
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Input Section */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Input Data
              </CardTitle>
              <CardDescription>
                Enter text or upload a file to generate hashes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Text Input
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    File Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-input">Text to Hash</Label>
                    <Textarea
                      id="text-input"
                      placeholder="Enter text to generate hashes..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {inputText.length} characters
                  </div>
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-input">Select File</Label>
                    <Input
                      id="file-input"
                      type="file"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                  {inputFile && (
                    <div className="rounded-lg bg-muted p-3">
                      <div className="text-sm">
                        <div className="font-medium">{inputFile.name}</div>
                        <div className="text-muted-foreground">
                          Size: {(inputFile.size / 1024).toFixed(2)} KB
                        </div>
                        <div className="text-muted-foreground">
                          Type: {inputFile.type || "Unknown"}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    if (activeTab === "text") {
                      generateHashes(inputText);
                    } else if (inputFile) {
                      inputFile.arrayBuffer().then(generateHashes);
                    }
                  }}
                  disabled={
                    isProcessing ||
                    (activeTab === "text" && !inputText.trim()) ||
                    (activeTab === "file" && !inputFile)
                  }
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Hash className="mr-2 h-4 w-4" />
                      Generate Hashes
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {hashResults.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Hash Results</CardTitle>
                  <CardDescription>
                    Generated hashes for your input data
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={downloadResults}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {hashResults.map((result, index) => (
                  <div
                    key={`${result.algorithm}-${index}`}
                    className="space-y-2 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{result.algorithm}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(result.hash, result.algorithm)
                        }
                      >
                        {copiedHash === `${result.algorithm}-${result.hash}` ? (
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
                    </div>
                    <div className="rounded bg-muted p-2">
                      <code className="break-all font-mono text-sm">
                        {result.hash}
                      </code>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Length: {result.length} characters
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hash Algorithms</CardTitle>
              <CardDescription>
                Select which algorithms to use for hash generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {algorithms.map((algorithm, index) => (
                <div key={algorithm.key} className="flex items-start space-x-3">
                  <Checkbox
                    id={algorithm.key}
                    checked={algorithm.enabled}
                    onCheckedChange={() => toggleAlgorithm(index)}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={algorithm.key}
                      className="cursor-pointer font-medium"
                    >
                      {algorithm.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {algorithm.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Notice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>MD5 and SHA-1</strong> are cryptographically broken
                  and should not be used for security purposes.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>SHA-256, SHA-384, and SHA-512</strong> are currently
                  considered secure for cryptographic applications.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Hash Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Supported Algorithms</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• MD5 - 128-bit hash (legacy)</li>
                <li>• SHA-1 - 160-bit hash (legacy)</li>
                <li>• SHA-256 - 256-bit secure hash</li>
                <li>• SHA-384 - 384-bit secure hash</li>
                <li>• SHA-512 - 512-bit secure hash</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Use Cases</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• File integrity verification</li>
                <li>• Password storage (with salt)</li>
                <li>• Digital signatures</li>
                <li>• Data deduplication</li>
                <li>• Checksum generation</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              All hash generation happens locally in your browser. No data is
              sent to external servers, ensuring complete privacy and security.
            </p>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
