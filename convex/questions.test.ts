/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");

it.each(["public", "approval", "private"] as const)("%sモードの匿名投稿と保存データ", async mode => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner", name: "Alice" });
  await owner.mutation(api.users.upsert, {});
  const box = await t.run(ctx => ctx.db.query("questionBoxes").unique());
  if (!box) throw new Error("fixture missing");
  await t.run(ctx => ctx.db.patch(box._id, { visibilityMode: mode }));
  await t.mutation(api.questions.submit, { boxId: box._id, content: " a " });
  const row = await t.run(ctx => ctx.db.query("questions").unique());
  expect(row).toMatchObject({ content: "a", status: "unanswered", visibility: mode === "public" ? "public" : "private", receiverUserId: box.ownerUserId });
  expect(Object.keys(row!).sort()).toEqual(["_id", "_creationTime", "boxId", "receiverUserId", "content", "visibility", "status", "createdAt", "updatedAt"].sort());
});
it("trim後1〜1000文字だけ受け付け、存在しない箱への投稿を拒否する", async () => {
  const t = convexTest(schema, modules);
  await t.withIdentity({ subject: "owner" }).mutation(api.users.upsert, {});
  const box = await t.run(ctx => ctx.db.query("questionBoxes").unique());
  if (!box) throw new Error("fixture missing");
  for (const content of ["", "  \n ", "a".repeat(1001)]) {
    await expect(t.mutation(api.questions.submit, { boxId: box._id, content })).rejects.toThrow("INVALID_CONTENT");
  }
  await t.mutation(api.questions.submit, { boxId: box._id, content: "a".repeat(1000) });
  await t.run(ctx => ctx.db.delete(box._id));
  await expect(t.mutation(api.questions.submit, { boxId: box._id, content: "a" })).rejects.toThrow("NOT_FOUND");
});

it("所有者だけ一覧・公開切替・削除ができ、関連回答も削除する", async () => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner" });
  const other = t.withIdentity({ subject: "other" });
  await owner.mutation(api.users.upsert, {});
  await other.mutation(api.users.upsert, {});
  const user = await owner.query(api.users.current, {});
  const box = await t.run(ctx => ctx.db.query("questionBoxes").withIndex("by_owner_user_id", q => q.eq("ownerUserId", user!._id)).unique());
  if (!box) throw new Error("fixture missing");
  await t.mutation(api.questions.submit, { boxId: box._id, content: "only owner sees" });
  const question = await t.run(ctx => ctx.db.query("questions").unique());
  if (!question) throw new Error("fixture missing");
  const args = { status: "unanswered" as const, paginationOpts: { numItems: 20, cursor: null } };
  await expect(t.query(api.questions.inbox, args)).rejects.toThrow("UNAUTHENTICATED");
  expect((await owner.query(api.questions.inbox, args)).page).toHaveLength(1);
  expect((await other.query(api.questions.inbox, args)).page).toHaveLength(0);
  await expect(other.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "public" })).rejects.toThrow("NOT_FOUND");
  await expect(other.mutation(api.questions.remove, { questionId: question._id })).rejects.toThrow("NOT_FOUND");
  await owner.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "public" });
  expect((await t.run(ctx => ctx.db.get(question._id)))?.status).toBe("unanswered");
  await t.run(ctx => ctx.db.insert("answers", { questionId: question._id, authorUserId: user!._id, content: "answer", createdAt: Date.now(), updatedAt: Date.now() }));
  await owner.mutation(api.questions.remove, { questionId: question._id });
  expect(await t.run(ctx => ctx.db.query("questions").collect())).toHaveLength(0);
  expect(await t.run(ctx => ctx.db.query("answers").collect())).toHaveLength(0);
});
