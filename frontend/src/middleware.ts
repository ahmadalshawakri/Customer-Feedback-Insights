import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const parseJwtRole = (token: string): string | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    const data = JSON.parse(jsonStr);
    return data.role || null;
  } catch {
    return null;
  }
};

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Redirect user based on role (making root directory /tickets)
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/tickets", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Prevent user to access login if already authenticated
  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/tickets", request.url));
    }
    return NextResponse.next();
  }

  const isProtectedRoute =
    pathname.startsWith("/tickets") || pathname.startsWith("/team");

  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Support Manager Routes
    const isManagerOnly =
      pathname.startsWith("/team") || pathname === "/tickets/new";

    if (isManagerOnly) {
      const role = parseJwtRole(token);
      if (role !== "support_manager") {
        return NextResponse.redirect(new URL("/tickets", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/tickets/:path*",
    "/team/:path*",
  ],
};
