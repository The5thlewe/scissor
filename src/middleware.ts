import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/analytics(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(
  ip: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req) && isProtectedRoute(req)) {
      await auth.protect();
    }

    const clientIp =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (req.nextUrl.pathname.startsWith("/api/")) {
      if (isRateLimited(clientIp, 10, 60000)) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    frontendApiProxy: {
      enabled: true,
    },
  }
);

export const config = {
  matcher: [
    // Clerk auto-proxy serves JS from paths like /__clerk/npm/.../clerk.browser.js
    // which must bypass the static-file exclusion below.
    "/__clerk(.*)",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
