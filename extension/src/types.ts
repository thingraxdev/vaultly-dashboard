/**
 * Cookie Injection Types for TypeScript support
 */

interface CookieInjectObject {
  name: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
  expirationDate?: number;
  url?: string;
}

interface Tool {
  id: string;
  name: string;
  url: string;
  icon_url?: string;
  cookie_domain: string;
}

interface ValidateUserResponse {
  valid: boolean;
  allowedTools: Tool[];
  email?: string;
}

interface GetCookiesResponse {
  cookies: CookieInjectObject[];
  toolId: string;
  toolUrl: string;
}

interface ExtensionStorage {
  userEmail?: string;
  dashboardUrl?: string;
  apiKey?: string;
  lastValidation?: number;
}
