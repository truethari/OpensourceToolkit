"use client";

import { Copy, RefreshCw, Check } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export default function UUID() {
  interface IUUID {
    id: number;
    value: string;
    version: string;
    timestamp: string;
  }

  const [uuids, setUuids] = useState<IUUID[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("4");
  const [batchCount, setBatchCount] = useState("1");
  const [copiedIndex, setCopiedIndex] = useState<number | string | null>(null);

  // Simple UUID v4 generator
  const generateUUIDv4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  // Simple UUID v1 generator (timestamp-based)
  const generateUUIDv1 = () => {
    const timestamp = Date.now();
    const clockSeq = Math.floor(Math.random() * 16384);
    const node = Math.random().toString(16).substring(2, 14);

    const timeLow = (timestamp & 0xffffffff).toString(16).padStart(8, "0");
    const timeMid = ((timestamp >> 32) & 0xffff).toString(16).padStart(4, "0");
    const timeHi = (((timestamp >> 48) & 0x0fff) | 0x1000)
      .toString(16)
      .padStart(4, "0");
    const clockSeqHi = ((clockSeq >> 8) | 0x80).toString(16).padStart(2, "0");
    const clockSeqLow = (clockSeq & 0xff).toString(16).padStart(2, "0");

    return `${timeLow}-${timeMid}-${timeHi}-${clockSeqHi}${clockSeqLow}-${node}`;
  };

  // Generate Nil UUID
  const generateNilUUID = () => {
    return "00000000-0000-0000-0000-000000000000";
  };

  const generateUUID = (version: string) => {
    switch (version) {
      case "1":
        return generateUUIDv1();
      case "4":
        return generateUUIDv4();
      case "nil":
        return generateNilUUID();
      default:
        return generateUUIDv4();
    }
  };

  const handleGenerate = useCallback(() => {
    const count = Math.min(Math.max(1, parseInt(batchCount) || 1), 100);
    const newUuids: IUUID[] = [];

    for (let i = 0; i < count; i++) {
      newUuids.push({
        id: Date.now() + i,
        value: generateUUID(selectedVersion),
        version: selectedVersion,
        timestamp: new Date().toLocaleString(),
      });
    }

    setUuids(newUuids);
    setCopiedIndex(null);
  }, [selectedVersion, batchCount]);

  const copyToClipboard = async (uuid: string, index: number) => {
    try {
      await navigator.clipboard.writeText(uuid);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const copyAllUUIDs = async () => {
    const allUuids = uuids.map((u) => u.value).join("\n");
    try {
      await navigator.clipboard.writeText(allUuids);
      setCopiedIndex("all");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Generate initial UUID on mount
  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">UUID Generator</h1>
        <p className="text-muted-foreground">
          Generate universally unique identifiers with different versions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Choose UUID version and batch settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="version">UUID Version</Label>
              <Select
                value={selectedVersion}
                onValueChange={setSelectedVersion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">Version 4 (Random)</SelectItem>
                  <SelectItem value="1">Version 1 (Timestamp)</SelectItem>
                  <SelectItem value="nil">Nil UUID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Batch Count</Label>
              <Input
                id="batch"
                type="number"
                min="1"
                max="100"
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
                placeholder="Number of UUIDs"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleGenerate} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              {selectedVersion === "4" &&
                "Version 4 UUIDs are randomly generated and are the most commonly used."}
              {selectedVersion === "1" &&
                "Version 1 UUIDs are timestamp-based and include the current time."}
              {selectedVersion === "nil" &&
                "Nil UUID is a special UUID with all bits set to zero."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {uuids.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Generated UUIDs</CardTitle>
              <CardDescription>
                {uuids.length} UUID{uuids.length > 1 ? "s" : ""} generated
              </CardDescription>
            </div>
            {uuids.length > 1 && (
              <Button variant="outline" size="sm" onClick={copyAllUUIDs}>
                {copiedIndex === "all" ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied All
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uuids.map((uuid, index) => (
                <div
                  key={uuid.id}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="break-all font-mono text-sm">
                      {uuid.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Version {uuid.version} • Generated at {uuid.timestamp}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(uuid.value, index)}
                    className="ml-2"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About UUIDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Version 4 (Random)</h4>
              <p className="text-sm text-muted-foreground">
                The most commonly used UUID version. Generated using random or
                pseudo-random numbers. Has a very low probability of collision.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Version 1 (Timestamp)</h4>
              <p className="text-sm text-muted-foreground">
                Based on timestamp and MAC address. Guarantees uniqueness across
                time but may reveal information about when and where it was
                generated.
              </p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              UUIDs are 128-bit identifiers standardized by RFC 4122.
              They&apos;re designed to be unique across space and time without
              requiring a central authority.
            </p>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
