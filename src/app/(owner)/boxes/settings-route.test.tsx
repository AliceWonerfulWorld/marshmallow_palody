import { beforeEach, expect, it, vi } from "vitest";
import Page from "./[boxId]/settings/page";

const state = vi.hoisted(() => ({ token: vi.fn(), fetch: vi.fn(), notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }) }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ getToken: state.token }) }));
vi.mock("convex/nextjs", () => ({ fetchQuery: state.fetch }));
vi.mock("next/navigation", () => ({ notFound: state.notFound }));
vi.mock("@/components/shared-box-settings", () => ({ SharedBoxSettings: () => null }));
beforeEach(() => { state.token.mockReset().mockResolvedValue("test-token"); state.fetch.mockReset(); state.notFound.mockClear(); });

it.each([null, { role: "member" }])("設定routeは非Ownerを404にしフォームを返さない", async data => {
  state.fetch.mockResolvedValue(data);
  await expect(Page({ params: Promise.resolve({ boxId: "box" }) })).rejects.toThrow("NOT_FOUND");
});
it("Ownerは認証tokenを渡して取得後に設定画面を返す", async () => {
  state.fetch.mockResolvedValue({ role: "owner" });
  const page = await Page({ params: Promise.resolve({ boxId: "box" }) });
  expect(page.props.boxId).toBe("box");
  expect(state.fetch).toHaveBeenCalledWith(expect.anything(), { boxId: "box" }, { token: "test-token" });
});
it("tokenが無い場合はqueryを呼ばず拒否", async () => {
  state.token.mockResolvedValue(null);
  await expect(Page({ params: Promise.resolve({ boxId: "box" }) })).rejects.toThrow("NOT_FOUND");
  expect(state.fetch).not.toHaveBeenCalled();
});
