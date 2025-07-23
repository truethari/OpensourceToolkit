"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Copy,
  Check,
  BookOpen,
  RefreshCw,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface Match {
  match: string;
  index: number;
  groups: string[];
}

interface RegexPattern {
  name: string;
  pattern: string;
  description: string;
  example: string;
}

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [replaceString, setReplaceString] = useState("");
  const [flags, setFlags] = useState({
    global: false,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false,
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");
  const [copiedMatch, setCopiedMatch] = useState<number | null>(null);
  const [replaceResult, setReplaceResult] = useState("");

  const commonPatterns: RegexPattern[] = [
    {
      name: "Email",
      pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      description: "Matches email addresses",
      example: "user@example.com",
    },
    {
      name: "URL",
      pattern:
        "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
      description: "Matches HTTP/HTTPS URLs",
      example: "https://www.example.com",
    },
    {
      name: "Phone (US)",
      pattern: "\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})",
      description: "Matches US phone numbers",
      example: "(123) 456-7890",
    },
    {
      name: "IPv4 Address",
      pattern: "\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b",
      description: "Matches IPv4 addresses",
      example: "192.168.1.1",
    },
    {
      name: "Date (MM/DD/YYYY)",
      pattern:
        "\\b(0?[1-9]|1[0-2])\\/(0?[1-9]|[12][0-9]|3[01])\\/(19|20)\\d{2}\\b",
      description: "Matches MM/DD/YYYY date format",
      example: "12/31/2023",
    },
    {
      name: "Hex Color",
      pattern: "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})",
      description: "Matches hex color codes",
      example: "#FF5733",
    },
    {
      name: "HTML Tag",
      pattern: "<\\/?[a-zA-Z][^>]*>",
      description: "Matches HTML tags",
      example: '<div class="example">',
    },
    {
      name: "Credit Card",
      pattern: "\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b",
      description: "Matches credit card numbers",
      example: "1234 5678 9012 3456",
    },
  ];

  const flagsString = useMemo(() => {
    let flagStr = "";
    if (flags.global) flagStr += "g";
    if (flags.ignoreCase) flagStr += "i";
    if (flags.multiline) flagStr += "m";
    if (flags.dotAll) flagStr += "s";
    if (flags.unicode) flagStr += "u";
    if (flags.sticky) flagStr += "y";
    return flagStr;
  }, [flags]);

  const executeRegex = useCallback(() => {
    if (!pattern.trim()) {
      setError("Please enter a regular expression pattern");
      setMatches([]);
      setReplaceResult("");
      return;
    }

    if (!testString.trim()) {
      setError("Please enter test string");
      setMatches([]);
      setReplaceResult("");
      return;
    }

    try {
      setError("");
      const regex = new RegExp(pattern, flagsString);
      const foundMatches: Match[] = [];

      if (flags.global) {
        let match;
        while ((match = regex.exec(testString)) !== null) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          // Prevent infinite loop
          if (!flags.global || match.index === regex.lastIndex) break;
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          foundMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(foundMatches);

      // Generate replace result
      if (replaceString) {
        const replaceRegex = new RegExp(pattern, flagsString);
        const result = testString.replace(replaceRegex, replaceString);
        setReplaceResult(result);
      } else {
        setReplaceResult("");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid regular expression",
      );
      setMatches([]);
      setReplaceResult("");
    }
  }, [pattern, testString, replaceString, flagsString, flags.global]);

  const highlightMatches = useMemo(() => {
    if (!testString || matches.length === 0) return testString;

    let highlighted = testString;
    const sortedMatches = [...matches].sort((a, b) => b.index - a.index);

    sortedMatches.forEach((match) => {
      const matchClass = `bg-yellow-200 dark:bg-yellow-800 px-1 rounded`;
      const replacement = `<mark class="${matchClass}">${match.match}</mark>`;
      highlighted =
        highlighted.slice(0, match.index) +
        replacement +
        highlighted.slice(match.index + match.match.length);
    });

    return highlighted;
  }, [testString, matches]);

  const explainPattern = useCallback((pattern: string): string => {
    if (!pattern) return "";

    const explanations: { [key: string]: string } = {
      "\\d": "Matches any digit (0-9)",
      "\\w": "Matches any word character (a-z, A-Z, 0-9, _)",
      "\\s": "Matches any whitespace character",
      "\\D": "Matches any non-digit character",
      "\\W": "Matches any non-word character",
      "\\S": "Matches any non-whitespace character",
      ".": "Matches any character (except newline)",
      "^": "Matches start of string/line",
      $: "Matches end of string/line",
      "*": "Matches 0 or more of the preceding element",
      "+": "Matches 1 or more of the preceding element",
      "?": "Matches 0 or 1 of the preceding element",
      "|": "Alternation (OR operator)",
      "[]": "Character class - matches any character inside brackets",
      "()": "Capturing group",
      "{}": "Quantifier - specifies exact number of matches",
    };

    let explanation = "Pattern breakdown:\n";
    for (const [regex, desc] of Object.entries(explanations)) {
      if (pattern.includes(regex)) {
        explanation += `• ${regex} - ${desc}\n`;
      }
    }

    return explanation || "Enter a pattern to see explanations.";
  }, []);

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMatch(index ?? -1);
      setTimeout(() => setCopiedMatch(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const loadPattern = (selectedPattern: RegexPattern) => {
    setPattern(selectedPattern.pattern);
    setTestString(selectedPattern.example);
  };

  const generateTestString = () => {
    const samples = [
      "Contact us at support@example.com or call (555) 123-4567",
      "Visit https://www.example.com for more info",
      "Server IP: 192.168.1.100, Date: 12/31/2023",
      "Color codes: #FF5733, #33FF57, #3357FF",
      "<div class='container'><p>Hello World</p></div>",
      "Card: 1234 5678 9012 3456, Expires: 12/25",
    ];

    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    setTestString(randomSample);
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Regular Expression Tester & Builder
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Test, build, and debug regular expressions with real-time matching and
          explanations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pattern Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Regular Expression
            </CardTitle>
            <CardDescription>
              Enter your regex pattern and configure flags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pattern">Pattern</Label>
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern... e.g., \\d{3}-\\d{2}-\\d{4}"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Flags</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="global"
                    checked={flags.global}
                    onCheckedChange={(checked) =>
                      setFlags((prev) => ({ ...prev, global: !!checked }))
                    }
                  />
                  <Label htmlFor="global" className="text-sm">
                    Global (g)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ignoreCase"
                    checked={flags.ignoreCase}
                    onCheckedChange={(checked) =>
                      setFlags((prev) => ({ ...prev, ignoreCase: !!checked }))
                    }
                  />
                  <Label htmlFor="ignoreCase" className="text-sm">
                    Ignore Case (i)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multiline"
                    checked={flags.multiline}
                    onCheckedChange={(checked) =>
                      setFlags((prev) => ({ ...prev, multiline: !!checked }))
                    }
                  />
                  <Label htmlFor="multiline" className="text-sm">
                    Multiline (m)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dotAll"
                    checked={flags.dotAll}
                    onCheckedChange={(checked) =>
                      setFlags((prev) => ({ ...prev, dotAll: !!checked }))
                    }
                  />
                  <Label htmlFor="dotAll" className="text-sm">
                    Dot All (s)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unicode"
                    checked={flags.unicode}
                    onCheckedChange={(checked) =>
                      setFlags((prev) => ({ ...prev, unicode: !!checked }))
                    }
                  />
                  <Label htmlFor="unicode" className="text-sm">
                    Unicode (u)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sticky"
                    checked={flags.sticky}
                    onCheckedChange={(checked) =>
                      setFlags((prev) => ({ ...prev, sticky: !!checked }))
                    }
                  />
                  <Label htmlFor="sticky" className="text-sm">
                    Sticky (y)
                  </Label>
                </div>
              </div>
            </div>

            {pattern && (
              <div className="space-y-2">
                <Label>Final Regex</Label>
                <div className="rounded bg-muted p-2 font-mono text-sm">
                  /{pattern}/{flagsString}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Common Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Common Patterns
            </CardTitle>
            <CardDescription>
              Click to load a common regex pattern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {commonPatterns.map((patternObj, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => loadPattern(patternObj)}
                  className="h-auto flex-col items-start p-3 text-left"
                >
                  <span className="font-medium">{patternObj.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {patternObj.description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test String */}
      <Card>
        <CardHeader>
          <CardTitle>Test String</CardTitle>
          <CardDescription>
            Enter text to test your regular expression against
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={executeRegex} className="w-full sm:flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Regex
            </Button>
            <Button
              variant="outline"
              onClick={generateTestString}
              className="w-full sm:w-auto"
            >
              Generate Sample
            </Button>
          </div>

          <Textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter your test string here..."
            className="min-h-[120px] resize-none font-mono text-sm"
          />

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-4">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="explanation">Pattern Explanation</TabsTrigger>
          <TabsTrigger value="replace">Replace</TabsTrigger>
          <TabsTrigger value="highlighted">Highlighted Text</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matches Found ({matches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {matches.length > 0 ? (
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-muted p-3"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Match {index + 1}</Badge>
                          <span className="font-mono text-sm">
                            {match.match}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Position: {match.index}-
                          {match.index + match.match.length}
                          {match.groups.length > 0 && (
                            <span className="ml-2">
                              Groups: {match.groups.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(match.match, index)}
                      >
                        {copiedMatch === index ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No matches found. Try adjusting your pattern or test string.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explanation">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                {explainPattern(pattern)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find & Replace</CardTitle>
              <CardDescription>
                Replace matched patterns with new text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="replace">Replace with</Label>
                <Input
                  id="replace"
                  value={replaceString}
                  onChange={(e) => setReplaceString(e.target.value)}
                  placeholder="Replacement text (use $1, $2 for groups)"
                />
              </div>

              {replaceResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Result</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(replaceResult)}
                    >
                      {copiedMatch === -1 ? (
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
                  <Textarea
                    value={replaceResult}
                    readOnly
                    className="min-h-[120px] resize-none font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="highlighted">
          <Card>
            <CardHeader>
              <CardTitle>Highlighted Matches</CardTitle>
              <CardDescription>
                Visual representation of matches in your text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="min-h-[120px] rounded border bg-muted/50 p-3 font-mono text-sm"
                dangerouslySetInnerHTML={{ __html: highlightMatches }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Regex Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">Character Classes</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">\\d</code> - Digits
                  (0-9)
                </li>
                <li>
                  <code className="rounded bg-muted px-1">\\w</code> - Word
                  characters
                </li>
                <li>
                  <code className="rounded bg-muted px-1">\\s</code> -
                  Whitespace
                </li>
                <li>
                  <code className="rounded bg-muted px-1">.</code> - Any
                  character
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Quantifiers</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">*</code> - 0 or more
                </li>
                <li>
                  <code className="rounded bg-muted px-1">+</code> - 1 or more
                </li>
                <li>
                  <code className="rounded bg-muted px-1">?</code> - 0 or 1
                </li>
                <li>
                  <code className="rounded bg-muted px-1">{`{n,m}`}</code> -
                  Between n and m
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Anchors</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <code className="rounded bg-muted px-1">^</code> - Start of
                  string
                </li>
                <li>
                  <code className="rounded bg-muted px-1">$</code> - End of
                  string
                </li>
                <li>
                  <code className="rounded bg-muted px-1">\\b</code> - Word
                  boundary
                </li>
                <li>
                  <code className="rounded bg-muted px-1">|</code> - OR operator
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
