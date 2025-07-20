export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

export type AuthType = "none" | "bearer" | "basic" | "api-key";

export interface APIRequest {
  id: string;
  name: string;
  method: HTTPMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  auth: {
    type: AuthType;
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyLocation?: "header" | "query";
    apiKeyName?: string;
  };
  timestamp: number;
}

export interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
  size: number;
  timestamp: number;
}

export interface RequestHistory {
  request: APIRequest;
  response: APIResponse | null;
  error?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: APIRequest[];
  createdAt: number;
  updatedAt: number;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  active: boolean;
}

export type ResponseFormat = "json" | "xml" | "html" | "text" | "raw";

export interface TabType {
  id: string;
  label: string;
  content: React.ReactNode;
}
