"use client";

import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, Check, Clock, Calendar, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function Timestamp() {
  interface ITimestampResult {
    id: number;
    input: string;
    date?: Date;
    iso?: string;
    utc?: string;
    local?: string;
    relative?: string;
    error?: string;
  }

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [inputTimestamp, setInputTimestamp] = useState("");
  const [timestampFormat, setTimestampFormat] = useState("seconds");
  const [batchTimestamps, setBatchTimestamps] = useState("");
  const [batchResults, setBatchResults] = useState<ITimestampResult[]>([]);

  // Initialize and update current time every second
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize with current date/time
  useEffect(() => {
    const now = new Date();
    setCustomDate(now.toISOString().split("T")[0]);
    setCustomTime(now.toTimeString().split(" ")[0].slice(0, 5));
  }, []);

  const copyToClipboard = async (text: string | undefined, item: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const parseTimestamp = (timestamp: string, format = "seconds") => {
    const num = parseInt(timestamp);
    if (isNaN(num)) return null;

    switch (format) {
      case "milliseconds":
        return new Date(num);
      case "seconds":
        return new Date(num * 1000);
      case "microseconds":
        return new Date(num / 1000);
      default:
        return new Date(num * 1000);
    }
  };

  const getCustomTimestamp = () => {
    if (!customDate || !customTime) return null;

    const dateTimeString = `${customDate}T${customTime}:00`;
    const date =
      timezone === "UTC"
        ? new Date(dateTimeString + "Z")
        : new Date(dateTimeString);

    return {
      date,
      seconds: Math.floor(date.getTime() / 1000),
      milliseconds: date.getTime(),
      microseconds: date.getTime() * 1000,
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      relative: getRelativeTime(date),
    };
  };

  const getSolvedTimestamp = () => {
    if (!inputTimestamp) return null;

    const date = parseTimestamp(inputTimestamp, timestampFormat);
    if (!date || isNaN(date.getTime())) return null;

    return {
      date,
      seconds: Math.floor(date.getTime() / 1000),
      milliseconds: date.getTime(),
      microseconds: date.getTime() * 1000,
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      relative: getRelativeTime(date),
    };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((Number(now) - Number(date)) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  const processBatchTimestamps = () => {
    if (!batchTimestamps.trim()) return;

    const lines = batchTimestamps.split("\n").filter((line) => line.trim());

    const results: ITimestampResult[] = lines.map((line, index) => {
      const timestamp = line.trim();
      const date = parseTimestamp(timestamp, timestampFormat);

      if (!date || isNaN(date.getTime())) {
        return {
          id: index,
          input: timestamp,
          error: "Invalid timestamp",
        };
      }

      return {
        id: index,
        input: timestamp,
        date,
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        relative: getRelativeTime(date),
      };
    });

    setBatchResults(results);
  };

  const currentTimestamp = currentTime
    ? {
        seconds: Math.floor(currentTime.getTime() / 1000),
        milliseconds: currentTime.getTime(),
        microseconds: currentTime.getTime() * 1000,
        iso: currentTime.toISOString(),
        utc: currentTime.toUTCString(),
        local: currentTime.toLocaleString(),
      }
    : null;

  const customTimestamp = getCustomTimestamp();
  const solvedTimestamp = getSolvedTimestamp();

  const TimestampDisplay = ({
    data,
    prefix = "",
  }: {
    data: {
      seconds: number;
      milliseconds: number;
      microseconds: number;
      iso: string;
      utc: string;
      local: string;
      relative?: string;
    };
    prefix?: string;
  }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Unix Timestamp (seconds)
          </Label>
          <div className="flex items-center gap-2">
            <Input value={data.seconds} readOnly className="font-mono" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(data.seconds.toString(), `${prefix}seconds`)
              }
            >
              {copiedItem === `${prefix}seconds` ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Unix Timestamp (milliseconds)
          </Label>
          <div className="flex items-center gap-2">
            <Input value={data.milliseconds} readOnly className="font-mono" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(
                  data.milliseconds.toString(),
                  `${prefix}milliseconds`,
                )
              }
            >
              {copiedItem === `${prefix}milliseconds` ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">ISO 8601</Label>
          <div className="flex items-center gap-2">
            <Input value={data.iso} readOnly className="font-mono" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(data.iso, `${prefix}iso`)}
            >
              {copiedItem === `${prefix}iso` ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">UTC String</Label>
          <div className="flex items-center gap-2">
            <Input value={data.utc} readOnly className="font-mono" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(data.utc, `${prefix}utc`)}
            >
              {copiedItem === `${prefix}utc` ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Local String</Label>
          <div className="flex items-center gap-2">
            <Input value={data.local} readOnly className="font-mono" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(data.local, `${prefix}local`)}
            >
              {copiedItem === `${prefix}local` ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {data.relative && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Relative Time</Label>
            <div className="flex items-center gap-2">
              <Input value={data.relative} readOnly className="font-mono" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(data.relative, `${prefix}relative`)
                }
              >
                {copiedItem === `${prefix}relative` ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Timestamp Converter & Generator</h1>
        <p className="text-muted-foreground">
          Convert, generate, and work with timestamps in various formats
        </p>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="current">Current Time</TabsTrigger>
          <TabsTrigger value="custom">Custom Date/Time</TabsTrigger>
          <TabsTrigger value="solve" className="hidden md:block">
            Solve Timestamp
          </TabsTrigger>
          <TabsTrigger value="batch" className="hidden md:block">
            Batch Convert
          </TabsTrigger>
        </TabsList>

        <TabsList className="mt-2 grid w-full grid-cols-2 md:hidden md:grid-cols-4">
          <TabsTrigger value="solve">Solve Timestamp</TabsTrigger>
          <TabsTrigger value="batch">Batch Convert</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Timestamp
              </CardTitle>
              <CardDescription>
                Live timestamp updating every second
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentTime && currentTimestamp ? (
                <>
                  <div className="mb-4 rounded-lg bg-muted p-4">
                    <div className="text-center font-mono text-2xl">
                      {currentTime.toLocaleString()}
                    </div>
                  </div>
                  <TimestampDisplay data={currentTimestamp} prefix="current-" />
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  Loading current time...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Custom Date/Time Timestamp
              </CardTitle>
              <CardDescription>
                Generate timestamp for a specific date and time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="custom-date">Date</Label>
                  <Input
                    id="custom-date"
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-time">Time</Label>
                  <Input
                    id="custom-time"
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {customTimestamp && (
                <div className="border-t pt-4">
                  <TimestampDisplay data={customTimestamp} prefix="custom-" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solve" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Solve Timestamp
              </CardTitle>
              <CardDescription>
                Convert timestamp to human-readable format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="input-timestamp">Timestamp</Label>
                  <Input
                    id="input-timestamp"
                    placeholder="Enter timestamp (e.g., 1672531200)"
                    value={inputTimestamp}
                    onChange={(e) => setInputTimestamp(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timestamp-format">Format</Label>
                  <Select
                    value={timestampFormat}
                    onValueChange={setTimestampFormat}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds (Unix)</SelectItem>
                      <SelectItem value="milliseconds">Milliseconds</SelectItem>
                      <SelectItem value="microseconds">Microseconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {timestampFormat === "seconds" &&
                    "Standard Unix timestamp in seconds since January 1, 1970 UTC"}
                  {timestampFormat === "milliseconds" &&
                    "JavaScript timestamp in milliseconds since January 1, 1970 UTC"}
                  {timestampFormat === "microseconds" &&
                    "Microsecond timestamp (1/1,000,000 of a second)"}
                </AlertDescription>
              </Alert>

              {solvedTimestamp && (
                <div className="border-t pt-4">
                  <TimestampDisplay data={solvedTimestamp} prefix="solved-" />
                </div>
              )}

              {inputTimestamp && !solvedTimestamp && (
                <Alert>
                  <AlertDescription>
                    Invalid timestamp format. Please check your input.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Batch Convert Timestamps
              </CardTitle>
              <CardDescription>
                Convert multiple timestamps at once (one per line)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-format">Timestamp Format</Label>
                <Select
                  value={timestampFormat}
                  onValueChange={setTimestampFormat}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds (Unix)</SelectItem>
                    <SelectItem value="milliseconds">Milliseconds</SelectItem>
                    <SelectItem value="microseconds">Microseconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-input">Timestamps (one per line)</Label>
                <Textarea
                  id="batch-input"
                  placeholder="1672531200&#10;1672617600&#10;1672704000"
                  value={batchTimestamps}
                  onChange={(e) => setBatchTimestamps(e.target.value)}
                  rows={6}
                  className="font-mono"
                />
              </div>

              <Button onClick={processBatchTimestamps} className="w-full">
                Convert Batch
              </Button>

              {batchResults.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Batch Results</h3>
                  <div className="space-y-3">
                    {batchResults.map((result) => (
                      <div key={result.id} className="rounded-lg bg-muted p-4">
                        <div className="mb-2 font-mono text-sm">
                          Input: {result.input}
                        </div>
                        {result.error ? (
                          <div className="text-sm text-red-500">
                            {result.error}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                            <div>ISO: {result.iso}</div>
                            <div>Local: {result.local}</div>
                            <div>UTC: {result.utc}</div>
                            <div>Relative: {result.relative}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Timestamp Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Common Formats</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Unix Timestamp:</strong> Seconds since Jan 1, 1970 UTC
                </div>
                <div>
                  <strong>JavaScript Timestamp:</strong> Milliseconds since Jan
                  1, 1970 UTC
                </div>
                <div>
                  <strong>ISO 8601:</strong> International standard date/time
                  format
                </div>
                <div>
                  <strong>UTC:</strong> Coordinated Universal Time
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Examples</h4>
              <div className="space-y-2 font-mono text-sm">
                <div>1672531200 (Unix seconds)</div>
                <div>1672531200000 (JavaScript ms)</div>
                <div>2023-01-01T00:00:00.000Z (ISO 8601)</div>
                <div>Sun, 01 Jan 2023 00:00:00 GMT (UTC)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
