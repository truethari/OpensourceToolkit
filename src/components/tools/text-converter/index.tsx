"use client";

import React, { useState } from "react";
import { Copy, RefreshCw, Check, Type, FileText, Zap } from "lucide-react";

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

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

export default function TextCaseConverter() {
  const [inputText, setInputText] = useState("");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [customSeparator, setCustomSeparator] = useState("-");
  const [batchTexts, setBatchTexts] = useState("");
  const [selectedCaseType, setSelectedCaseType] = useState("uppercase");
  const [batchResults, setBatchResults] = useState<
    Array<{
      id: number;
      input: string;
      output: string;
      caseType: string;
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

  const toUpperCase = (text: string) => text.toUpperCase();

  const toLowerCase = (text: string) => text.toLowerCase();

  const toSentenceCase = (text: string) => {
    return text
      .toLowerCase()
      .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  };

  const toTitleCase = (text: string) => {
    return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const toCamelCase = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
      .replace(/^./, (c) => c.toLowerCase());
  };

  const toPascalCase = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
      .replace(/^./, (c) => c.toUpperCase());
  };

  const toSnakeCase = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const toKebabCase = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const toConstantCase = (text: string) => {
    return text
      .toUpperCase()
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const toDotCase = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");
  };

  const toAlternatingCase = (text: string) => {
    return text
      .toLowerCase()
      .split("")
      .map((char, index) =>
        index % 2 === 0 ? char.toLowerCase() : char.toUpperCase(),
      )
      .join("");
  };

  const toInverseCase = (text: string) => {
    return text
      .split("")
      .map((char) =>
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase(),
      )
      .join("");
  };

  const toRandomCase = (text: string) => {
    return text
      .split("")
      .map((char) =>
        Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase(),
      )
      .join("");
  };

  const toCustomSeparator = (text: string, separator: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, separator)
      .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, "g"), "");
  };

  const removeExtraSpaces = (text: string) => {
    return text.replace(/\s+/g, " ").trim();
  };

  const reverseText = (text: string) => {
    return text.split("").reverse().join("");
  };

  const getConversions = (text: string) => {
    if (!text) return {};

    return {
      uppercase: toUpperCase(text),
      lowercase: toLowerCase(text),
      sentenceCase: toSentenceCase(text),
      titleCase: toTitleCase(text),
      camelCase: toCamelCase(text),
      pascalCase: toPascalCase(text),
      snakeCase: toSnakeCase(text),
      kebabCase: toKebabCase(text),
      constantCase: toConstantCase(text),
      dotCase: toDotCase(text),
      alternatingCase: toAlternatingCase(text),
      inverseCase: toInverseCase(text),
      randomCase: toRandomCase(text),
      customSeparator: toCustomSeparator(text, customSeparator),
      removeSpaces: removeExtraSpaces(text),
      reverse: reverseText(text),
    };
  };

  const processBatchTexts = () => {
    if (!batchTexts.trim()) return;

    const lines = batchTexts.split("\n").filter((line) => line.trim());
    const converter = getConversionFunction(selectedCaseType);

    const results = lines.map((line, index) => ({
      id: index,
      input: line.trim(),
      output: converter(line.trim()),
      caseType: selectedCaseType,
    }));

    setBatchResults(results);
  };

  const getConversionFunction = (caseType: string) => {
    switch (caseType) {
      case "uppercase":
        return toUpperCase;
      case "lowercase":
        return toLowerCase;
      case "sentenceCase":
        return toSentenceCase;
      case "titleCase":
        return toTitleCase;
      case "camelCase":
        return toCamelCase;
      case "pascalCase":
        return toPascalCase;
      case "snakeCase":
        return toSnakeCase;
      case "kebabCase":
        return toKebabCase;
      case "constantCase":
        return toConstantCase;
      case "dotCase":
        return toDotCase;
      case "alternatingCase":
        return toAlternatingCase;
      case "inverseCase":
        return toInverseCase;
      case "randomCase":
        return toRandomCase;
      case "removeSpaces":
        return removeExtraSpaces;
      case "reverse":
        return reverseText;
      default:
        return (text: string) => text;
    }
  };

  const conversions = getConversions(inputText);

  const ConversionRow = ({
    label,
    value,
    description,
    copyKey,
  }: {
    label: string;
    value: string;
    description: string;
    copyKey: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="min-w-[140px] text-sm font-medium">{label}</Label>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="flex items-center gap-2">
        <Input value={value} readOnly className="font-mono" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(value, copyKey)}
        >
          {copiedItem === copyKey ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  const getTextStats = (text: string) => {
    if (!text) return { characters: 0, words: 0, sentences: 0, paragraphs: 0 };

    return {
      characters: text.length,
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      sentences: text.trim()
        ? text.split(/[.!?]+/).filter((s) => s.trim()).length
        : 0,
      paragraphs: text.trim()
        ? text.split(/\n\s*\n/).filter((p) => p.trim()).length
        : 0,
    };
  };

  const stats = getTextStats(inputText);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Text Case Converter & Formatter</h1>
        <p className="text-muted-foreground">
          Convert text between different cases and formats with advanced text
          processing tools
        </p>
      </div>

      <Tabs defaultValue="converter" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="converter">Text Converter</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
          <TabsTrigger value="batch" className="hidden md:block">
            Batch Convert
          </TabsTrigger>
          <TabsTrigger value="stats" className="hidden md:block">
            Text Analysis
          </TabsTrigger>
        </TabsList>

        <TabsList className="mt-2 grid w-full grid-cols-2 md:hidden">
          <TabsTrigger value="batch">Batch Convert</TabsTrigger>
          <TabsTrigger value="stats">Text Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="converter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Text Case Converter
              </CardTitle>
              <CardDescription>
                Enter your text and get it converted to various case formats
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

              {inputText && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Basic Conversions</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <ConversionRow
                      label="UPPERCASE"
                      value={conversions.uppercase || ""}
                      description="All letters capitalized"
                      copyKey="uppercase"
                    />
                    <ConversionRow
                      label="lowercase"
                      value={conversions.lowercase || ""}
                      description="All letters in lowercase"
                      copyKey="lowercase"
                    />
                    <ConversionRow
                      label="Sentence case"
                      value={conversions.sentenceCase || ""}
                      description="First letter of each sentence capitalized"
                      copyKey="sentenceCase"
                    />
                    <ConversionRow
                      label="Title Case"
                      value={conversions.titleCase || ""}
                      description="First letter of each word capitalized"
                      copyKey="titleCase"
                    />
                  </div>

                  <h3 className="pt-4 text-lg font-semibold">
                    Programming Cases
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <ConversionRow
                      label="camelCase"
                      value={conversions.camelCase || ""}
                      description="First word lowercase, subsequent words capitalized"
                      copyKey="camelCase"
                    />
                    <ConversionRow
                      label="PascalCase"
                      value={conversions.pascalCase || ""}
                      description="All words capitalized, no spaces"
                      copyKey="pascalCase"
                    />
                    <ConversionRow
                      label="snake_case"
                      value={conversions.snakeCase || ""}
                      description="All lowercase with underscores"
                      copyKey="snakeCase"
                    />
                    <ConversionRow
                      label="kebab-case"
                      value={conversions.kebabCase || ""}
                      description="All lowercase with hyphens"
                      copyKey="kebabCase"
                    />
                    <ConversionRow
                      label="CONSTANT_CASE"
                      value={conversions.constantCase || ""}
                      description="All uppercase with underscores"
                      copyKey="constantCase"
                    />
                    <ConversionRow
                      label="dot.case"
                      value={conversions.dotCase || ""}
                      description="All lowercase with dots"
                      copyKey="dotCase"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Advanced Text Transformations
              </CardTitle>
              <CardDescription>
                Special case conversions and text manipulations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="advanced-input">Input Text</Label>
                <Textarea
                  id="advanced-input"
                  placeholder="Enter your text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-separator">Custom Separator</Label>
                <Input
                  id="custom-separator"
                  placeholder="Enter separator (e.g., -, _, |)"
                  value={customSeparator}
                  onChange={(e) => setCustomSeparator(e.target.value)}
                  className="w-32"
                />
              </div>

              {inputText && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Fun Transformations</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <ConversionRow
                      label="aLtErNaTiNg CaSe"
                      value={conversions.alternatingCase || ""}
                      description="Alternating upper and lowercase letters"
                      copyKey="alternatingCase"
                    />
                    <ConversionRow
                      label="iNVERSE cASE"
                      value={conversions.inverseCase || ""}
                      description="Swaps the case of each letter"
                      copyKey="inverseCase"
                    />
                    <ConversionRow
                      label="RaNdOm CaSe"
                      value={conversions.randomCase || ""}
                      description="Random upper and lowercase letters"
                      copyKey="randomCase"
                    />
                    <ConversionRow
                      label="esreveR"
                      value={conversions.reverse || ""}
                      description="Text reversed character by character"
                      copyKey="reverse"
                    />
                  </div>

                  <h3 className="pt-4 text-lg font-semibold">Text Utilities</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <ConversionRow
                      label="Custom Separator"
                      value={conversions.customSeparator || ""}
                      description={`Words separated by "${customSeparator}"`}
                      copyKey="customSeparator"
                    />
                    <ConversionRow
                      label="Remove Extra Spaces"
                      value={conversions.removeSpaces || ""}
                      description="Removes duplicate spaces and trims"
                      copyKey="removeSpaces"
                    />
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
                <RefreshCw className="h-5 w-5" />
                Batch Text Conversion
              </CardTitle>
              <CardDescription>
                Convert multiple lines of text at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-case-type">Conversion Type</Label>
                <Select
                  value={selectedCaseType}
                  onValueChange={setSelectedCaseType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uppercase">UPPERCASE</SelectItem>
                    <SelectItem value="lowercase">lowercase</SelectItem>
                    <SelectItem value="sentenceCase">Sentence case</SelectItem>
                    <SelectItem value="titleCase">Title Case</SelectItem>
                    <SelectItem value="camelCase">camelCase</SelectItem>
                    <SelectItem value="pascalCase">PascalCase</SelectItem>
                    <SelectItem value="snakeCase">snake_case</SelectItem>
                    <SelectItem value="kebabCase">kebab-case</SelectItem>
                    <SelectItem value="constantCase">CONSTANT_CASE</SelectItem>
                    <SelectItem value="dotCase">dot.case</SelectItem>
                    <SelectItem value="alternatingCase">
                      aLtErNaTiNg CaSe
                    </SelectItem>
                    <SelectItem value="inverseCase">iNVERSE cASE</SelectItem>
                    <SelectItem value="randomCase">RaNdOm CaSe</SelectItem>
                    <SelectItem value="removeSpaces">
                      Remove Extra Spaces
                    </SelectItem>
                    <SelectItem value="reverse">Reverse Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-input">Text Lines (one per line)</Label>
                <Textarea
                  id="batch-input"
                  placeholder="Hello World&#10;This is a test&#10;Another line here"
                  value={batchTexts}
                  onChange={(e) => setBatchTexts(e.target.value)}
                  rows={6}
                  className="font-mono"
                />
              </div>

              <Button onClick={processBatchTexts} className="w-full">
                Convert Batch
              </Button>

              {batchResults.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Batch Results</h3>
                  <div className="space-y-3">
                    {batchResults.map((result) => (
                      <div key={result.id} className="rounded-lg bg-muted p-4">
                        <div className="mb-2 text-sm font-medium">
                          Input:{" "}
                          <span className="font-mono">{result.input}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <span className="text-sm">Output: </span>
                            <span className="font-mono">{result.output}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                result.output,
                                `batch-${result.id}`,
                              )
                            }
                          >
                            {copiedItem === `batch-${result.id}` ? (
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

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Text Analysis & Statistics
              </CardTitle>
              <CardDescription>
                Analyze your text and get detailed statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stats-input">Input Text</Label>
                <Textarea
                  id="stats-input"
                  placeholder="Enter your text here to analyze..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={8}
                  className="font-mono"
                />
              </div>

              {inputText && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Text Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">
                        {stats.characters}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Characters
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">{stats.words}</div>
                      <div className="text-sm text-muted-foreground">Words</div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">
                        {stats.sentences}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sentences
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="text-2xl font-bold">
                        {stats.paragraphs}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Paragraphs
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Reading Time</h4>
                      <div className="text-sm text-muted-foreground">
                        Average: ~{Math.ceil(stats.words / 200)} minutes
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Speaking Time</h4>
                      <div className="text-sm text-muted-foreground">
                        Average: ~{Math.ceil(stats.words / 130)} minutes
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Text Case Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Common Cases</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>camelCase:</strong> firstName, lastName, fullName
                </div>
                <div>
                  <strong>PascalCase:</strong> FirstName, LastName, FullName
                </div>
                <div>
                  <strong>snake_case:</strong> first_name, last_name, full_name
                </div>
                <div>
                  <strong>kebab-case:</strong> first-name, last-name, full-name
                </div>
                <div>
                  <strong>CONSTANT_CASE:</strong> FIRST_NAME, LAST_NAME
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Use Cases</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>JavaScript:</strong> camelCase for variables
                </div>
                <div>
                  <strong>Python:</strong> snake_case for variables
                </div>
                <div>
                  <strong>CSS:</strong> kebab-case for classes
                </div>
                <div>
                  <strong>Constants:</strong> CONSTANT_CASE
                </div>
                <div>
                  <strong>URLs:</strong> kebab-case for slugs
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
