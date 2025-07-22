"use client";

import { Download, Upload, Zap, Play, Square, RotateCcw } from "lucide-react";
import React, { useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

export default function SpeedTest() {
  interface ISpeedTestResult {
    download: number;
    upload: number;
    ping: number;
    timestamp: string;
  }

  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<
    "ping" | "download" | "upload" | "complete" | null
  >(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ISpeedTestResult | null>(null);
  const [history, setHistory] = useState<ISpeedTestResult[]>([]);
  const [error, setError] = useState("");

  const pingRef = useRef<number>(0);
  const downloadRef = useRef<number>(0);
  const uploadRef = useRef<number>(0);

  const formatSpeed = (speed: number) => {
    if (speed >= 1000) {
      return `${(speed / 1000).toFixed(2)} Gbps`;
    }
    return `${speed.toFixed(2)} Mbps`;
  };

  const formatPing = (ping: number) => {
    return `${ping.toFixed(0)} ms`;
  };

  const measurePing = async (): Promise<number> => {
    const iterations = 5;
    const pings: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await fetch(`https://httpbin.org/get?t=${Date.now()}`, {
          method: "GET",
          cache: "no-cache",
        });
        const end = performance.now();
        pings.push(end - start);
      } catch {
        pings.push(1000);
      }
      setProgress((i + 1) * 20);
    }

    return pings.reduce((a, b) => a + b, 0) / pings.length;
  };

  const measureDownload = async (): Promise<number> => {
    const testSizes = [1, 2, 5, 10]; // MB
    const results: number[] = [];

    for (let i = 0; i < testSizes.length; i++) {
      const size = testSizes[i];
      const start = performance.now();

      try {
        const response = await fetch(
          `https://httpbin.org/bytes/${size * 1024 * 1024}`,
          {
            method: "GET",
            cache: "no-cache",
          },
        );

        if (!response.ok) throw new Error("Download failed");

        const reader = response.body?.getReader();
        let receivedLength = 0;

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedLength += value?.length || 0;
        }

        const end = performance.now();
        const duration = (end - start) / 1000;
        const speedMbps = (receivedLength * 8) / (duration * 1024 * 1024);
        results.push(speedMbps);

        setProgress(20 + (i + 1) * 20);
      } catch {
        results.push(0);
      }
    }

    return results.reduce((a, b) => a + b, 0) / results.length;
  };

  const measureUpload = async (): Promise<number> => {
    const testSizes = [0.5, 1, 2]; // MB
    const results: number[] = [];

    for (let i = 0; i < testSizes.length; i++) {
      const size = testSizes[i];
      const data = new ArrayBuffer(size * 1024 * 1024);
      const start = performance.now();

      try {
        const response = await fetch("https://httpbin.org/post", {
          method: "POST",
          body: data,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });

        if (!response.ok) throw new Error("Upload failed");

        const end = performance.now();
        const duration = (end - start) / 1000;
        const speedMbps = (size * 8) / duration;
        results.push(speedMbps);

        setProgress(40 + (i + 1) * 20);
      } catch {
        results.push(0);
      }
    }

    return results.reduce((a, b) => a + b, 0) / results.length;
  };

  const runSpeedTest = async () => {
    setIsRunning(true);
    setError("");
    setProgress(0);
    setResults(null);

    try {
      // Ping test
      setCurrentTest("ping");
      const ping = await measurePing();
      pingRef.current = ping;

      // Download test
      setCurrentTest("download");
      const download = await measureDownload();
      downloadRef.current = download;

      // Upload test
      setCurrentTest("upload");
      const upload = await measureUpload();
      uploadRef.current = upload;

      // Complete
      setCurrentTest("complete");
      setProgress(100);

      const result: ISpeedTestResult = {
        download,
        upload,
        ping,
        timestamp: new Date().toLocaleString(),
      };

      setResults(result);
      setHistory((prev) => [result, ...prev.slice(0, 9)]);
    } catch (err) {
      setError("Speed test failed. Please try again.");
      console.error("Speed test error:", err);
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const stopTest = () => {
    setIsRunning(false);
    setCurrentTest(null);
    setProgress(0);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const getSpeedColor = (speed: number, type: "download" | "upload") => {
    const threshold = type === "download" ? 25 : 10;
    if (speed >= threshold * 2) return "text-green-600";
    if (speed >= threshold) return "text-yellow-600";
    return "text-red-600";
  };

  const getPingColor = (ping: number) => {
    if (ping <= 20) return "text-green-600";
    if (ping <= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Internet Speed Test</h1>
        <p className="text-muted-foreground">
          Test your internet connection speed with download, upload, and ping
          measurements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Speed Test</CardTitle>
          <CardDescription>
            Click start to begin testing your connection speed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="flex gap-4">
              <Button
                onClick={runSpeedTest}
                disabled={isRunning}
                size="lg"
                className="min-w-32"
              >
                {isRunning ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Test
                  </>
                )}
              </Button>

              {isRunning && (
                <Button onClick={stopTest} variant="outline" size="lg">
                  <Square className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              )}
            </div>
          </div>

          {isRunning && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {currentTest === "ping" && "Testing Ping..."}
                  {currentTest === "download" && "Testing Download Speed..."}
                  {currentTest === "upload" && "Testing Upload Speed..."}
                  {currentTest === "complete" && "Test Complete!"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Progress: {progress}%
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Ping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div
                  className={`text-4xl font-bold ${getPingColor(results.ping)}`}
                >
                  {formatPing(results.ping)}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Latency
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div
                  className={`text-4xl font-bold ${getSpeedColor(results.download, "download")}`}
                >
                  {formatSpeed(results.download)}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Download Speed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div
                  className={`text-4xl font-bold ${getSpeedColor(results.upload, "upload")}`}
                >
                  {formatSpeed(results.upload)}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Upload Speed
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test History</CardTitle>
              <CardDescription>Recent speed test results</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear History
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((test, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <div className="text-sm text-muted-foreground">
                    {test.timestamp}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div
                        className={`font-semibold ${getPingColor(test.ping)}`}
                      >
                        {formatPing(test.ping)}
                      </div>
                      <div className="text-xs text-muted-foreground">Ping</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-semibold ${getSpeedColor(test.download, "download")}`}
                      >
                        {formatSpeed(test.download)}
                      </div>
                      <div className="text-xs text-muted-foreground">Down</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-semibold ${getSpeedColor(test.upload, "upload")}`}
                      >
                        {formatSpeed(test.upload)}
                      </div>
                      <div className="text-xs text-muted-foreground">Up</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About Speed Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <h4 className="mb-2 font-semibold">How it works</h4>
              <p className="text-sm text-muted-foreground">
                This speed test measures your internet connection by downloading
                and uploading test data to remote servers. Ping is measured by
                sending small packets to test latency.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Test Services</h4>
              <p className="text-sm text-muted-foreground">
                Uses <strong>httpbin.org</strong> for download/upload testing
                and ping measurements. Test files range from 1MB to 10MB for
                download, 0.5MB to 2MB for upload.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Accuracy</h4>
              <p className="text-sm text-muted-foreground">
                Results may vary based on network conditions, server location,
                and other factors. For best results, close other applications
                using internet during the test.
              </p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Download Test</Badge>
              <Badge variant="outline">Upload Test</Badge>
              <Badge variant="outline">Ping Test</Badge>
              <Badge variant="outline">Real-time Progress</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
