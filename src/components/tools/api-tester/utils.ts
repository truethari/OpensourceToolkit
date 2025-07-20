import type {
  Collection,
  APIRequest,
  RequestHistory,
  ResponseFormat,
} from "./types";

// Generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Local storage keys
export const STORAGE_KEYS = {
  HISTORY: "api-tester-history",
  COLLECTIONS: "api-tester-collections",
  ENVIRONMENTS: "api-tester-environments",
  ACTIVE_ENVIRONMENT: "api-tester-active-environment",
} as const;

// Default request template
export const createDefaultRequest = (): APIRequest => ({
  id: generateId(),
  name: "New Request",
  method: "GET",
  url: "https://jsonplaceholder.typicode.com/posts/1",
  headers: {
    "Content-Type": "application/json",
  },
  auth: {
    type: "none",
  },
  timestamp: Date.now(),
});

// Format response size
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Format response time
export const formatResponseTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

// Get status color based on HTTP status code
export const getStatusColor = (status: number): string => {
  if (status >= 200 && status < 300) return "text-green-600 bg-green-50";
  if (status >= 300 && status < 400) return "text-blue-600 bg-blue-50";
  if (status >= 400 && status < 500) return "text-orange-600 bg-orange-50";
  if (status >= 500) return "text-red-600 bg-red-50";
  return "text-gray-600 bg-gray-50";
};

// Detect response format
export const detectResponseFormat = (
  contentType: string,
  data: unknown,
): ResponseFormat => {
  const type = contentType.toLowerCase();

  if (type.includes("application/json") || type.includes("text/json")) {
    return "json";
  }
  if (type.includes("application/xml") || type.includes("text/xml")) {
    return "xml";
  }
  if (type.includes("text/html")) {
    return "html";
  }
  if (type.includes("text/")) {
    return "text";
  }

  // Try to detect JSON even without proper content-type
  if (typeof data === "object") {
    return "json";
  }

  return "raw";
};

// Format response data for display
export const formatResponseData = (
  data: unknown,
  format: ResponseFormat,
): string => {
  try {
    switch (format) {
      case "json":
        if (typeof data === "string") {
          return JSON.stringify(JSON.parse(data), null, 2);
        }
        return JSON.stringify(data, null, 2);
      case "xml":
      case "html":
      case "text":
        return typeof data === "string" ? data : JSON.stringify(data, null, 2);
      case "raw":
      default:
        return typeof data === "string" ? data : JSON.stringify(data, null, 2);
    }
  } catch (error) {
    console.error("Failed to format response data:", error);
    return typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }
};

// Parse headers string into object
export const parseHeaders = (headersString: string): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (!headersString.trim()) return headers;

  headersString.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      if (key && value) {
        headers[key] = value;
      }
    }
  });

  return headers;
};

// Convert headers object to string
export const stringifyHeaders = (headers: Record<string, string>): string => {
  return Object.entries(headers)
    .filter(([key, value]) => key.trim() && value.trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
};

// Apply authentication to headers
export const applyAuth = (
  headers: Record<string, string>,
  auth: APIRequest["auth"],
): Record<string, string> => {
  const newHeaders = { ...headers };

  switch (auth.type) {
    case "bearer":
      if (auth.token) {
        newHeaders["Authorization"] = `Bearer ${auth.token}`;
      }
      break;
    case "basic":
      if (auth.username && auth.password) {
        const credentials = btoa(`${auth.username}:${auth.password}`);
        newHeaders["Authorization"] = `Basic ${credentials}`;
      }
      break;
    case "api-key":
      if (auth.apiKey && auth.apiKeyName && auth.apiKeyLocation === "header") {
        newHeaders[auth.apiKeyName] = auth.apiKey;
      }
      break;
  }

  return newHeaders;
};

// Apply environment variables to string
export const applyEnvironmentVariables = (
  str: string,
  variables: Record<string, string>,
): string => {
  let result = str;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, value);
  });
  return result;
};

// Save to local storage
export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};

// Load from local storage
export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return defaultValue;
  }
};

// Export collection to JSON
export const exportCollection = (collection: Collection): void => {
  const dataStr = JSON.stringify(collection, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${collection.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export history to JSON
export const exportHistory = (history: RequestHistory[]): void => {
  const dataStr = JSON.stringify(history, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `api_tester_history_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
