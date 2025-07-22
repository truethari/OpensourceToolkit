"use client";

import React, { useState, useCallback } from "react";
import {
  Copy,
  Search,
  Check,
  Globe,
  Clock,
  Download,
  AlertCircle,
  RefreshCw,
  Server,
  Info,
} from "lucide-react";

import { Input } from "@/components/ui/input";
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

interface DNSRecord {
  name: string;
  type: string;
  ttl: number;
  data: string;
}

interface DNSResult {
  domain: string;
  recordType: string;
  records: DNSRecord[];
  responseTime: number;
  timestamp: string;
  error?: string;
}

export default function DNSLookupTool() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState("A");
  const [results, setResults] = useState<DNSResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [batchDomains, setBatchDomains] = useState("");
  const [batchResults, setBatchResults] = useState<DNSResult[]>([]);
  const [error, setError] = useState("");

  const copyToClipboard = async (text: string, item: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  // Since we're in a browser environment and can't directly query DNS,
  // we'll use public DNS-over-HTTPS services like Cloudflare's DNS API
  const performDNSLookup = useCallback(
    async (domainName: string, type: string): Promise<DNSResult> => {
      const startTime = Date.now();

      try {
        // Use Cloudflare's DNS-over-HTTPS API
        const response = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domainName)}&type=${type}`,
          {
            headers: {
              Accept: "application/dns-json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        const records: DNSRecord[] = [];

        if (data.Answer) {
          data.Answer.forEach(
            (answer: {
              name: string;
              type: number;
              TTL: number;
              data: string;
            }) => {
              records.push({
                name: answer.name,
                type: getRecordTypeName(answer.type),
                ttl: answer.TTL,
                data: answer.data,
              });
            },
          );
        }

        return {
          domain: domainName,
          recordType: type,
          records,
          responseTime,
          timestamp: new Date().toISOString(),
          error: records.length === 0 ? "No records found" : undefined,
        };
      } catch (err) {
        return {
          domain: domainName,
          recordType: type,
          records: [],
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: err instanceof Error ? err.message : "DNS lookup failed",
        };
      }
    },
    [],
  );

  // Convert DNS record type numbers to names
  const getRecordTypeName = (typeNumber: number): string => {
    const types: { [key: number]: string } = {
      1: "A",
      2: "NS",
      5: "CNAME",
      6: "SOA",
      15: "MX",
      16: "TXT",
      28: "AAAA",
      33: "SRV",
      257: "CAA",
    };
    return types[typeNumber] || `TYPE${typeNumber}`;
  };

  const handleLookup = async () => {
    if (!domain.trim()) {
      setError("Please enter a domain name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await performDNSLookup(domain.trim(), recordType);
      setResults([result, ...results.slice(0, 9)]); // Keep last 10 results
    } catch {
      setError("Failed to perform DNS lookup");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchLookup = async () => {
    if (!batchDomains.trim()) {
      setError("Please enter domain names");
      return;
    }

    setLoading(true);
    setError("");

    const domains = batchDomains
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d);
    const results: DNSResult[] = [];

    try {
      // Process domains sequentially to avoid overwhelming the API
      for (const domainName of domains) {
        if (domainName) {
          const result = await performDNSLookup(domainName, recordType);
          results.push(result);
          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setBatchResults(results);
    } catch {
      setError("Failed to perform batch DNS lookup");
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = (results: DNSResult[], filename: string) => {
    const csvContent = [
      "Domain,Record Type,Name,Type,TTL,Data,Response Time (ms),Timestamp,Error",
      ...results.flatMap((result) =>
        result.records.length > 0
          ? result.records.map(
              (record) =>
                `"${result.domain}","${result.recordType}","${record.name}","${record.type}",${record.ttl},"${record.data}",${result.responseTime},"${result.timestamp}",""`,
            )
          : [
              `"${result.domain}","${result.recordType}","","","","",${result.responseTime},"${result.timestamp}","${result.error || ""}"`,
            ],
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatRecordData = (record: DNSRecord) => {
    // Format specific record types for better readability
    switch (record.type) {
      case "MX":
        const parts = record.data.split(" ");
        return parts.length >= 2
          ? `${parts[0]} ${parts.slice(1).join(" ")}`
          : record.data;
      case "TXT":
        return record.data.replace(/"/g, ""); // Remove quotes from TXT records
      case "SRV":
        const srvParts = record.data.split(" ");
        return srvParts.length >= 4
          ? `${srvParts[0]} ${srvParts[1]} ${srvParts[2]} ${srvParts[3]}`
          : record.data;
      default:
        return record.data;
    }
  };

  const clearResults = () => {
    setResults([]);
    setBatchResults([]);
    setError("");
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">DNS Lookup Tool</h1>
        <p className="text-muted-foreground">
          Query DNS records for domains including A, AAAA, MX, CNAME, TXT, NS,
          and more
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="single">Single Lookup</TabsTrigger>
          <TabsTrigger value="batch">Batch Lookup</TabsTrigger>
          <TabsTrigger value="info" className="hidden md:block">
            DNS Info
          </TabsTrigger>
        </TabsList>

        <TabsList className="mt-2 grid w-full grid-cols-1 md:hidden">
          <TabsTrigger value="info">DNS Info</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                DNS Lookup
              </CardTitle>
              <CardDescription>
                Query DNS records for a domain name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="domain">Domain Name</Label>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="record-type">Record Type</Label>
                  <Select value={recordType} onValueChange={setRecordType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A (IPv4 Address)</SelectItem>
                      <SelectItem value="AAAA">AAAA (IPv6 Address)</SelectItem>
                      <SelectItem value="MX">MX (Mail Exchange)</SelectItem>
                      <SelectItem value="CNAME">
                        CNAME (Canonical Name)
                      </SelectItem>
                      <SelectItem value="TXT">TXT (Text Record)</SelectItem>
                      <SelectItem value="NS">NS (Name Server)</SelectItem>
                      <SelectItem value="SOA">
                        SOA (Start of Authority)
                      </SelectItem>
                      <SelectItem value="SRV">SRV (Service Record)</SelectItem>
                      <SelectItem value="CAA">
                        CAA (Certificate Authority)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleLookup}
                  disabled={loading || !domain.trim()}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {loading ? "Looking up..." : "Lookup"}
                </Button>

                {results.length > 0 && (
                  <>
                    <Button variant="outline" onClick={clearResults}>
                      Clear Results
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadResults(results, "dns-lookup-results.csv")
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </>
                )}
              </div>

              {results.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Recent Lookups</h3>
                  {results.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-cyan-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {result.domain}
                            </CardTitle>
                            <CardDescription>
                              {result.recordType} records •{" "}
                              {result.responseTime}ms •
                              {new Date(result.timestamp).toLocaleString()}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                result.records
                                  .map((r) => `${r.name} ${r.type} ${r.data}`)
                                  .join("\n"),
                                `result-${index}`,
                              )
                            }
                          >
                            {copiedItem === `result-${index}` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {result.error ? (
                          <div className="text-sm text-red-500">
                            {result.error}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {result.records.map((record, recordIndex) => (
                              <div
                                key={recordIndex}
                                className="rounded bg-muted p-3 font-mono text-sm"
                              >
                                <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
                                  <div>
                                    <strong>Name:</strong> {record.name}
                                  </div>
                                  <div>
                                    <strong>Type:</strong> {record.type}
                                  </div>
                                  <div>
                                    <strong>TTL:</strong> {record.ttl}s
                                  </div>
                                  <div className="md:col-span-4">
                                    <strong>Data:</strong>{" "}
                                    {formatRecordData(record)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Batch DNS Lookup
              </CardTitle>
              <CardDescription>
                Query DNS records for multiple domains at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="batch-domains">
                    Domain Names (one per line)
                  </Label>
                  <Textarea
                    id="batch-domains"
                    placeholder="example.com&#10;google.com&#10;github.com"
                    value={batchDomains}
                    onChange={(e) => setBatchDomains(e.target.value)}
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-record-type">Record Type</Label>
                  <Select value={recordType} onValueChange={setRecordType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A (IPv4 Address)</SelectItem>
                      <SelectItem value="AAAA">AAAA (IPv6 Address)</SelectItem>
                      <SelectItem value="MX">MX (Mail Exchange)</SelectItem>
                      <SelectItem value="CNAME">
                        CNAME (Canonical Name)
                      </SelectItem>
                      <SelectItem value="TXT">TXT (Text Record)</SelectItem>
                      <SelectItem value="NS">NS (Name Server)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBatchLookup}
                  disabled={loading || !batchDomains.trim()}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {loading ? "Processing..." : "Batch Lookup"}
                </Button>

                {batchResults.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      downloadResults(batchResults, "batch-dns-results.csv")
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Results
                  </Button>
                )}
              </div>

              {batchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    Batch Results ({batchResults.length} domains)
                  </h3>
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {batchResults.map((result, index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-medium">{result.domain}</div>
                          <div className="text-sm text-muted-foreground">
                            <Clock className="mr-1 inline h-3 w-3" />
                            {result.responseTime}ms
                          </div>
                        </div>
                        {result.error ? (
                          <div className="text-sm text-red-500">
                            {result.error}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {result.records.map((record, recordIndex) => (
                              <div
                                key={recordIndex}
                                className="font-mono text-sm"
                              >
                                {record.type}: {formatRecordData(record)}
                              </div>
                            ))}
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

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                DNS Record Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 font-semibold">Common Record Types</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>A Record:</strong> Maps domain to IPv4 address
                    </div>
                    <div>
                      <strong>AAAA Record:</strong> Maps domain to IPv6 address
                    </div>
                    <div>
                      <strong>CNAME:</strong> Canonical name (alias) for another
                      domain
                    </div>
                    <div>
                      <strong>MX Record:</strong> Mail exchange servers for the
                      domain
                    </div>
                    <div>
                      <strong>TXT Record:</strong> Text information for various
                      purposes
                    </div>
                    <div>
                      <strong>NS Record:</strong> Name servers authoritative for
                      the domain
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 font-semibold">Advanced Records</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>SOA Record:</strong> Start of Authority for the
                      domain
                    </div>
                    <div>
                      <strong>SRV Record:</strong> Service location information
                    </div>
                    <div>
                      <strong>CAA Record:</strong> Certificate Authority
                      Authorization
                    </div>
                    <div>
                      <strong>PTR Record:</strong> Reverse DNS lookup (IP to
                      domain)
                    </div>
                    <div>
                      <strong>SPF Record:</strong> Sender Policy Framework (in
                      TXT)
                    </div>
                    <div>
                      <strong>DKIM Record:</strong> DomainKeys Identified Mail
                      (in TXT)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Troubleshooting:</strong> Use A records to check if a
                  domain resolves to an IP address
                </div>
                <div>
                  <strong>Email Issues:</strong> Check MX records to verify mail
                  server configuration
                </div>
                <div>
                  <strong>CDN Setup:</strong> Use CNAME records to verify CDN
                  alias configuration
                </div>
                <div>
                  <strong>Domain Verification:</strong> Check TXT records for
                  ownership verification
                </div>
                <div>
                  <strong>Name Servers:</strong> Use NS records to identify
                  authoritative DNS servers
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ToolsWrapper>
  );
}
