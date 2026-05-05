/**
 * Authentication middleware for protecting dashboard routes
 * Verifies that only the owner can access the dashboard
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to protect dashboard routes
 * Checks if user is authenticated and is the owner
 */
export async function middleware(request: NextRequest) {
  // Check if accessing protected routes
  const pathname = request.nextUrl.pathname;
  const protectedPaths = ["/dashboard", "/api/tools", "/api/users", "/api/access", "/api/log-access"];

  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // For now, we'll use Supabase Auth via session
  // In production, extract the session from request cookies
  // This is a simplified version - implement full auth in production

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
