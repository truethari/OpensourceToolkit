export interface IShowSecrets {
  [key: string]: boolean;
}

export interface IVerifyResult {
  valid: boolean;
  signatureValid: boolean;
  expired: boolean;
  notYetValid: boolean;
  algorithm: string;
  issuedAt: string;
  expiresAt: string;
  subject: string;
  issuer: string;
  error?: string;
}
export interface IVerifyResultError {
  valid: boolean;
  error: string;
  signatureValid?: boolean;
  expired?: boolean;
  notYetValid?: boolean;
  algorithm?: string;
  issuedAt?: string;
  expiresAt?: string;
  subject?: string;
  issuer?: string;
}

export interface IAnalysis {
  header: object;
  payload: object;
  algorithm: string;
  tokenType: string;
  keyId: string;
  issuer: string;
  subject: string;
  audience: string;
  issuedAt: string;
  expiresAt: string;
  notBefore: string;
  jwtId: string;
  customClaims: { [key: string]: string[] };
  securityIssues: string[];
  error?: string;
}

export interface IAnalysisError {
  error: string;
  algorithm?: string;
  tokenType?: string;
  keyId?: string;
  issuer?: string;
  subject?: string;
  audience?: string;
  jwtId?: string;
  issuedAt?: string;
  expiresAt?: string;
  notBefore?: string;
  customClaims?: { [key: string]: string[] };
  securityIssues?: string[];
}
