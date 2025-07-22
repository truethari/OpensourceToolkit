"use client";

import React, { useState } from "react";
import {
  Eye,
  Key,
  Copy,
  Hash,
  Check,
  EyeOff,
  Shield,
  XCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

export default function HMACGeneratorComponent() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Generate tab state
  const [message, setMessage] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [hmacResult, setHmacResult] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Verify tab state
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifySecretKey, setVerifySecretKey] = useState("");
  const [verifyAlgorithm, setVerifyAlgorithm] = useState("SHA-256");
  const [verifyHmac, setVerifyHmac] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifySecret, setShowVerifySecret] = useState(false);

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const generateHMAC = async () => {
    if (!message.trim() || !secretKey.trim()) {
      setError("Please provide both message and secret key");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const encoder = new TextEncoder();
      const messageData = encoder.encode(message);
      const keyData = encoder.encode(secretKey);

      let hashAlgorithm;
      switch (algorithm) {
        case "SHA-1":
          hashAlgorithm = "SHA-1";
          break;
        case "SHA-256":
          hashAlgorithm = "SHA-256";
          break;
        case "SHA-384":
          hashAlgorithm = "SHA-384";
          break;
        case "SHA-512":
          hashAlgorithm = "SHA-512";
          break;
        default:
          throw new Error("Unsupported algorithm");
      }

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: hashAlgorithm },
        false,
        ["sign"],
      );

      const signature = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        messageData,
      );
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      setHmacResult(hashHex);
    } catch (err) {
      console.error("Error generating HMAC:", err);
      setError("Failed to generate HMAC. Please check your inputs.");
    } finally {
      setIsGenerating(false);
    }
  };

  const verifyHMAC = async () => {
    if (
      !verifyMessage.trim() ||
      !verifySecretKey.trim() ||
      !verifyHmac.trim()
    ) {
      setVerifyError("Please provide message, secret key, and HMAC to verify");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");
    setVerifyResult(null);

    try {
      const encoder = new TextEncoder();
      const messageData = encoder.encode(verifyMessage);
      const keyData = encoder.encode(verifySecretKey);

      let hashAlgorithm;
      switch (verifyAlgorithm) {
        case "SHA-1":
          hashAlgorithm = "SHA-1";
          break;
        case "SHA-256":
          hashAlgorithm = "SHA-256";
          break;
        case "SHA-384":
          hashAlgorithm = "SHA-384";
          break;
        case "SHA-512":
          hashAlgorithm = "SHA-512";
          break;
        default:
          throw new Error("Unsupported algorithm");
      }

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: hashAlgorithm },
        false,
        ["sign"],
      );

      const signature = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        messageData,
      );
      const hashArray = Array.from(new Uint8Array(signature));
      const computedHmac = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Compare the computed HMAC with the provided one (case-insensitive)
      const isValid =
        computedHmac.toLowerCase() === verifyHmac.toLowerCase().trim();
      setVerifyResult(isValid);
    } catch (err) {
      console.error("Error verifying HMAC:", err);
      setVerifyError("Failed to verify HMAC. Please check your inputs.");
    } finally {
      setIsVerifying(false);
    }
  };

  const clearAll = () => {
    setMessage("");
    setSecretKey("");
    setHmacResult("");
    setError("");
    setAlgorithm("SHA-256");
  };

  const clearVerify = () => {
    setVerifyMessage("");
    setVerifySecretKey("");
    setVerifyHmac("");
    setVerifyResult(null);
    setVerifyError("");
    setVerifyAlgorithm("SHA-256");
  };

  const toggleSecretVisibility = () => {
    setShowSecret(!showSecret);
  };

  const toggleVerifySecretVisibility = () => {
    setShowVerifySecret(!showVerifySecret);
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">HMAC Generator & Verifier</h1>
        <p className="text-muted-foreground">
          Generate and verify Hash-based Message Authentication Codes for data
          integrity and authentication
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate HMAC</TabsTrigger>
          <TabsTrigger value="verify">Verify HMAC</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Generate HMAC
              </CardTitle>
              <CardDescription>
                Create a cryptographic hash using your message and secret key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="algorithm">Hash Algorithm</Label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHA-1">SHA-1 (160 bits)</SelectItem>
                    <SelectItem value="SHA-256">
                      SHA-256 (256 bits) - Recommended
                    </SelectItem>
                    <SelectItem value="SHA-384">SHA-384 (384 bits)</SelectItem>
                    <SelectItem value="SHA-512">SHA-512 (512 bits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter the message to authenticate..."
                  rows={4}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secret Key</Label>
                <div className="relative">
                  <Input
                    id="secret"
                    type={showSecret ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter your secret key..."
                    className="pr-10 font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={toggleSecretVisibility}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={generateHMAC}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Hash className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Hash className="mr-2 h-4 w-4" />
                      Generate HMAC
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearAll}>
                  Clear All
                </Button>
              </div>

              {hmacResult && (
                <div className="space-y-2">
                  <Label>HMAC Result</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md border bg-muted p-3">
                      <code className="break-all font-mono text-sm">
                        {hmacResult}
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(hmacResult, "hmac")}
                    >
                      {copiedItem === "hmac" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Algorithm: {algorithm}</Badge>
                    <Badge variant="secondary">
                      Length: {hmacResult.length * 4} bits
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Verify HMAC
              </CardTitle>
              <CardDescription>
                Verify the authenticity of a message using its HMAC signature
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="verify-algorithm">Hash Algorithm</Label>
                <Select
                  value={verifyAlgorithm}
                  onValueChange={setVerifyAlgorithm}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHA-1">SHA-1 (160 bits)</SelectItem>
                    <SelectItem value="SHA-256">
                      SHA-256 (256 bits) - Recommended
                    </SelectItem>
                    <SelectItem value="SHA-384">SHA-384 (384 bits)</SelectItem>
                    <SelectItem value="SHA-512">SHA-512 (512 bits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-message">Original Message</Label>
                <Textarea
                  id="verify-message"
                  value={verifyMessage}
                  onChange={(e) => setVerifyMessage(e.target.value)}
                  placeholder="Enter the original message..."
                  rows={4}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-secret">Secret Key</Label>
                <div className="relative">
                  <Input
                    id="verify-secret"
                    type={showVerifySecret ? "text" : "password"}
                    value={verifySecretKey}
                    onChange={(e) => setVerifySecretKey(e.target.value)}
                    placeholder="Enter the secret key..."
                    className="pr-10 font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={toggleVerifySecretVisibility}
                  >
                    {showVerifySecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-hmac">HMAC to Verify</Label>
                <Input
                  id="verify-hmac"
                  value={verifyHmac}
                  onChange={(e) => setVerifyHmac(e.target.value)}
                  placeholder="Enter the HMAC hash to verify..."
                  className="font-mono"
                />
              </div>

              {verifyError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{verifyError}</AlertDescription>
                </Alert>
              )}

              {verifyResult !== null && (
                <Alert
                  className={
                    verifyResult
                      ? "border-green-700 bg-green-800"
                      : "border-red-700 bg-red-800"
                  }
                >
                  <AlertDescription className="flex flex-row gap-2 font-semibold">
                    {verifyResult ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}

                    {verifyResult
                      ? "HMAC is valid - Message is authentic"
                      : "HMAC is invalid - Message may be tampered"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={verifyHMAC}
                  disabled={isVerifying}
                  className="flex-1"
                >
                  {isVerifying ? (
                    <>
                      <Hash className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verify HMAC
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearVerify}>
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            HMAC Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">What is HMAC?</h4>
              <div className="space-y-2 text-sm">
                <p>
                  HMAC (Hash-based Message Authentication Code) is a
                  cryptographic authentication technique that combines a secret
                  key with a message and a hash function to create a unique
                  signature.
                </p>
                <p>
                  It provides both data integrity and authentication, ensuring
                  that the message hasn&apos;t been tampered with and comes from
                  someone who knows the secret key.
                </p>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Common Use Cases</h4>
              <div className="space-y-2 text-sm">
                <div>• API request authentication</div>
                <div>• Digital signatures</div>
                <div>• Message integrity verification</div>
                <div>• Webhook payload validation</div>
                <div>• Secure token generation</div>
                <div>• Password-based authentication</div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t pt-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold">Algorithm Comparison</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>SHA-1:</strong> 160 bits (deprecated, use only for
                    legacy support)
                  </div>
                  <div>
                    <strong>SHA-256:</strong> 256 bits (recommended for most use
                    cases)
                  </div>
                  <div>
                    <strong>SHA-384:</strong> 384 bits (good for high security
                    needs)
                  </div>
                  <div>
                    <strong>SHA-512:</strong> 512 bits (maximum security,
                    slower)
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Security Best Practices</h4>
                <div className="space-y-2 text-sm">
                  <div>• Use SHA-256 or higher for new implementations</div>
                  <div>• Keep secret keys secure and rotate regularly</div>
                  <div>• Use sufficiently long random secret keys</div>
                  <div>• Always validate HMAC on the receiving end</div>
                  <div>• Never log or expose secret keys</div>
                  <div>• Use constant-time comparison when verifying</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
