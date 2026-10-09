import { render, screen } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import Page, { metadata } from "./[token]/page";
const state = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("convex/nextjs", () => ({ fetchAction: state.fetch }));
vi.mock("@/components/invite-accept", () => ({ InviteAccept: () => <button>参加する</button> }));
beforeEach(() => { state.fetch.mockReset(); vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://example.convex.cloud"); vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_example"); vi.stubEnv("CLERK_SECRET_KEY", "sk_test_example"); });
afterEach(() => vi.unstubAllEnvs());
it.each(["invalid", "revoked", "expired", "accepted"])("%s招待は固定メッセージで参加不可", async status => {
  state.fetch.mockResolvedValue({ status });
  const { container } = render(await Page({ params: Promise.resolve({ token: "a".repeat(64) }) }));
  expect(screen.getByRole("alert")).toBeVisible();
  expect(screen.queryByRole("button", { name: "参加する" })).not.toBeInTheDocument();
  expect(container.textContent).not.toContain("a".repeat(64));
});
it("有効tokenの箱名を表示し検索・referrer送信を抑止", async () => {
  state.fetch.mockResolvedValue({ status: "pending", name: "部会", expiresAt: 1000 });
  render(await Page({ params: Promise.resolve({ token: "a".repeat(64) }) }));
  expect(screen.getByRole("heading", { name: "部会に参加しますか？" })).toBeVisible();
  expect(screen.getByRole("button", { name: "参加する" })).toBeVisible();
  expect(metadata.robots).toEqual({ index: false, follow: false });
  expect(metadata.referrer).toBe("no-referrer");
});
