"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Globe, Building, Copy, Check, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

export default function IPLocation() {
  interface IIPLocation {
    ip: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
    as: string;
    status: string;
    query: string;
  }

  const [ipInput, setIpInput] = useState("");
  const [currentIP, setCurrentIP] = useState("");
  const [locationData, setLocationData] = useState<IIPLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isValidIP = (ip: string) => {
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const fetchIPLocation = async (ip: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`https://ipwho.is/${ip}`);
      const data = await response.json();

      if (data.success !== false) {
        // Map ipwho.is response to our interface
        const mappedData: IIPLocation = {
          ip: data.ip,
          country: data.country,
          countryCode: data.country_code,
          region: data.region_code || data.region,
          regionName: data.region,
          city: data.city,
          zip: data.postal || "",
          lat: data.latitude,
          lon: data.longitude,
          timezone: data.timezone?.id || data.timezone?.utc || "",
          isp: data.connection?.isp || "Unknown",
          org: data.connection?.org || "Unknown",
          as: data.connection?.asn
            ? `AS${data.connection.asn} ${data.connection.org}`
            : "Unknown",
          status: "success",
          query: data.ip,
        };
        setLocationData(mappedData);
        setCurrentIP(ip);
      } else {
        setError(data.message || "Failed to fetch location data");
        setLocationData(null);
      }
    } catch {
      setError("Failed to fetch location data. Please check your connection.");
      setLocationData(null);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentIP = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      const userIP = data.ip;
      setIpInput(userIP);
      await fetchIPLocation(userIP);
    } catch {
      setError("Failed to get your current IP address");
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!ipInput.trim()) {
      setError("Please enter an IP address");
      return;
    }

    if (!isValidIP(ipInput.trim())) {
      setError("Please enter a valid IPv4 or IPv6 address");
      return;
    }

    fetchIPLocation(ipInput.trim());
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  useEffect(() => {
    const initializeIP = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        const userIP = data.ip;
        setIpInput(userIP);
        await fetchIPLocation(userIP);
      } catch {
        setError("Failed to get your current IP address");
        setLoading(false);
      }
    };

    initializeIP();
  }, []);

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">IP Location Checker</h1>
        <p className="text-muted-foreground">
          Check IP address geolocation information including country, region,
          ISP, and more
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>IP Address Lookup</CardTitle>
          <CardDescription>
            Enter an IP address to get location information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="Enter IP address (e.g., 8.8.8.8)"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 sm:flex-initial"
              >
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                onClick={getCurrentIP}
                disabled={loading}
                className="flex-1 sm:flex-initial"
              >
                <Globe className="mr-2 h-4 w-4" />
                My IP
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {locationData && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
              <CardDescription>
                Geographic details for {currentIP}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Country</p>
                    <p className="text-sm text-muted-foreground">
                      {locationData.country} ({locationData.countryCode})
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(locationData.country, "country")
                    }
                  >
                    {copiedField === "country" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Region</p>
                    <p className="text-sm text-muted-foreground">
                      {locationData.regionName} ({locationData.region})
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(locationData.regionName, "region")
                    }
                  >
                    {copiedField === "region" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">City</p>
                    <p className="text-sm text-muted-foreground">
                      {locationData.city}{" "}
                      {locationData.zip && `(${locationData.zip})`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(locationData.city, "city")}
                  >
                    {copiedField === "city" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Coordinates</p>
                    <p className="text-sm text-muted-foreground">
                      {locationData.lat.toFixed(4)},{" "}
                      {locationData.lon.toFixed(4)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        `${locationData.lat}, ${locationData.lon}`,
                        "coordinates",
                      )
                    }
                  >
                    {copiedField === "coordinates" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Timezone</p>
                    <p className="text-sm text-muted-foreground">
                      {locationData.timezone}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(locationData.timezone, "timezone")
                    }
                  >
                    {copiedField === "timezone" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Network Information
              </CardTitle>
              <CardDescription>ISP and organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">ISP</p>
                    <p className="text-sm text-muted-foreground">
                      {locationData.isp}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(locationData.isp, "isp")}
                  >
                    {copiedField === "isp" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Organization</p>
                    <p className="text-sm text-muted-foreground">
                      {locationData.org}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(locationData.org, "org")}
                  >
                    {copiedField === "org" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AS Number</p>
                    <p className="text-sm text-muted-foreground">
                      {locationData.as}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(locationData.as, "as")}
                  >
                    {copiedField === "as" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Query IP</p>
                      <p className="font-mono text-sm text-muted-foreground">
                        {locationData.query}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(locationData.query, "query")
                      }
                    >
                      {copiedField === "query" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About IP Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">How it works</h4>
              <p className="text-sm text-muted-foreground">
                IP geolocation uses databases that map IP address ranges to
                geographic locations. The accuracy varies but is generally
                reliable for country and region-level information.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Privacy Notice</h4>
              <p className="text-sm text-muted-foreground">
                This tool uses the ipwho.is service to retrieve location data.
                No IP addresses are stored or logged by this application.
              </p>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">IPv4 Support</Badge>
              <Badge variant="outline">IPv6 Support</Badge>
              <Badge variant="outline">ISP Detection</Badge>
              <Badge variant="outline">Timezone Info</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
