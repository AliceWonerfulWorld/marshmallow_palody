import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Page from "./[slug]/page";
const state = vi.hoisted(() => ({ fetch: vi.fn(), composer: vi.fn(), feed: vi.fn() }));
vi.mock("convex/nextjs", () => ({ fetchQuery: state.fetch }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404"); } }));
vi.mock("@/components/question-composer", () => ({ QuestionComposer: (props: unknown) => { state.composer(props); return <div>匿名投稿</div>; } }));
vi.mock("@/components/question-feed", () => ({ QuestionFeed: (props: unknown) => { state.feed(props); return <div>公開feed</div>; } }));
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://example.convex.cloud"); state.fetch.mockReset(); });
afterEach(() => vi.unstubAllEnvs());
it("箱のidentityと共有URLを表示し投稿・feedへ同じboxIdを渡す", async () => {
  state.fetch.mockResolvedValue({ id: "box", name: "部会質問箱", slug: "bukai", description: "部会への質問・お便りはこちら", visibilityMode: "approval" });
  const { container } = render(await Page({ params: Promise.resolve({ slug: "bukai" }) }));
  expect(screen.getByRole("heading", { name: "部会質問箱" })).toBeVisible();
  expect(screen.getByText("部会への質問・お便りはこちら")).toBeVisible();
  expect(screen.getByRole("link")).toHaveAttribute("href", "https://questions.example/b/bukai");
  expect(state.fetch.mock.lastCall?.[1]).toEqual({ slug: "bukai" });
  expect(state.composer).toHaveBeenCalledWith({ boxId: "box", boxKind: "shared", visibilityMode: "approval" });
  expect(state.feed).toHaveBeenCalledWith({ boxId: "box" });
  expect(container.innerHTML).not.toContain("/invite/");
});
it("不存在は404", async () => {
  state.fetch.mockResolvedValue(null);
  await expect(Page({ params: Promise.resolve({ slug: "unknown" }) })).rejects.toThrow("404");
});
it.each(["public", "approval", "private"])("共有ページは%sモードを投稿フォームへ渡す", async visibilityMode => {
  state.fetch.mockResolvedValue({ id: "box", name: "共有箱", slug: "shared", visibilityMode });
  render(await Page({ params: Promise.resolve({ slug: "shared" }) }));
  expect(state.composer).toHaveBeenLastCalledWith({ boxId: "box", boxKind: "shared", visibilityMode });
});
