"use client";

import { ethers } from "ethers";
import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Key,
  Eye,
  Play,
  Copy,
  Lock,
  Hash,
  Info,
  Check,
  Clock,
  Pause,
  Target,
  Square,
  EyeOff,
  Wallet,
  Shield,
  Download,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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

interface GeneratedAddress {
  address: string;
  privateKey: string;
  matchedPattern: string;
  attempts: number;
  timestamp: Date;
  difficulty: number;
}

interface GenerationStats {
  totalAttempts: number;
  addressesGenerated: number;
  startTime: Date | null;
  averageSpeed: number;
  bestMatch: GeneratedAddress | null;
}

interface PatternConfig {
  prefix: string;
  suffix: string;
  contains: string;
  caseSensitive: boolean;
  minLength: number;
  maxLength: number;
}

export default function EVMVanityGenerator() {
  const [pattern, setPattern] = useState<PatternConfig>({
    prefix: "",
    suffix: "",
    contains: "",
    caseSensitive: false,
    minLength: 4,
    maxLength: 10,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [generatedAddresses, setGeneratedAddresses] = useState<
    GeneratedAddress[]
  >([]);
  const [stats, setStats] = useState<GenerationStats>({
    totalAttempts: 0,
    addressesGenerated: 0,
    startTime: null,
    averageSpeed: 0,
    bestMatch: null,
  });
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [maxResults, setMaxResults] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [autoStop, setAutoStop] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState<string>("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const difficultySettings = useMemo(
    () => ({
      easy: { minLength: 3, maxLength: 4, speed: 1000 },
      medium: { minLength: 4, maxLength: 6, speed: 500 },
      hard: { minLength: 6, maxLength: 8, speed: 100 },
      extreme: { minLength: 8, maxLength: 10, speed: 50 },
    }),
    [],
  );

  const calculateDifficulty = useCallback(
    (address: string, pattern: PatternConfig): number => {
      let score = 0;

      if (pattern.prefix) {
        const prefixMatch = pattern.caseSensitive
          ? address
              .toLowerCase()
              .startsWith(`0x${pattern.prefix.toLowerCase()}`)
          : address
              .toLowerCase()
              .startsWith(`0x${pattern.prefix.toLowerCase()}`);
        if (prefixMatch) score += pattern.prefix.length * 4;
      }

      if (pattern.suffix) {
        const suffixMatch = pattern.caseSensitive
          ? address.endsWith(pattern.suffix)
          : address.toLowerCase().endsWith(pattern.suffix.toLowerCase());
        if (suffixMatch) score += pattern.suffix.length * 4;
      }

      if (pattern.contains) {
        const containsMatch = pattern.caseSensitive
          ? address.includes(pattern.contains)
          : address.toLowerCase().includes(pattern.contains.toLowerCase());
        if (containsMatch) score += pattern.contains.length * 2;
      }

      return score;
    },
    [],
  );

  const matchesPattern = useCallback(
    (address: string, pattern: PatternConfig): boolean => {
      const addr = pattern.caseSensitive ? address : address.toLowerCase();
      const cleanAddr = addr.substring(2); // Remove 0x prefix

      if (pattern.prefix) {
        const prefix = pattern.caseSensitive
          ? pattern.prefix
          : pattern.prefix.toLowerCase();
        if (!cleanAddr.startsWith(prefix)) return false;
      }

      if (pattern.suffix) {
        const suffix = pattern.caseSensitive
          ? pattern.suffix
          : pattern.suffix.toLowerCase();
        if (!cleanAddr.endsWith(suffix)) return false;
      }

      if (pattern.contains) {
        const contains = pattern.caseSensitive
          ? pattern.contains
          : pattern.contains.toLowerCase();
        if (!cleanAddr.includes(contains)) return false;
      }

      return true;
    },
    [],
  );

  const generateAddress = useCallback((): GeneratedAddress | null => {
    try {
      const wallet = ethers.Wallet.createRandom();
      const address = wallet.address;

      if (matchesPattern(address, pattern)) {
        const difficulty = calculateDifficulty(address, pattern);
        return {
          address,
          privateKey: wallet.privateKey,
          matchedPattern: `${pattern.prefix}${pattern.contains}${pattern.suffix}`,
          attempts: stats.totalAttempts + 1,
          timestamp: new Date(),
          difficulty,
        };
      }
      return null;
    } catch (error) {
      console.error("Error generating address:", error);
      return null;
    }
  }, [pattern, matchesPattern, calculateDifficulty, stats.totalAttempts]);

  const estimateTimeToFind = useCallback(() => {
    let probability = 1;

    if (pattern.prefix) probability *= Math.pow(16, -pattern.prefix.length);
    if (pattern.suffix) probability *= Math.pow(16, -pattern.suffix.length);
    if (pattern.contains) probability *= Math.pow(16, -pattern.contains.length);

    const avgAttemptsNeeded = 1 / probability;
    const speedPerSecond =
      difficultySettings[difficulty as keyof typeof difficultySettings].speed;
    const estimatedSeconds = avgAttemptsNeeded / speedPerSecond;

    if (estimatedSeconds < 60) {
      return `~${Math.round(estimatedSeconds)} seconds`;
    } else if (estimatedSeconds < 3600) {
      return `~${Math.round(estimatedSeconds / 60)} minutes`;
    } else if (estimatedSeconds < 86400) {
      return `~${Math.round(estimatedSeconds / 3600)} hours`;
    } else {
      return `~${Math.round(estimatedSeconds / 86400)} days`;
    }
  }, [pattern, difficulty, difficultySettings]);

  const startGeneration = useCallback(() => {
    if (!pattern.prefix && !pattern.suffix && !pattern.contains) {
      alert(
        "Please specify at least one pattern (prefix, suffix, or contains)",
      );
      return;
    }

    setIsGenerating(true);
    setIsPaused(false);
    startTimeRef.current = new Date();
    setStats((prev) => ({ ...prev, startTime: startTimeRef.current! }));

    intervalRef.current = setInterval(
      () => {
        const newAddress = generateAddress();

        setStats((prev) => ({
          ...prev,
          totalAttempts: prev.totalAttempts + 1,
          averageSpeed: startTimeRef.current
            ? prev.totalAttempts /
              ((Date.now() - startTimeRef.current.getTime()) / 1000)
            : 0,
        }));

        if (newAddress) {
          setGeneratedAddresses((prev) => {
            const updated = [newAddress, ...prev].slice(0, maxResults);
            return updated;
          });

          setStats((prev) => ({
            ...prev,
            addressesGenerated: prev.addressesGenerated + 1,
            bestMatch:
              !prev.bestMatch ||
              newAddress.difficulty > prev.bestMatch.difficulty
                ? newAddress
                : prev.bestMatch,
          }));

          if (autoStop) {
            setIsGenerating(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }
      },
      Math.floor(
        1000 /
          difficultySettings[difficulty as keyof typeof difficultySettings]
            .speed,
      ),
    );

    setEstimatedTime(estimateTimeToFind());
  }, [
    pattern,
    generateAddress,
    maxResults,
    autoStop,
    difficulty,
    difficultySettings,
    estimateTimeToFind,
  ]);

  const pauseGeneration = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resumeGeneration = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      startGeneration();
    }
  }, [isPaused, startGeneration]);

  const stopGeneration = useCallback(() => {
    setIsGenerating(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetGeneration = useCallback(() => {
    stopGeneration();
    setGeneratedAddresses([]);
    setStats({
      totalAttempts: 0,
      addressesGenerated: 0,
      startTime: null,
      averageSpeed: 0,
      bestMatch: null,
    });
    startTimeRef.current = null;
  }, [stopGeneration]);

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const exportResults = useCallback(() => {
    const data = {
      generationTime: new Date().toISOString(),
      pattern,
      stats,
      addresses: generatedAddresses.map((addr) => ({
        ...addr,
        privateKey: showPrivateKeys ? addr.privateKey : "***HIDDEN***",
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evm-vanity-addresses-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedAddresses, pattern, stats, showPrivateKeys]);

  const validatePattern = useCallback(
    (patternConfig: PatternConfig): string[] => {
      const errors: string[] = [];
      const hexRegex = /^[0-9a-fA-F]*$/;

      if (patternConfig.prefix && !hexRegex.test(patternConfig.prefix)) {
        errors.push(
          "Prefix must contain only hexadecimal characters (0-9, a-f, A-F)",
        );
      }

      if (patternConfig.suffix && !hexRegex.test(patternConfig.suffix)) {
        errors.push(
          "Suffix must contain only hexadecimal characters (0-9, a-f, A-F)",
        );
      }

      if (patternConfig.contains && !hexRegex.test(patternConfig.contains)) {
        errors.push(
          "Contains pattern must contain only hexadecimal characters (0-9, a-f, A-F)",
        );
      }

      const totalLength =
        (patternConfig.prefix?.length || 0) +
        (patternConfig.suffix?.length || 0) +
        (patternConfig.contains?.length || 0);

      if (totalLength > 20) {
        errors.push("Combined pattern length cannot exceed 20 characters");
      }

      return errors;
    },
    [],
  );

  const patternErrors = validatePattern(pattern);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatElapsedTime = (startTime: Date) => {
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">EVM Vanity Address Generator</h1>
        <p className="text-muted-foreground">
          Generate custom Ethereum addresses with specific patterns - all
          processing happens locally in your browser
        </p>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator" className="text-xs sm:text-sm">
            Generator
          </TabsTrigger>
          <TabsTrigger value="results" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">
              Results ({generatedAddresses.length})
            </span>
            <span className="sm:hidden">Results</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Pattern Configuration
                </CardTitle>
                <CardDescription>
                  Define the pattern for your vanity address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Prefix (after 0x)</Label>
                    <Input
                      id="prefix"
                      placeholder="e.g., dead, cafe, 1234"
                      value={pattern.prefix}
                      onChange={(e) =>
                        setPattern((prev) => ({
                          ...prev,
                          prefix: e.target.value,
                        }))
                      }
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="suffix">Suffix</Label>
                    <Input
                      id="suffix"
                      placeholder="e.g., beef, face, 5678"
                      value={pattern.suffix}
                      onChange={(e) =>
                        setPattern((prev) => ({
                          ...prev,
                          suffix: e.target.value,
                        }))
                      }
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contains">Contains</Label>
                  <Input
                    id="contains"
                    placeholder="e.g., 1337, abcd, 9999"
                    value={pattern.contains}
                    onChange={(e) =>
                      setPattern((prev) => ({
                        ...prev,
                        contains: e.target.value,
                      }))
                    }
                    disabled={isGenerating}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="case-sensitive">Case Sensitive</Label>
                  <Switch
                    id="case-sensitive"
                    checked={pattern.caseSensitive}
                    onCheckedChange={(checked) =>
                      setPattern((prev) => ({
                        ...prev,
                        caseSensitive: checked,
                      }))
                    }
                    disabled={isGenerating}
                    className="shrink-0"
                  />
                </div>

                {patternErrors.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-inside list-disc space-y-1">
                        {patternErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Example Address Preview</Label>
                  <div className="rounded bg-muted p-2 font-mono text-sm">
                    0x{pattern.prefix}
                    <span className="text-muted-foreground">xxxx</span>
                    {pattern.contains}
                    <span className="text-muted-foreground">xxxx</span>
                    {pattern.suffix}
                  </div>
                </div>

                {estimatedTime && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Estimated time to find: <strong>{estimatedTime}</strong>
                      <br />
                      <span className="text-xs text-muted-foreground">
                        This is an approximation based on probability and may
                        vary significantly
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Generation Statistics
                </CardTitle>
                <CardDescription>
                  Real-time generation progress and metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Total Attempts
                    </Label>
                    <p className="text-2xl font-bold">
                      {stats.totalAttempts.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Addresses Found
                    </Label>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.addressesGenerated}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Speed
                    </Label>
                    <p className="text-lg font-semibold">
                      {Math.round(stats.averageSpeed)} /sec
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">
                      Runtime
                    </Label>
                    <p className="text-lg font-semibold">
                      {stats.startTime
                        ? formatElapsedTime(stats.startTime)
                        : "00:00:00"}
                    </p>
                  </div>
                </div>

                {stats.bestMatch && (
                  <div className="border-t pt-4">
                    <Label className="text-sm text-muted-foreground">
                      Best Match
                    </Label>
                    <div className="mt-2 space-y-2">
                      <p className="break-all rounded bg-muted p-2 font-mono text-sm">
                        {stats.bestMatch.address}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Difficulty: {stats.bestMatch.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          Attempt #{stats.bestMatch.attempts}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  {!isGenerating && !isPaused && (
                    <Button
                      onClick={startGeneration}
                      disabled={patternErrors.length > 0}
                      className="flex-1"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Generation
                    </Button>
                  )}

                  {isGenerating && !isPaused && (
                    <Button
                      onClick={pauseGeneration}
                      variant="outline"
                      className="flex-1"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}

                  {isPaused && (
                    <Button onClick={resumeGeneration} className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      Resume
                    </Button>
                  )}

                  <Button
                    onClick={stopGeneration}
                    variant="destructive"
                    disabled={!isGenerating && !isPaused}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>

                  <Button onClick={resetGeneration} variant="outline">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Generated Addresses
                  </CardTitle>
                  <CardDescription>
                    {generatedAddresses.length} addresses found matching your
                    pattern
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                  >
                    {showPrivateKeys ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide Keys
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Show Keys
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={exportResults}
                    disabled={generatedAddresses.length === 0}
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {generatedAddresses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Hash className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No addresses generated yet.</p>
                  <p className="text-sm">
                    Start the generator to find vanity addresses!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedAddresses.map((addr, index) => (
                    <div
                      key={`${addr.address}-${index}`}
                      className="rounded-lg border p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">#{addr.attempts}</Badge>
                        <Badge variant="outline">
                          Difficulty: {addr.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {addr.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Address</Label>
                          <div className="mt-1 flex items-center gap-2">
                            <code className="flex-1 break-all rounded bg-muted p-2 font-mono text-sm">
                              {addr.address}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(addr.address, `addr-${index}`)
                              }
                              className="shrink-0"
                            >
                              {copiedItem === `addr-${index}` ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {showPrivateKeys && (
                          <div>
                            <Label className="flex items-center gap-1 text-sm font-medium text-red-600">
                              <Key className="h-3 w-3" />
                              Private Key
                            </Label>
                            <div className="mt-1 flex items-center gap-2">
                              <code className="flex-1 break-all rounded border-red-600 bg-red-500 p-2 font-mono text-sm">
                                {addr.privateKey}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  copyToClipboard(
                                    addr.privateKey,
                                    `key-${index}`,
                                  )
                                }
                                className="shrink-0"
                              >
                                {copiedItem === `key-${index}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        <div>
                          <Label className="text-sm font-medium">
                            Matched Pattern
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {addr.matchedPattern || "Custom pattern"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Generation Settings
              </CardTitle>
              <CardDescription>
                Configure generation parameters and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">
                        Easy (Fast, 3-4 chars)
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium (Balanced, 4-6 chars)
                      </SelectItem>
                      <SelectItem value="hard">
                        Hard (Slow, 6-8 chars)
                      </SelectItem>
                      <SelectItem value="extreme">
                        Extreme (Very slow, 8-10 chars)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-results">Max Results</Label>
                  <Select
                    value={maxResults.toString()}
                    onValueChange={(value) => setMaxResults(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 addresses</SelectItem>
                      <SelectItem value="10">10 addresses</SelectItem>
                      <SelectItem value="25">25 addresses</SelectItem>
                      <SelectItem value="50">50 addresses</SelectItem>
                      <SelectItem value="100">100 addresses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-stop">Auto-stop after first match</Label>
                  <p className="text-sm text-muted-foreground">
                    Stop generation when the first matching address is found
                  </p>
                </div>
                <Switch
                  id="auto-stop"
                  checked={autoStop}
                  onCheckedChange={setAutoStop}
                  className="shrink-0"
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> All address generation
                  happens locally in your browser. Private keys are never sent
                  to any server. Always verify generated addresses before use
                  and keep your private keys secure.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Performance Warning:</strong> Generating vanity
                  addresses with long patterns can be computationally intensive
                  and may slow down your browser. Consider using shorter
                  patterns or lower difficulty settings for better performance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pattern Examples</CardTitle>
              <CardDescription>
                Common vanity address patterns and their difficulty
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-semibold">Easy Patterns</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <code>0x000...</code> - Prefix with zeros
                    </div>
                    <div>
                      <code>0x111...</code> - Prefix with ones
                    </div>
                    <div>
                      <code>0xabc...</code> - Simple hex prefix
                    </div>
                    <div>
                      <code>...000</code> - Suffix with zeros
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Hard Patterns</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <code>0xdead...</code> - Readable words
                    </div>
                    <div>
                      <code>0xcafe...</code> - Common hex words
                    </div>
                    <div>
                      <code>...beef</code> - Word suffixes
                    </div>
                    <div>
                      <code>0x1234...5678</code> - Prefix + suffix
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Privacy & Security Notice */}
      <Card className="border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-300">
            Your private keys and addresses are 100% secure - all generation
            happens locally in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">
                    100% Client-Side Generation
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    All address and private key generation happens entirely in
                    your browser using the ethers.js library. No data is ever
                    sent to any server.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">
                    Cryptographically Secure
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Uses the same secure random number generation as
                    professional wallets. Each address is generated from a
                    unique 256-bit entropy source.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">
                    No Data Collection
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    We don&apos;t collect, store, or track any generated
                    addresses or private keys. Your data remains completely
                    private on your device.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">
                    Private Key Protection
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Private keys are hidden by default and only shown when
                    explicitly requested. Always keep your private keys secure
                    and never share them.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">
                    Standard Browser Security
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Uses secure browser APIs and follows cryptocurrency industry
                    standards. Your browser&apos;s security features protect the
                    generation process.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-blue-700 dark:text-blue-300">
                    Open Source Transparency
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Built with ethers.js, a well-audited open-source library
                    used by major DeFi protocols. You can verify the security
                    yourself.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              <strong>How it works:</strong> This tool generates random private
              keys using your browser&apos;s crypto.getRandomValues() function,
              derives the corresponding Ethereum address, and checks if it
              matches your pattern. The process is identical to how hardware
              wallets generate addresses, ensuring maximum security.
            </p>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
