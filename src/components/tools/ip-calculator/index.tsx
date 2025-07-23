"use client";

import { toast } from "sonner";
import React, { useState, useCallback, useMemo } from "react";
import {
  Copy,
  Hash,
  Info,
  Network,
  Download,
  RefreshCw,
  ArrowRight,
  Calculator,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

interface SubnetInfo {
  networkAddress: string;
  broadcastAddress: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  subnetMask: string;
  wildcardMask: string;
  cidrNotation: string;
  networkClass: string;
  isPrivate: boolean;
  ipv4Binary: string;
  subnetMaskBinary: string;
  networkBinary: string;
  broadcastBinary: string;
}

interface IPValidation {
  isValid: boolean;
  type: "IPv4" | "IPv6" | "Invalid";
  format: string;
  errors: string[];
}

export default function IPCalculator() {
  const [ipAddress, setIpAddress] = useState("192.168.1.1");
  const [cidr, setCidr] = useState(24);
  const [subnetMask, setSubnetMask] = useState("255.255.255.0");
  const [customSubnets, setCustomSubnets] = useState(4);
  const [binaryInput, setBinaryInput] = useState("");
  const [hexInput, setHexInput] = useState("");

  // IP Address validation
  const validateIP = useCallback((ip: string): IPValidation => {
    const errors: string[] = [];

    // IPv4 validation
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipv4Match = ip.match(ipv4Regex);

    if (ipv4Match) {
      const octets = ipv4Match.slice(1).map(Number);
      const invalidOctets = octets.filter((octet, index) => {
        if (octet > 255) {
          errors.push(`Octet ${index + 1} (${octet}) exceeds 255`);
          return true;
        }
        return false;
      });

      if (invalidOctets.length === 0) {
        return {
          isValid: true,
          type: "IPv4",
          format: "Dotted Decimal",
          errors: [],
        };
      }
    }

    // IPv6 validation (basic)
    const ipv6Regex =
      /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^::$/;
    if (ipv6Regex.test(ip)) {
      return {
        isValid: true,
        type: "IPv6",
        format: "Hexadecimal Colon-separated",
        errors: [],
      };
    }

    if (!ipv4Match) {
      errors.push("Invalid IP address format");
    }

    return {
      isValid: false,
      type: "Invalid",
      format: "Unknown",
      errors,
    };
  }, []);

  // Convert IP to binary
  const ipToBinary = useCallback(
    (ip: string): string => {
      const validation = validateIP(ip);
      if (!validation.isValid || validation.type !== "IPv4") return "";

      return ip
        .split(".")
        .map((octet) => parseInt(octet).toString(2).padStart(8, "0"))
        .join(".");
    },
    [validateIP],
  );

  // Convert IP to hex
  const ipToHex = useCallback(
    (ip: string): string => {
      const validation = validateIP(ip);
      if (!validation.isValid || validation.type !== "IPv4") return "";

      return ip
        .split(".")
        .map((octet) =>
          parseInt(octet).toString(16).padStart(2, "0").toUpperCase(),
        )
        .join(".");
    },
    [validateIP],
  );

  // Convert IP to integer
  const ipToInteger = useCallback(
    (ip: string): number => {
      const validation = validateIP(ip);
      if (!validation.isValid || validation.type !== "IPv4") return 0;

      const octets = ip.split(".").map(Number);
      return (
        (octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3]
      );
    },
    [validateIP],
  );

  // Convert integer to IP
  const integerToIp = useCallback((num: number): string => {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255,
    ].join(".");
  }, []);

  // Convert binary to IP
  const binaryToIp = useCallback((binary: string): string => {
    const cleanBinary = binary.replace(/[^01]/g, "");
    if (cleanBinary.length !== 32) return "";

    const octets = [];
    for (let i = 0; i < 32; i += 8) {
      const octet = cleanBinary.substring(i, i + 8);
      octets.push(parseInt(octet, 2).toString());
    }
    return octets.join(".");
  }, []);

  // Convert hex to IP
  const hexToIp = useCallback((hex: string): string => {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
    if (cleanHex.length !== 8) return "";

    const octets = [];
    for (let i = 0; i < 8; i += 2) {
      const octet = cleanHex.substring(i, i + 2);
      octets.push(parseInt(octet, 16).toString());
    }
    return octets.join(".");
  }, []);

  // CIDR to subnet mask
  const cidrToSubnetMask = useCallback((cidr: number): string => {
    if (cidr < 0 || cidr > 32) return "";
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return [
      (mask >>> 24) & 255,
      (mask >>> 16) & 255,
      (mask >>> 8) & 255,
      mask & 255,
    ].join(".");
  }, []);

  // Subnet mask to CIDR
  const subnetMaskToCidr = useCallback(
    (mask: string): number => {
      const validation = validateIP(mask);
      if (!validation.isValid) return 0;

      const maskInteger = ipToInteger(mask);
      let cidr = 0;
      let temp = maskInteger;

      while (temp & 0x80000000) {
        cidr++;
        temp <<= 1;
      }

      return cidr;
    },
    [validateIP, ipToInteger],
  );

  // Calculate subnet information
  const calculateSubnet = useMemo((): SubnetInfo | null => {
    const validation = validateIP(ipAddress);
    if (!validation.isValid || validation.type !== "IPv4") return null;

    const ipInt = ipToInteger(ipAddress);
    const maskInt = ipToInteger(cidrToSubnetMask(cidr));
    const wildcardInt = ~maskInt >>> 0;

    const networkInt = ipInt & maskInt;
    const broadcastInt = networkInt | wildcardInt;

    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = totalHosts > 2 ? totalHosts - 2 : totalHosts;

    const networkClass = (() => {
      const firstOctet = (ipInt >>> 24) & 255;
      if (firstOctet <= 127) return "A";
      if (firstOctet <= 191) return "B";
      if (firstOctet <= 223) return "C";
      if (firstOctet <= 239) return "D (Multicast)";
      return "E (Reserved)";
    })();

    const isPrivate = (() => {
      const octets = ipAddress.split(".").map(Number);
      return (
        octets[0] === 10 ||
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
        (octets[0] === 192 && octets[1] === 168) ||
        octets[0] === 127 // localhost
      );
    })();

    return {
      networkAddress: integerToIp(networkInt),
      broadcastAddress: integerToIp(broadcastInt),
      firstHost: integerToIp(networkInt + 1),
      lastHost: integerToIp(broadcastInt - 1),
      totalHosts,
      usableHosts,
      subnetMask: cidrToSubnetMask(cidr),
      wildcardMask: integerToIp(wildcardInt),
      cidrNotation: `${integerToIp(networkInt)}/${cidr}`,
      networkClass,
      isPrivate,
      ipv4Binary: ipToBinary(ipAddress),
      subnetMaskBinary: ipToBinary(cidrToSubnetMask(cidr)),
      networkBinary: ipToBinary(integerToIp(networkInt)),
      broadcastBinary: ipToBinary(integerToIp(broadcastInt)),
    };
  }, [
    ipAddress,
    cidr,
    validateIP,
    ipToInteger,
    integerToIp,
    cidrToSubnetMask,
    ipToBinary,
  ]);

  // Generate custom subnets
  const generateCustomSubnets = useMemo(() => {
    if (!calculateSubnet) return [];

    const subnetBits = Math.ceil(Math.log2(customSubnets));
    const newCidr = cidr + subnetBits;
    if (newCidr > 32) return [];

    const baseNetwork = ipToInteger(calculateSubnet.networkAddress);
    const subnetSize = Math.pow(2, 32 - newCidr);

    const subnets = [];
    for (let i = 0; i < customSubnets && i < Math.pow(2, subnetBits); i++) {
      const subnetNetwork = baseNetwork + i * subnetSize;
      const subnetBroadcast = subnetNetwork + subnetSize - 1;

      subnets.push({
        id: i + 1,
        network: `${integerToIp(subnetNetwork)}/${newCidr}`,
        networkAddress: integerToIp(subnetNetwork),
        broadcastAddress: integerToIp(subnetBroadcast),
        firstHost: integerToIp(subnetNetwork + 1),
        lastHost: integerToIp(subnetBroadcast - 1),
        hosts: subnetSize > 2 ? subnetSize - 2 : subnetSize,
      });
    }

    return subnets;
  }, [calculateSubnet, customSubnets, cidr, ipToInteger, integerToIp]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const exportResults = () => {
    if (!calculateSubnet) return;

    const data = {
      inputIP: ipAddress,
      inputCIDR: cidr,
      calculation: calculateSubnet,
      customSubnets: generateCustomSubnets,
      conversions: {
        binary: ipToBinary(ipAddress),
        hex: ipToHex(ipAddress),
        integer: ipToInteger(ipAddress),
      },
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ip-calculator-${ipAddress.replace(/\./g, "-")}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported successfully");
  };

  const validation = validateIP(ipAddress);

  return (
    <ToolsWrapper>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <Network className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
          IP Address Calculator
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Comprehensive subnet calculator and IP address tools
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Input Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ip-input">IP Address</Label>
                <Input
                  id="ip-input"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="192.168.1.1"
                  className={!validation.isValid ? "border-red-500" : ""}
                />
                {!validation.isValid && (
                  <Alert className="mt-2">
                    <AlertDescription>
                      {validation.errors.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div>
                <Label htmlFor="cidr-input">CIDR / Subnet Bits</Label>
                <Input
                  id="cidr-input"
                  type="number"
                  min="0"
                  max="32"
                  value={cidr}
                  onChange={(e) => setCidr(parseInt(e.target.value) || 0)}
                  placeholder="24"
                />
              </div>

              <div>
                <Label htmlFor="mask-input">Subnet Mask</Label>
                <Input
                  id="mask-input"
                  value={subnetMask}
                  onChange={(e) => {
                    setSubnetMask(e.target.value);
                    const newCidr = subnetMaskToCidr(e.target.value);
                    if (newCidr > 0) setCidr(newCidr);
                  }}
                  placeholder="255.255.255.0"
                />
              </div>

              <Button
                onClick={() => {
                  setSubnetMask(cidrToSubnetMask(cidr));
                }}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync CIDR {"<->"} Mask
              </Button>
            </CardContent>
          </Card>

          {validation.isValid && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  IP Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Type:</span>
                  <Badge variant="secondary">{validation.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Format:</span>
                  <span className="text-sm">{validation.format}</span>
                </div>
                {calculateSubnet && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Class:</span>
                      <Badge variant="outline">
                        {calculateSubnet.networkClass}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Scope:</span>
                      <Badge
                        variant={
                          calculateSubnet.isPrivate ? "default" : "destructive"
                        }
                      >
                        {calculateSubnet.isPrivate ? "Private" : "Public"}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="subnet" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="subnet">Subnet Info</TabsTrigger>
              <TabsTrigger value="subnetting">Subnetting</TabsTrigger>
              <TabsTrigger value="conversions" className="hidden md:block">
                Conversions
              </TabsTrigger>
              <TabsTrigger value="binary" className="hidden md:block">
                Binary View
              </TabsTrigger>
            </TabsList>

            <TabsList className="mt-2 grid w-full grid-cols-2 md:hidden">
              <TabsTrigger value="conversions">Conversions</TabsTrigger>
              <TabsTrigger value="binary">Binary View</TabsTrigger>
            </TabsList>

            <TabsContent value="subnet" className="space-y-4">
              {calculateSubnet ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Subnet Calculation Results</CardTitle>
                    <Button onClick={exportResults} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Network Address</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                            {calculateSubnet.networkAddress}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                calculateSubnet.networkAddress,
                                "Network Address",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Broadcast Address</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                            {calculateSubnet.broadcastAddress}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                calculateSubnet.broadcastAddress,
                                "Broadcast Address",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>First Host</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                            {calculateSubnet.firstHost}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                calculateSubnet.firstHost,
                                "First Host",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Last Host</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                            {calculateSubnet.lastHost}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                calculateSubnet.lastHost,
                                "Last Host",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Wildcard Mask</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                            {calculateSubnet.wildcardMask}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                calculateSubnet.wildcardMask,
                                "Wildcard Mask",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>CIDR Notation</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                            {calculateSubnet.cidrNotation}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                calculateSubnet.cidrNotation,
                                "CIDR Notation",
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Total Hosts
                        </div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {calculateSubnet.totalHosts.toLocaleString("en-US")}
                        </div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Usable Hosts
                        </div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {calculateSubnet.usableHosts.toLocaleString("en-US")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      Enter a valid IP address to see subnet calculations
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="conversions" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Format Conversions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {validation.isValid && validation.type === "IPv4" && (
                      <>
                        <div className="space-y-2">
                          <Label>Binary</Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
                              {ipToBinary(ipAddress)}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(ipToBinary(ipAddress), "Binary")
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Hexadecimal</Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                              {ipToHex(ipAddress)}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(
                                  ipToHex(ipAddress),
                                  "Hexadecimal",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Integer</Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                              {ipToInteger(ipAddress).toLocaleString("en-US")}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(
                                  ipToInteger(ipAddress).toString(),
                                  "Integer",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowRight className="h-5 w-5" />
                      Reverse Conversions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Binary to IP</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={binaryInput}
                          onChange={(e) => setBinaryInput(e.target.value)}
                          placeholder="11000000101010000000000100000001"
                          className="flex-1 text-xs"
                        />
                      </div>
                      {binaryInput && (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                            {binaryToIp(binaryInput) || "Invalid binary"}
                          </code>
                          {binaryToIp(binaryInput) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(
                                  binaryToIp(binaryInput),
                                  "Converted IP",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Hex to IP</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={hexInput}
                          onChange={(e) => setHexInput(e.target.value)}
                          placeholder="C0A80101"
                          className="flex-1"
                        />
                      </div>
                      {hexInput && (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
                            {hexToIp(hexInput) || "Invalid hex"}
                          </code>
                          {hexToIp(hexInput) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(
                                  hexToIp(hexInput),
                                  "Converted IP",
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subnetting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subnet Division</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="custom-subnets">Number of Subnets:</Label>
                    <Input
                      id="custom-subnets"
                      type="number"
                      min="2"
                      max="256"
                      value={customSubnets}
                      onChange={(e) =>
                        setCustomSubnets(parseInt(e.target.value) || 2)
                      }
                      className="w-24"
                    />
                  </div>

                  {generateCustomSubnets.length > 0 && (
                    <div className="space-y-2">
                      <div className="grid gap-2">
                        {generateCustomSubnets.map((subnet) => (
                          <div
                            key={subnet.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                {subnet.network}
                              </div>
                              <div className="text-sm text-gray-500">
                                {subnet.firstHost} - {subnet.lastHost} (
                                {subnet.hosts} hosts)
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                copyToClipboard(
                                  subnet.network,
                                  `Subnet ${subnet.id}`,
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="binary" className="space-y-4">
              {calculateSubnet && (
                <Card>
                  <CardHeader>
                    <CardTitle>Binary Representation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 font-mono text-sm">
                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          IP Address:
                        </div>
                        <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
                          {calculateSubnet.ipv4Binary}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          Subnet Mask:
                        </div>
                        <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
                          {calculateSubnet.subnetMaskBinary}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          Network Address:
                        </div>
                        <div className="rounded bg-green-100 p-2 dark:bg-green-900/20">
                          {calculateSubnet.networkBinary}
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-gray-500">
                          Broadcast Address:
                        </div>
                        <div className="rounded bg-red-100 p-2 dark:bg-red-900/20">
                          {calculateSubnet.broadcastBinary}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                      <div className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                        Binary Analysis:
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        • Network portion: First {cidr} bits
                        <br />• Host portion: Last {32 - cidr} bits
                        <br />• Subnet allows {Math.pow(2, 32 - cidr)} total
                        addresses
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ToolsWrapper>
  );
}
