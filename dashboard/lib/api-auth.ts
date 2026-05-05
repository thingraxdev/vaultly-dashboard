/**
 * API authentication middleware
 * Verifies X-API-Key header for extension requests
 */

import { NextRequest, NextResponse } from "next/server";

const EXTENSION_API_KEY = process.env.EXTENSION_API_KEY;

/**
 * Verify API key from X-API-Key header
 * @param request - Next.js request object
 * @returns true if valid, false otherwise
 */
export function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("X-API-Key");
  return apiKey === EXTENSION_API_KEY;
}

/**
 * Returns 401 error for invalid API key
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized: Invalid API key" }, { status: 401 });
}
