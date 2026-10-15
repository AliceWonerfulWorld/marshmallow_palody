import { ConvexError } from "convex/values";
import { beforeEach, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";
import { submitQuestion } from "./[username]/actions";
const state = vi.hoisted(() => ({ mutation: vi.fn() }));
vi.mock("convex/nextjs", () => ({ fetchMutation: state.mutation }));
beforeEach(() => { state.mutation.mockReset(); });
const boxId = "box" as Id<"questionBoxes">;
it("表示済みのモードをmutationへ渡し変更時は公開情報だけを返す", async () => {
  state.mutation.mockResolvedValue({ visibilityMode: "public" });
  const result = await submitQuestion(boxId, "質問", "anonymous-client-001", "private");
  expect(state.mutation.mock.lastCall?.[1]).toEqual({ boxId, content: "質問", clientId: "anonymous-client-001", expectedVisibilityMode: "private" });
  expect(result).toMatchObject({ ok: false, visibilityMode: "public" });
  expect(result).toHaveProperty("message", expect.stringContaining("まだ送信していません"));
});
it("正常投稿を成功として返す", async () => {
  state.mutation.mockResolvedValue(null);
  expect(await submitQuestion(boxId, "質問", "anonymous-client-001", "approval")).toEqual({ ok: true });
});
it("レート制限の既存メッセージを保つ", async () => {
  state.mutation.mockRejectedValue(new ConvexError("RATE_LIMITED"));
  expect(await submitQuestion(boxId, "質問", "anonymous-client-001", "approval")).toEqual({ ok: false, message: "少し時間をおいてから送信してください" });
});
