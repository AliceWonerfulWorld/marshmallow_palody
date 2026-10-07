// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import type { NextFetchEvent } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { protect } = vi.hoisted(() => ({ protect: vi.fn() }));
vi.mock("@clerk/nextjs/server", async (importOriginal) => {
  const original = await importOriginal<typeof import("@clerk/nextjs/server")>();
  return {
    ...original,
    clerkMiddleware: (handler: (auth: { protect: typeof protect }, request: NextRequest) => Promise<void>) =>
      async (request: NextRequest) => {
        try {
          await handler({ protect }, request);
          return NextResponse.next();
        } catch {
          return NextResponse.redirect(new URL("/sign-in", request.url));
        }
      },
  };
});
import proxy from "./proxy";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("認証ルート", () => {
  it.each(["/inbox", "/settings", "/inbox/detail", "/settings/profile"])("%sでClerkのサーバー認証を要求する", async (path) => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "configured");
    vi.stubEnv("CLERK_SECRET_KEY", "configured");
    protect.mockRejectedValueOnce(new Error("signed out"));
    const response = await proxy(new NextRequest(`https://example.com${path}`), {} as NextFetchEvent);
    expect(protect).toHaveBeenCalledOnce();
    expect(response?.headers.get("location")).toBe("https://example.com/sign-in");
  });

  it.each(["/", "/u/alice", "/sign-in", "/sign-up"])("%sはログインを要求しない", async (path) => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "configured");
    vi.stubEnv("CLERK_SECRET_KEY", "configured");
    const response = await proxy(new NextRequest(`https://example.com${path}`), {} as NextFetchEvent);
    expect(protect).not.toHaveBeenCalled();
    expect(response?.headers.get("location")).toBeNull();
  });

  it("キーが欠けても認証必須ページを公開しない", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    const response = await proxy(new NextRequest("https://example.com/inbox"), {} as NextFetchEvent);
    expect(response?.headers.get("location")).toBe("https://example.com/sign-in");
  });
});
