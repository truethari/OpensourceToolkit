"use client";

import QrCode from "qrcode";
import React, { useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Settings,
  Download,
  QrCode as QRCode,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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

interface QRCodeData {
  text: string;
  url: string;
  email: string;
  phone: string;
  sms: string;
  wifi: {
    ssid: string;
    password: string;
    security: string;
  };
  vcard: {
    firstName: string;
    lastName: string;
    organization: string;
    phone: string;
    email: string;
    url: string;
  };
}

export default function QRGenerator() {
  const [qrData, setQrData] = useState<QRCodeData>({
    text: "Hello, World!",
    url: "https://example.com",
    email: "user@example.com",
    phone: "+1234567890",
    sms: "+1234567890",
    wifi: {
      ssid: "MyWiFi",
      password: "password123",
      security: "WPA",
    },
    vcard: {
      firstName: "John",
      lastName: "Doe",
      organization: "Company Inc.",
      phone: "+1234567890",
      email: "john.doe@company.com",
      url: "https://company.com",
    },
  });

  const [qrSettings, setQrSettings] = useState({
    size: 256,
    errorLevel: "M",
    margin: 4,
    darkColor: "#000000",
    lightColor: "#FFFFFF",
  });

  const [activeTab, setActiveTab] = useState("text");
  const [qrDataURL, setQrDataURL] = useState("");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async (data: string) => {
    if (!data.trim()) return;

    try {
      // Use QR.js library (we'll need to install qrcode package)
      const QRCode = QrCode;

      const canvas = canvasRef.current;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, data, {
        width: qrSettings.size,
        margin: qrSettings.margin,
        color: {
          dark: qrSettings.darkColor,
          light: qrSettings.lightColor,
        },
        errorCorrectionLevel: qrSettings.errorLevel as
          | "low"
          | "medium"
          | "quartile"
          | "high",
      });

      // Generate data URL for download
      const dataURL = canvas.toDataURL("image/png");
      setQrDataURL(dataURL);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const getQRData = () => {
    switch (activeTab) {
      case "text":
        return qrData.text;
      case "url":
        return qrData.url;
      case "email":
        return `mailto:${qrData.email}`;
      case "phone":
        return `tel:${qrData.phone}`;
      case "sms":
        return `sms:${qrData.sms}`;
      case "wifi":
        return `WIFI:T:${qrData.wifi.security};S:${qrData.wifi.ssid};P:${qrData.wifi.password};;`;
      case "vcard":
        return `BEGIN:VCARD
VERSION:3.0
FN:${qrData.vcard.firstName} ${qrData.vcard.lastName}
ORG:${qrData.vcard.organization}
TEL:${qrData.vcard.phone}
EMAIL:${qrData.vcard.email}
URL:${qrData.vcard.url}
END:VCARD`;
      default:
        return qrData.text;
    }
  };

  useEffect(() => {
    const data = getQRData();
    generateQRCode(data);
  }, [qrData, qrSettings, activeTab]);

  const downloadQR = () => {
    if (!qrDataURL) return;

    const link = document.createElement("a");
    link.download = `qr-code-${activeTab}-${Date.now()}.png`;
    link.href = qrDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyQRData = async () => {
    try {
      await navigator.clipboard.writeText(getQRData());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const updateQRData = (field: string, value: string, nested?: string) => {
    setQrData((prev) => {
      if (nested) {
        return {
          ...prev,
          [field]: {
            ...(prev[field as keyof QRCodeData] as Record<string, string>),
            [nested]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">QR Code Generator</h1>
        <p className="text-muted-foreground">
          Generate QR codes for text, URLs, contacts, WiFi, and more with
          customizable styling
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QRCode className="h-5 w-5" />
                QR Code Data
              </CardTitle>
              <CardDescription>
                Choose data type and enter information to encode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                </TabsList>
                <TabsList className="mt-2 grid w-full grid-cols-4">
                  <TabsTrigger value="phone">Phone</TabsTrigger>
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                  <TabsTrigger value="wifi">WiFi</TabsTrigger>
                  <TabsTrigger value="vcard">Contact</TabsTrigger>
                </TabsList>

                <div className="mt-4 space-y-4">
                  <TabsContent value="text" className="space-y-2">
                    <Label htmlFor="text">Text Content</Label>
                    <Textarea
                      id="text"
                      placeholder="Enter any text to encode"
                      value={qrData.text}
                      onChange={(e) => updateQRData("text", e.target.value)}
                      rows={4}
                    />
                  </TabsContent>

                  <TabsContent value="url" className="space-y-2">
                    <Label htmlFor="url">Website URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      value={qrData.url}
                      onChange={(e) => updateQRData("url", e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="email" className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={qrData.email}
                      onChange={(e) => updateQRData("email", e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="phone" className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={qrData.phone}
                      onChange={(e) => updateQRData("phone", e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="sms" className="space-y-2">
                    <Label htmlFor="sms">SMS Number</Label>
                    <Input
                      id="sms"
                      type="tel"
                      placeholder="+1234567890"
                      value={qrData.sms}
                      onChange={(e) => updateQRData("sms", e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="wifi" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ssid">Network Name (SSID)</Label>
                        <Input
                          id="ssid"
                          placeholder="MyWiFi"
                          value={qrData.wifi.ssid}
                          onChange={(e) =>
                            updateQRData("wifi", e.target.value, "ssid")
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wifi-security">Security</Label>
                        <Select
                          value={qrData.wifi.security}
                          onValueChange={(value) =>
                            updateQRData("wifi", value, "security")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WPA">WPA/WPA2</SelectItem>
                            <SelectItem value="WEP">WEP</SelectItem>
                            <SelectItem value="nopass">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wifi-password">Password</Label>
                      <Input
                        id="wifi-password"
                        type="password"
                        placeholder="password123"
                        value={qrData.wifi.password}
                        onChange={(e) =>
                          updateQRData("wifi", e.target.value, "password")
                        }
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="vcard" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={qrData.vcard.firstName}
                          onChange={(e) =>
                            updateQRData("vcard", e.target.value, "firstName")
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={qrData.vcard.lastName}
                          onChange={(e) =>
                            updateQRData("vcard", e.target.value, "lastName")
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        placeholder="Company Inc."
                        value={qrData.vcard.organization}
                        onChange={(e) =>
                          updateQRData("vcard", e.target.value, "organization")
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vcard-phone">Phone</Label>
                        <Input
                          id="vcard-phone"
                          placeholder="+1234567890"
                          value={qrData.vcard.phone}
                          onChange={(e) =>
                            updateQRData("vcard", e.target.value, "phone")
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vcard-email">Email</Label>
                        <Input
                          id="vcard-email"
                          type="email"
                          placeholder="john@company.com"
                          value={qrData.vcard.email}
                          onChange={(e) =>
                            updateQRData("vcard", e.target.value, "email")
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vcard-url">Website</Label>
                      <Input
                        id="vcard-url"
                        type="url"
                        placeholder="https://company.com"
                        value={qrData.vcard.url}
                        onChange={(e) =>
                          updateQRData("vcard", e.target.value, "url")
                        }
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Customization
              </CardTitle>
              <CardDescription>
                Adjust QR code appearance and error correction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size: {qrSettings.size}px</Label>
                <Slider
                  id="size"
                  min={128}
                  max={512}
                  step={32}
                  value={[qrSettings.size]}
                  onValueChange={(value) =>
                    setQrSettings((prev) => ({ ...prev, size: value[0] }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin">Margin: {qrSettings.margin}</Label>
                <Slider
                  id="margin"
                  min={0}
                  max={10}
                  step={1}
                  value={[qrSettings.margin]}
                  onValueChange={(value) =>
                    setQrSettings((prev) => ({ ...prev, margin: value[0] }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="darkColor">Dark Color</Label>
                  <Input
                    id="darkColor"
                    type="color"
                    value={qrSettings.darkColor}
                    onChange={(e) =>
                      setQrSettings((prev) => ({
                        ...prev,
                        darkColor: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lightColor">Light Color</Label>
                  <Input
                    id="lightColor"
                    type="color"
                    value={qrSettings.lightColor}
                    onChange={(e) =>
                      setQrSettings((prev) => ({
                        ...prev,
                        lightColor: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="errorLevel">Error Correction Level</Label>
                <Select
                  value={qrSettings.errorLevel}
                  onValueChange={(value) =>
                    setQrSettings((prev) => ({ ...prev, errorLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Low (7%)</SelectItem>
                    <SelectItem value="M">Medium (15%)</SelectItem>
                    <SelectItem value="Q">Quartile (25%)</SelectItem>
                    <SelectItem value="H">High (30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated QR Code</CardTitle>
              <CardDescription>
                Your QR code will appear here automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="rounded-lg border border-border"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                  }}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={downloadQR} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={copyQRData}
                  className="flex-1"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied Data
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Data
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  QR code updates automatically as you type. Higher error
                  correction levels make codes more robust but larger.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                Raw data that will be encoded in the QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-3">
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
                  {getQRData()}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About QR Code Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Supported Formats</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Plain Text - Any text content</li>
                <li>• URLs - Website links</li>
                <li>• Email - mailto: links</li>
                <li>• Phone - tel: links for calling</li>
                <li>• SMS - Text message links</li>
                <li>• WiFi - Network connection info</li>
                <li>• vCard - Contact information</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Customizable size and colors</li>
                <li>• Adjustable error correction</li>
                <li>• Real-time generation</li>
                <li>• PNG download support</li>
                <li>• Mobile-friendly interface</li>
                <li>• Privacy-focused (client-side only)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
