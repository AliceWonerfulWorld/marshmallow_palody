import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

const isProtectedRoute = createRouteMatcher(["/inbox(.*)", "/settings(.*)", "/boxes(.*)"]);
const clerk = clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) await auth.protect();
}, { signInUrl: "/sign-in", signUpUrl: "/sign-up" });

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    // Public pages remain available without credentials; private routes never bypass auth.
    if (isProtectedRoute(request)) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    const response = NextResponse.next();
    if (request.nextUrl.pathname.startsWith("/invite/")) { response.headers.set("Referrer-Policy", "no-referrer"); response.headers.set("Cache-Control", "no-store"); }
    return response;
  }
  const response = await clerk(request, event);
  if (response && request.nextUrl.pathname.startsWith("/invite/")) { response.headers.set("Referrer-Policy", "no-referrer"); response.headers.set("Cache-Control", "no-store"); }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
