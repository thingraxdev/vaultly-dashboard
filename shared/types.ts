/**
 * Shared types for Cookie Injection Management System
 * Used by both dashboard and extension
 */

/** Database: tools table */
export interface Tool {
  id: string;
  name: string;
  url: string;
  cookie_domain: string;
  cookies_json: string; // Encrypted JSON (encrypted on server)
  icon_url: string | null;
  created_at: string;
  is_active: boolean;
  cookie_updated_at?: string;
  max_concurrent_users?: number | null;
}

/** Database: users table */
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  is_active: boolean;
  password_set?: boolean;
}

/** Database: access_grants table */
export interface AccessGrant {
  id: string;
  user_id: string;
  tool_id: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

/** Database: usage_logs table */
export interface UsageLog {
  id: string;
  user_id: string;
  tool_id: string;
  accessed_at: string;
  action: string;
  extension_version?: string | null;
}

/** Tracks active user sessions per tool for concurrency limits */
export interface ActiveSession {
  id: string;
  user_id: string;
  tool_id: string;
  session_start: string;
  session_end?: string | null;
}

/** Cookie object structure for injection */
export interface CookieInjectObject {
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

/** API response: validate user */
export interface ValidateUserResponse {
  valid: boolean;
  allowedTools: ToolWithAccess[];
  email?: string;
  revokedTools?: { toolId: string; toolName: string; reason: string }[];
  message?: string;
}

/** API response: get cookies */
export interface GetCookiesResponse {
  cookies: CookieInjectObject[];
  toolId: string;
  toolUrl: string;
  sessionId?: string;
}

/** API request: log access */
export interface LogAccessRequest {
  email: string;
  toolId: string;
  action?: string;
  extensionVersion?: string;
  sessionId?: string;
}

/** Extension storage structure */
export interface ExtensionStorage {
  userEmail?: string;
  dashboardUrl?: string; // Portal/dashboard API base URL
  apiKey?: string;
  lastValidation?: number; // timestamp
}

/** Tool with user's access status */
export interface ToolWithAccess extends Tool {
  userHasAccess?: boolean;
  lastAccessTime?: string;
  grantActive?: boolean;
  busy?: boolean;
  unavailableReason?: string;
}
