"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Eye,
  Info,
  Send,
  Save,
  Copy,
  Clock,
  Trash2,
  EyeOff,
  History,
  Download,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";

import ToolsWrapper from "@/components/wrappers/ToolsWrapper";

import {
  applyAuth,
  generateId,
  formatBytes,
  parseHeaders,
  STORAGE_KEYS,
  exportHistory,
  getStatusColor,
  stringifyHeaders,
  formatResponseTime,
  formatResponseData,
  saveToLocalStorage,
  createDefaultRequest,
  detectResponseFormat,
  loadFromLocalStorage,
  applyEnvironmentVariables,
} from "./utils";

import type {
  AuthType,
  HTTPMethod,
  APIRequest,
  Collection,
  Environment,
  APIResponse,
  RequestHistory,
} from "./types";

const HTTP_METHODS: HTTPMethod[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];

export default function APITester() {
  const [currentRequest, setCurrentRequest] = useState<APIRequest>(
    createDefaultRequest(),
  );
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<string>("");
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [headerString, setHeaderString] = useState("");
  const [activeTab, setActiveTab] = useState("request");

  useEffect(() => {
    const savedHistory = loadFromLocalStorage<RequestHistory[]>(
      STORAGE_KEYS.HISTORY,
      [],
    );
    const savedCollections = loadFromLocalStorage<Collection[]>(
      STORAGE_KEYS.COLLECTIONS,
      [],
    );
    const savedEnvironments = loadFromLocalStorage<Environment[]>(
      STORAGE_KEYS.ENVIRONMENTS,
      [],
    );
    const savedActiveEnv = loadFromLocalStorage<string>(
      STORAGE_KEYS.ACTIVE_ENVIRONMENT,
      "",
    );

    setHistory(savedHistory);
    setCollections(savedCollections);
    setEnvironments(savedEnvironments);
    setActiveEnvironment(savedActiveEnv);
    setHeaderString(stringifyHeaders(currentRequest.headers));
  }, []);

  const saveHistory = (newHistory: RequestHistory[]) => {
    setHistory(newHistory);
    saveToLocalStorage(STORAGE_KEYS.HISTORY, newHistory);
  };

  const saveCollections = (newCollections: Collection[]) => {
    setCollections(newCollections);
    saveToLocalStorage(STORAGE_KEYS.COLLECTIONS, newCollections);
  };

  const applyEnvironment = (request: APIRequest): APIRequest => {
    const activeEnv = environments.find((env) => env.id === activeEnvironment);
    if (!activeEnv) return request;

    return {
      ...request,
      url: applyEnvironmentVariables(request.url, activeEnv.variables),
      headers: Object.fromEntries(
        Object.entries(request.headers).map(([key, value]) => [
          key,
          applyEnvironmentVariables(value, activeEnv.variables),
        ]),
      ),
      body: request.body
        ? applyEnvironmentVariables(request.body, activeEnv.variables)
        : request.body,
    };
  };

  const sendRequest = async () => {
    if (!currentRequest.url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const requestToSend = applyEnvironment(currentRequest);
      const parsedHeaders = parseHeaders(headerString);
      const headersWithAuth = applyAuth(parsedHeaders, currentRequest.auth);

      let url = requestToSend.url;
      if (
        currentRequest.auth.type === "api-key" &&
        currentRequest.auth.apiKeyLocation === "query" &&
        currentRequest.auth.apiKey &&
        currentRequest.auth.apiKeyName
      ) {
        const urlObj = new URL(url);
        urlObj.searchParams.set(
          currentRequest.auth.apiKeyName,
          currentRequest.auth.apiKey,
        );
        url = urlObj.toString();
      }

      const startTime = Date.now();

      const options: RequestInit = {
        method: requestToSend.method,
        headers: headersWithAuth,
      };

      if (
        ["POST", "PUT", "PATCH"].includes(requestToSend.method) &&
        requestToSend.body
      ) {
        options.body = requestToSend.body;
      }

      const fetchResponse = await fetch(url, options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = fetchResponse.headers.get("content-type") || "";
      let responseData: unknown;

      try {
        if (contentType.includes("application/json")) {
          responseData = await fetchResponse.json();
        } else {
          responseData = await fetchResponse.text();
        }
      } catch {
        responseData = await fetchResponse.text();
      }

      // Calculate response size
      const responseText =
        typeof responseData === "string"
          ? responseData
          : JSON.stringify(responseData);
      const size = new Blob([responseText]).size;

      const apiResponse: APIResponse = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        data: responseData,
        responseTime,
        size,
        timestamp: Date.now(),
      };

      setResponse(apiResponse);

      // Add to history
      const historyEntry: RequestHistory = {
        request: { ...requestToSend, headers: headersWithAuth },
        response: apiResponse,
      };

      const newHistory = [historyEntry, ...history.slice(0, 99)]; // Keep last 100 requests
      saveHistory(newHistory);

      setActiveTab("response");

      toast.success(`Request completed in ${formatResponseTime(responseTime)}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Request failed";
      setError(errorMessage);

      const historyEntry: RequestHistory = {
        request: currentRequest,
        response: null,
        error: errorMessage,
      };

      const newHistory = [historyEntry, ...history.slice(0, 99)];
      saveHistory(newHistory);

      toast.error(`Request failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = (field: keyof APIRequest, value: unknown) => {
    setCurrentRequest((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateAuth = (field: keyof APIRequest["auth"], value: unknown) => {
    setCurrentRequest((prev) => ({
      ...prev,
      auth: {
        ...prev.auth,
        [field]: value,
      },
    }));
  };

  const copyResponse = async () => {
    if (!response) return;

    const format = detectResponseFormat(
      response.headers["content-type"] || "",
      response.data,
    );
    const formattedData = formatResponseData(response.data, format);

    try {
      await navigator.clipboard.writeText(formattedData);
      toast.success("Response copied to clipboard");
    } catch {
      toast.error("Failed to copy response");
    }
  };

  const loadFromHistory = (historyItem: RequestHistory) => {
    setCurrentRequest(historyItem.request);
    setHeaderString(stringifyHeaders(historyItem.request.headers));
    setResponse(historyItem.response);
    setError(historyItem.error || "");
    setActiveTab("request");
    toast.success("Request loaded from history");
  };

  const clearHistory = () => {
    saveHistory([]);
    toast.success("History cleared");
  };

  const handleExportHistory = () => {
    exportHistory(history);
    toast.success("History exported successfully");
  };

  const saveToCollection = () => {
    const collectionName = prompt("Enter collection name:");
    if (!collectionName) return;

    const newCollection: Collection = {
      id: generateId(),
      name: collectionName,
      description: `Collection created on ${new Date().toLocaleDateString()}`,
      requests: [{ ...currentRequest, headers: parseHeaders(headerString) }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newCollections = [...collections, newCollection];
    saveCollections(newCollections);
    toast.success(`Request saved to collection "${collectionName}"`);
  };

  return (
    <ToolsWrapper>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">API Testing Tool</h1>
        <p className="text-muted-foreground">
          Professional API testing with request builder, response viewer, and
          history tracking
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="request">
            Request <span className="hidden pl-1 md:block">Builder</span>
          </TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                HTTP Request Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL and Method */}
              <div className="flex gap-2">
                <Select
                  value={currentRequest.method}
                  onValueChange={(value: HTTPMethod) =>
                    updateRequest("method", value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Enter URL (e.g., https://api.example.com/users)"
                  value={currentRequest.url}
                  onChange={(e) => updateRequest("url", e.target.value)}
                  className="flex-1"
                />

                <Button
                  onClick={sendRequest}
                  disabled={loading || !currentRequest.url.trim()}
                  className="px-6"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send
                    </div>
                  )}
                </Button>
              </div>

              {/* Request Configuration Tabs */}
              <Tabs defaultValue="headers" className="w-full">
                <TabsList>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="auth">Auth</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="headers" className="space-y-4">
                  <div>
                    <Label htmlFor="headers">Request Headers</Label>
                    <Textarea
                      id="headers"
                      placeholder="Content-Type: application/json&#10;Authorization: Bearer your-token&#10;X-Custom-Header: value"
                      value={headerString}
                      onChange={(e) => setHeaderString(e.target.value)}
                      className="min-h-[120px] font-mono text-sm"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      Enter headers in key: value format, one per line
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="body" className="space-y-4">
                  <div>
                    <Label htmlFor="body">Request Body</Label>
                    <Textarea
                      id="body"
                      placeholder='{"name": "John Doe", "email": "john@example.com"}'
                      value={currentRequest.body || ""}
                      onChange={(e) => updateRequest("body", e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                      disabled={["GET", "HEAD", "OPTIONS"].includes(
                        currentRequest.method,
                      )}
                    />
                    {["GET", "HEAD", "OPTIONS"].includes(
                      currentRequest.method,
                    ) && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Request body is not supported for{" "}
                        {currentRequest.method} requests
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="auth" className="space-y-4">
                  <div>
                    <Label>Authentication Type</Label>
                    <Select
                      value={currentRequest.auth.type}
                      onValueChange={(value: AuthType) =>
                        updateAuth("type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Auth</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="api-key">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {currentRequest.auth.type === "bearer" && (
                    <div>
                      <Label htmlFor="token">Bearer Token</Label>
                      <div className="relative">
                        <Input
                          id="token"
                          type={showAuthToken ? "text" : "password"}
                          placeholder="Enter bearer token"
                          value={currentRequest.auth.token || ""}
                          onChange={(e) => updateAuth("token", e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowAuthToken(!showAuthToken)}
                        >
                          {showAuthToken ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentRequest.auth.type === "basic" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          placeholder="Enter username"
                          value={currentRequest.auth.username || ""}
                          onChange={(e) =>
                            updateAuth("username", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type={showAuthToken ? "text" : "password"}
                          placeholder="Enter password"
                          value={currentRequest.auth.password || ""}
                          onChange={(e) =>
                            updateAuth("password", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}

                  {currentRequest.auth.type === "api-key" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="apiKeyName">Key Name</Label>
                          <Input
                            id="apiKeyName"
                            placeholder="X-API-Key"
                            value={currentRequest.auth.apiKeyName || ""}
                            onChange={(e) =>
                              updateAuth("apiKeyName", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Select
                            value={
                              currentRequest.auth.apiKeyLocation || "header"
                            }
                            onValueChange={(value: "header" | "query") =>
                              updateAuth("apiKeyLocation", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="header">Header</SelectItem>
                              <SelectItem value="query">
                                Query Parameter
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          type={showAuthToken ? "text" : "password"}
                          placeholder="Enter API key"
                          value={currentRequest.auth.apiKey || ""}
                          onChange={(e) => updateAuth("apiKey", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div>
                    <Label htmlFor="requestName">Request Name</Label>
                    <Input
                      id="requestName"
                      placeholder="Give this request a name"
                      value={currentRequest.name}
                      onChange={(e) => updateRequest("name", e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveToCollection} variant="outline">
                      <Save className="mr-2 h-4 w-4" />
                      Save to Collection
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response" className="space-y-6">
          {response ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Response
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyResponse}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status and Info */}
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className={getStatusColor(response.status)}>
                    {response.status} {response.statusText}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatResponseTime(response.responseTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatBytes(response.size)}
                  </div>
                </div>

                <Separator />

                {/* Response Tabs */}
                <Tabs defaultValue="body" className="w-full">
                  <TabsList>
                    <TabsTrigger value="body">Response Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                  </TabsList>

                  <TabsContent value="body">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Response Body</Label>
                        <div className="text-sm text-muted-foreground">
                          {detectResponseFormat(
                            response.headers["content-type"] || "",
                            response.data,
                          ).toUpperCase()}
                        </div>
                      </div>
                      <Textarea
                        value={formatResponseData(
                          response.data,
                          detectResponseFormat(
                            response.headers["content-type"] || "",
                            response.data,
                          ),
                        )}
                        readOnly
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="headers">
                    <div className="space-y-2">
                      <Label>Response Headers</Label>
                      <Textarea
                        value={stringifyHeaders(response.headers)}
                        readOnly
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <div className="space-y-2 text-center">
                  <Info className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Send a request to see the response here
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Request History ({history.length})
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportHistory}
                    disabled={history.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearHistory}
                    disabled={history.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="py-8 text-center">
                  <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No requests in history yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Send some requests to see them appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className="flex cursor-pointer flex-col justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 md:flex-row md:items-center"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <Badge variant="outline" className="w-fit font-mono">
                          {item.request.method}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {item.request.name}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {item.request.url}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        {item.response ? (
                          <Badge
                            className={`w-fit ${getStatusColor(item.response.status)}`}
                          >
                            {item.response.status}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Error</Badge>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {new Date(
                            item.request.timestamp,
                          ).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ToolsWrapper>
  );
}
