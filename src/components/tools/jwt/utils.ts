// Base64 URL encode/decode functions
export const base64UrlEncode = (str: string) => {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

export const base64UrlDecode = (str: string) => {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) {
    str += "=".repeat(4 - pad);
  }
  return atob(str);
};

// Simple HMAC SHA256 implementation (for demo purposes)
export const hmacSha256 = async (message: string, secret: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
};
