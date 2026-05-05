/**
 * Shared utility functions used by dashboard and extension
 */

import type { CookieInjectObject } from "./types";

/**
 * Validates an email format
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL format
 * @param url - URL to validate
 * @returns True if valid URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts domain from URL
 * @param url - Full URL
 * @returns Domain portion of URL
 */
export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch {
    return "";
  }
}

/**
 * Converts cookie string to cookie domain format
 * @param domain - Cookie domain/hostname
 * @returns Normalized cookie domain
 */
export function normalizeCookieDomain(domain: string): string {
  let normalized = domain.toLowerCase();
  if (!normalized.startsWith(".")) {
    normalized = "." + normalized;
  }
  return normalized;
}

/**
 * Parses JSON string safely
 * @param jsonString - String to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Validates cookie object structure
 * @param cookie - Cookie object to validate
 * @returns True if cookie has required fields
 */
export function isValidCookie(cookie: unknown): cookie is CookieInjectObject {
  if (typeof cookie !== "object" || cookie === null) return false;
  const c = cookie as Record<string, unknown>;
  return typeof c.name === "string" && typeof c.value === "string" && typeof c.domain === "string";
}

/**
 * Formats date for display
 * @param date - Date string or timestamp
 * @returns Formatted date string
 */
export function formatDate(date: string | number): string {
  const d = typeof date === "string" ? new Date(date) : new Date(date * 1000);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generates a random string for API key or token
 * @param length - Length of generated string
 * @returns Random string
 */
export function generateRandomString(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a delay promise
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
