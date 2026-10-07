/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
async function fixture() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner" });
  const other = t.withIdentity({ subject: "other" });
  await owner.mutation(api.users.upsert, {}); await other.mutation(api.users.upsert, {});
  const box = await owner.query(api.boxes.current, {});
  if (!box) throw new Error("fixture missing");
  await t.mutation(api.questions.submit, { boxId: box._id, content: "question", clientId: "anonymous-client-001" });
  const question = await t.run(ctx => ctx.db.query("questions").unique());
  if (!question) throw new Error("fixture missing");
  return { t, owner, other, box, question };
}
it("所有者だけ回答でき、本文境界・状態遷移・1対1・公開非公開を保証する", async () => {
  const { t, owner, other, box, question } = await fixture();
  const args = { questionId: question._id, content: " answer " };
  await expect(t.mutation(api.answers.create, args)).rejects.toThrow("UNAUTHENTICATED");
  await expect(other.mutation(api.answers.create, args)).rejects.toThrow("NOT_FOUND");
  for (const content of ["", "  \n ", "a".repeat(2001)]) await expect(owner.mutation(api.answers.create, { ...args, content })).rejects.toThrow("INVALID_CONTENT");
  const list = () => t.query(api.answers.publicAnswered, { boxId: box._id, paginationOpts: { numItems: 20, cursor: null } });
  expect((await list()).page).toHaveLength(0);
  await owner.mutation(api.answers.create, { ...args, content: "a".repeat(2000) });
  expect(await t.run(ctx => ctx.db.get(question._id))).toMatchObject({ status: "answered", visibility: "public" });
  await expect(owner.mutation(api.answers.create, args)).rejects.toThrow("ALREADY_ANSWERED");
  expect(await t.run(ctx => ctx.db.query("answers").collect())).toHaveLength(1);
  expect((await list()).page).toHaveLength(1);
  await owner.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "private" });
  expect((await list()).page).toHaveLength(0);
  await owner.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "public" });
  await t.run(ctx => ctx.db.delete(question._id));
  expect((await list()).page).toHaveLength(0);
});
it("trim後1文字を受け付け、既存Answerがある未回答Questionへの重複回答を拒否する", async () => {
  const { t, owner, question } = await fixture();
  await owner.mutation(api.answers.create, { questionId: question._id, content: " a " });
  expect((await t.run(ctx => ctx.db.query("answers").unique()))?.content).toBe("a");
  await t.run(ctx => ctx.db.patch(question._id, { status: "unanswered" }));
  await expect(owner.mutation(api.answers.create, { questionId: question._id, content: "second" })).rejects.toThrow("ALREADY_ANSWERED");
});
