import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Page from "./[username]/page";
const state = vi.hoisted(() => ({ fetch: vi.fn(), composer: vi.fn() }));
vi.mock("convex/nextjs", () => ({ fetchQuery: state.fetch }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404"); } }));
vi.mock("@/components/profile-header", () => ({ ProfileHeader: () => <div>個人プロフィール</div> }));
vi.mock("@/components/question-composer", () => ({ QuestionComposer: (props: unknown) => { state.composer(props); return <div>匿名投稿</div>; } }));
vi.mock("@/components/question-feed", () => ({ QuestionFeed: () => <div>公開feed</div> }));
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://example.convex.cloud"); vi.clearAllMocks(); });
afterEach(() => vi.unstubAllEnvs());
it.each(["public", "approval", "private"])("個人ページは%sモードを投稿フォームへ渡す", async visibilityMode => {
  state.fetch.mockResolvedValue({ profile: { username: "alice" }, box: { id: "box", visibilityMode } });
  render(await Page({ params: Promise.resolve({ username: "alice" }) }));
  expect(state.fetch.mock.lastCall?.[1]).toEqual({ username: "alice" });
  expect(state.composer).toHaveBeenLastCalledWith({ boxId: "box", boxKind: "personal", visibilityMode });
});
