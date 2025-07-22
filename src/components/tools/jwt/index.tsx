"use client";

import React, { useState } from "react";
import {
  Key,
  Eye,
  Info,
  Copy,
  Check,
  Clock,
  EyeOff,
  Shield,
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

import { base64UrlEncode, base64UrlDecode, hmacSha256 } from "./utils";

import type {
  IAnalysis,
  IShowSecrets,
  IVerifyResult,
  IAnalysisError,
  IVerifyResultError,
} from "./types";

export default function JWTComponent() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const [showSecrets, setShowSecrets] = useState<IShowSecrets>({});

  // Generate JWT State
  const [generatePayload, setGeneratePayload] = useState(
    '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}',
  );
  const [generateSecret, setGenerateSecret] = useState("your-256-bit-secret");
  const [generateAlgorithm, setGenerateAlgorithm] = useState("HS256");
  const [generateExpiry, setGenerateExpiry] = useState("1h");
  const [generatedToken, setGeneratedToken] = useState("");

  // Decode JWT State
  const [decodeToken, setDecodeToken] = useState("");
  const [decodedHeader, setDecodedHeader] = useState("");
  const [decodedPayload, setDecodedPayload] = useState("");
  const [decodedSignature, setDecodedSignature] = useState("");

  // Verify JWT State
  const [verifyToken, setVerifyToken] = useState("");
  const [verifySecret, setVerifySecret] = useState("");
  const [verifyResult, setVerifyResult] = useState<
    IVerifyResult | IVerifyResultError | null
  >(null);

  // Analyze JWT State
  const [analyzeToken, setAnalyzeToken] = useState("");
  const [analysisResult, setAnalysisResult] = useState<
    IAnalysis | IAnalysisError | null
  >(null);

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Generate JWT Token
  const generateJWT = async () => {
    try {
      const header = {
        alg: generateAlgorithm,
        typ: "JWT",
      };

      let payload;
      try {
        payload = JSON.parse(generatePayload);
      } catch (e) {
        console.error("Invalid JSON payload:", e);
        alert("Invalid JSON payload");
        return;
      }

      // Add expiry if specified
      if (generateExpiry && generateExpiry !== "never") {
        const now = Math.floor(Date.now() / 1000);
        const expiryMap = {
          "5m": 300,
          "1h": 3600,
          "1d": 86400,
          "7d": 604800,
          "30d": 2592000,
        };
        payload.exp = now + expiryMap[generateExpiry as keyof typeof expiryMap];
      }

      // Add issued at time
      payload.iat = Math.floor(Date.now() / 1000);

      const headerEncoded = base64UrlEncode(JSON.stringify(header));
      const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
      const message = `${headerEncoded}.${payloadEncoded}`;

      const signature = await hmacSha256(message, generateSecret);
      const token = `${message}.${signature}`;

      setGeneratedToken(token);
    } catch (error) {
      console.error("Error generating JWT:", error);
      alert("Error generating JWT token");
    }
  };

  // Decode JWT Token
  const decodeJWT = () => {
    try {
      const parts = decodeToken.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }

      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      const signature = parts[2];

      setDecodedHeader(JSON.stringify(header, null, 2));
      setDecodedPayload(JSON.stringify(payload, null, 2));
      setDecodedSignature(signature);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      setDecodedHeader("");
      setDecodedPayload("");
      setDecodedSignature("");
      alert("Invalid JWT token format");
    }
  };

  // Verify JWT Token
  const verifyJWT = async () => {
    try {
      const parts = verifyToken.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }

      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      const signature = parts[2];

      // Verify signature
      const message = `${parts[0]}.${parts[1]}`;
      const expectedSignature = await hmacSha256(message, verifySecret);
      const signatureValid = signature === expectedSignature;

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      const expired = payload.exp && payload.exp < now;

      // Check not before
      const notYetValid = payload.nbf && payload.nbf > now;

      setVerifyResult({
        valid: signatureValid && !expired && !notYetValid,
        signatureValid,
        expired,
        notYetValid,
        algorithm: header.alg,
        issuedAt: payload.iat
          ? new Date(payload.iat * 1000).toLocaleString()
          : "Not specified",
        expiresAt: payload.exp
          ? new Date(payload.exp * 1000).toLocaleString()
          : "Never",
        subject: payload.sub || "Not specified",
        issuer: payload.iss || "Not specified",
      });
    } catch (error) {
      console.error("Error verifying JWT:", error);
      setVerifyResult({
        valid: false,
        error: "Invalid token format or verification failed",
      });
    }
  };

  // Analyze JWT Token
  const analyzeJWT = () => {
    try {
      const parts = analyzeToken.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }

      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));

      const analysis: IAnalysis = {
        header,
        payload,
        algorithm: header.alg,
        tokenType: header.typ,
        keyId: header.kid || "Not specified",
        issuer: payload.iss || "Not specified",
        subject: payload.sub || "Not specified",
        audience: payload.aud || "Not specified",
        issuedAt: payload.iat
          ? new Date(payload.iat * 1000).toLocaleString()
          : "Not specified",
        expiresAt: payload.exp
          ? new Date(payload.exp * 1000).toLocaleString()
          : "Never",
        notBefore: payload.nbf
          ? new Date(payload.nbf * 1000).toLocaleString()
          : "Not specified",
        jwtId: payload.jti || "Not specified",
        customClaims: {},
        securityIssues: [],
      };

      // Extract custom claims
      const standardClaims = ["iss", "sub", "aud", "exp", "nbf", "iat", "jti"];
      Object.keys(payload).forEach((key) => {
        if (!standardClaims.includes(key)) {
          analysis.customClaims[key] = payload[key];
        }
      });

      // Security analysis
      if (!payload.exp) {
        analysis.securityIssues.push("Token has no expiration time");
      } else if (payload.exp - payload.iat > 86400) {
        analysis.securityIssues.push(
          "Token has a long expiration time (>24 hours)",
        );
      }

      if (header.alg === "none") {
        analysis.securityIssues.push("Unsecured token (algorithm: none)");
      }

      if (!payload.iss) {
        analysis.securityIssues.push("Token has no issuer claim");
      }

      if (!payload.sub) {
        analysis.securityIssues.push("Token has no subject claim");
      }

      setAnalysisResult(analysis);
    } catch (error) {
      console.error("Error analyzing JWT:", error);
      setAnalysisResult({
        error: "Invalid token format or analysis failed",
      });
    }
  };

  interface ISecretInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    field: string;
  }

  const SecretInput = ({
    value,
    onChange,
    placeholder,
    field,
  }: ISecretInputProps) => (
    <div className="relative">
      <Input
        type={showSecrets[field] ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2"
        onClick={() => toggleSecretVisibility(field)}
      >
        {showSecrets[field] ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">JWT Token Manager</h1>
        <p className="text-muted-foreground">
          Generate, decode, verify, and analyze JSON Web Tokens
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-1 md:gap-2">
          <TabsTrigger value="generate" className="text-xs sm:text-sm">
            Generate
          </TabsTrigger>
          <TabsTrigger value="decode" className="text-xs sm:text-sm">
            Decode
          </TabsTrigger>
          <TabsTrigger value="verify" className="text-xs sm:text-sm">
            Verify
          </TabsTrigger>
          <TabsTrigger value="analyze" className="text-xs sm:text-sm">
            Analyze
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Generate JWT Token
              </CardTitle>
              <CardDescription>
                Create a new JWT token with custom payload and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="algorithm">Algorithm</Label>
                  <Select
                    value={generateAlgorithm}
                    onValueChange={setGenerateAlgorithm}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HS256">HS256 (HMAC SHA256)</SelectItem>
                      <SelectItem value="HS384">HS384 (HMAC SHA384)</SelectItem>
                      <SelectItem value="HS512">HS512 (HMAC SHA512)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry</Label>
                  <Select
                    value={generateExpiry}
                    onValueChange={setGenerateExpiry}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5m">5 minutes</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="1d">1 day</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="never">Never expires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secret Key</Label>
                <SecretInput
                  value={generateSecret}
                  onChange={(e) => setGenerateSecret(e.target.value)}
                  placeholder="Enter secret key for signing"
                  field="generate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payload">Payload (JSON)</Label>
                <Textarea
                  value={generatePayload}
                  onChange={(e) => setGeneratePayload(e.target.value)}
                  placeholder="Enter JWT payload as JSON"
                  rows={8}
                  className="font-mono"
                />
              </div>

              <Button onClick={generateJWT} className="w-full">
                Generate JWT Token
              </Button>

              {generatedToken && (
                <div className="space-y-2">
                  <Label>Generated Token</Label>
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={generatedToken}
                      readOnly
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(generatedToken, "generated")
                      }
                    >
                      {copiedItem === "generated" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Decode JWT Token
              </CardTitle>
              <CardDescription>
                Decode and inspect JWT token structure (no verification)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="decode-token">JWT Token</Label>
                <Textarea
                  value={decodeToken}
                  onChange={(e) => setDecodeToken(e.target.value)}
                  placeholder="Paste JWT token here..."
                  rows={4}
                  className="font-mono"
                />
              </div>

              <Button onClick={decodeJWT} className="w-full">
                Decode Token
              </Button>

              {(decodedHeader || decodedPayload) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Header</Label>
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={decodedHeader}
                        readOnly
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(decodedHeader, "header")}
                      >
                        {copiedItem === "header" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payload</Label>
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={decodedPayload}
                        readOnly
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(decodedPayload, "payload")
                        }
                      >
                        {copiedItem === "payload" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {decodedSignature && (
                <div className="space-y-2">
                  <Label>Signature</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={decodedSignature}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(decodedSignature, "signature")
                      }
                    >
                      {copiedItem === "signature" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
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
                <Shield className="h-5 w-5" />
                Verify JWT Token
              </CardTitle>
              <CardDescription>
                Verify token signature and validate claims
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="verify-token">JWT Token</Label>
                <Textarea
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="Paste JWT token to verify..."
                  rows={4}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-secret">Secret Key</Label>
                <SecretInput
                  value={verifySecret}
                  onChange={(e) => setVerifySecret(e.target.value)}
                  placeholder="Enter secret key for verification"
                  field="verify"
                />
              </div>

              <Button onClick={verifyJWT} className="w-full">
                Verify Token
              </Button>

              {verifyResult && (
                <div className="space-y-4">
                  <Alert
                    className={
                      verifyResult.valid
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }
                  >
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="font-semibold">
                      {verifyResult.valid
                        ? "✓ Token is valid"
                        : "✗ Token is invalid"}
                    </AlertDescription>
                  </Alert>

                  {verifyResult.error ? (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{verifyResult.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Signature Valid:
                          </span>
                          <Badge
                            variant={
                              verifyResult.signatureValid
                                ? "default"
                                : "destructive"
                            }
                          >
                            {verifyResult.signatureValid ? "Valid" : "Invalid"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Expired:</span>
                          <Badge
                            variant={
                              verifyResult.expired ? "destructive" : "default"
                            }
                          >
                            {verifyResult.expired ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Not Yet Valid:
                          </span>
                          <Badge
                            variant={
                              verifyResult.notYetValid
                                ? "destructive"
                                : "default"
                            }
                          >
                            {verifyResult.notYetValid ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Algorithm:
                          </span>
                          <Badge variant="outline">
                            {verifyResult.algorithm}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium">
                            Issued At:
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {verifyResult.issuedAt}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            Expires At:
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {verifyResult.expiresAt}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Subject:</span>
                          <p className="text-sm text-muted-foreground">
                            {verifyResult.subject}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Issuer:</span>
                          <p className="text-sm text-muted-foreground">
                            {verifyResult.issuer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyze" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Analyze JWT Token
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of JWT token structure and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="analyze-token">JWT Token</Label>
                <Textarea
                  value={analyzeToken}
                  onChange={(e) => setAnalyzeToken(e.target.value)}
                  placeholder="Paste JWT token to analyze..."
                  rows={4}
                  className="font-mono"
                />
              </div>

              <Button onClick={analyzeJWT} className="w-full">
                Analyze Token
              </Button>

              {analysisResult && (
                <div className="space-y-6">
                  {analysisResult.error ? (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {analysisResult.error}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {/* Security Issues */}
                      {(analysisResult?.securityIssues || []).length > 0 && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Security Issues:</strong>
                            <ul className="mt-2 space-y-1">
                              {(analysisResult?.securityIssues || []).map(
                                (issue, index) => (
                                  <li key={index} className="text-sm">
                                    • {issue}
                                  </li>
                                ),
                              )}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Token Information */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <h4 className="font-semibold">Token Information</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Algorithm:
                              </span>
                              <Badge variant="outline">
                                {analysisResult.algorithm}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Type:</span>
                              <Badge variant="outline">
                                {analysisResult.tokenType}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Key ID:
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {analysisResult.keyId}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-semibold">Claims Information</h4>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium">
                                Issuer:
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {analysisResult.issuer}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">
                                Subject:
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {analysisResult.subject}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">
                                Audience:
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {analysisResult.audience}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium">
                                JWT ID:
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {analysisResult.jwtId}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="space-y-4">
                        <h4 className="flex items-center gap-2 font-semibold">
                          <Clock className="h-4 w-4" />
                          Timestamp Information
                        </h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <span className="text-sm font-medium">
                              Issued At:
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {analysisResult.issuedAt}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">
                              Expires At:
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {analysisResult.expiresAt}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">
                              Not Before:
                            </span>
                            <p className="text-sm text-muted-foreground">
                              {analysisResult.notBefore}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Custom Claims */}
                      {Object.keys(analysisResult?.customClaims || []).length >
                        0 && (
                        <div className="space-y-4">
                          <h4 className="font-semibold">Custom Claims</h4>
                          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                            <pre className="whitespace-pre-wrap font-mono text-sm">
                              {JSON.stringify(
                                analysisResult.customClaims,
                                null,
                                2,
                              )}
                            </pre>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>JWT Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-semibold">Standard Claims</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>iss:</strong> Issuer - who created the token
                </div>
                <div>
                  <strong>sub:</strong> Subject - who the token is about
                </div>
                <div>
                  <strong>aud:</strong> Audience - who the token is for
                </div>
                <div>
                  <strong>exp:</strong> Expiration time (Unix timestamp)
                </div>
                <div>
                  <strong>nbf:</strong> Not before time (Unix timestamp)
                </div>
                <div>
                  <strong>iat:</strong> Issued at time (Unix timestamp)
                </div>
                <div>
                  <strong>jti:</strong> JWT ID - unique identifier
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold">Common Algorithms</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>HS256:</strong> HMAC using SHA-256 (symmetric)
                </div>
                <div>
                  <strong>HS384:</strong> HMAC using SHA-384 (symmetric)
                </div>
                <div>
                  <strong>HS512:</strong> HMAC using SHA-512 (symmetric)
                </div>
                <div>
                  <strong>RS256:</strong> RSA using SHA-256 (asymmetric)
                </div>
                <div>
                  <strong>ES256:</strong> ECDSA using SHA-256 (asymmetric)
                </div>
                <div>
                  <strong>none:</strong> No signature (insecure)
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t pt-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold">Security Best Practices</h4>
                <div className="space-y-2 text-sm">
                  <div>• Use strong secret keys (minimum 256 bits)</div>
                  <div>• Set appropriate expiration times</div>
                  <div>• Validate all claims on the server</div>
                  <div>• Use HTTPS in production</div>
                  <div>• Never store sensitive data in payload</div>
                  <div>• Implement proper key rotation</div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Common Use Cases</h4>
                <div className="space-y-2 text-sm">
                  <div>• Authentication tokens</div>
                  <div>• API access tokens</div>
                  <div>• Single sign-on (SSO)</div>
                  <div>• Information exchange</div>
                  <div>• Temporary access grants</div>
                  <div>• Microservices communication</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ToolsWrapper>
  );
}
