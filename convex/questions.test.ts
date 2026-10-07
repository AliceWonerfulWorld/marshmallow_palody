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
