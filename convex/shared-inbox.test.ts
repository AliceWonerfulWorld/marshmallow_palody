/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import type { FunctionReturnType } from "convex/server";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
const paginationOpts = { numItems: 20, cursor: null };
async function fixture() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner" });
  const member = t.withIdentity({ subject: "member" });
  const outsider = t.withIdentity({ subject: "outsider" });
  for (const user of [owner, member, outsider]) await user.mutation(api.users.upsert, {});
  const boxId = await owner.mutation(api.boxes.createShared, { name: "部会質問箱", slug: "shared-inbox" });
  const memberUser = await member.query(api.users.current, {});
  await t.run(ctx => ctx.db.insert("boxMembers", { boxId, userId: memberUser!._id, role: "member", joinedAt: Date.now() }));
  const personal = await owner.query(api.boxes.current, {});
  await t.mutation(api.questions.submit, { boxId, content: "shared secret", clientId: "anonymous-client-001" });
  await t.mutation(api.questions.submit, { boxId: personal!._id, content: "personal secret", clientId: "anonymous-client-001" });
  const questions = await t.run(ctx => ctx.db.query("questions").collect());
  return { t, owner, member, outsider, boxId, memberUser: memberUser!, personal: personal!, question: questions.find(q => q.boxId === boxId)! };
}
it("共有InboxはMemberにprivateを返し、箱filterとpersonal認可を維持する", async () => {
  const { t, owner, member, outsider, boxId, personal, question } = await fixture();
  const args = { status: "unanswered" as const, paginationOpts };
  expect((await owner.query(api.questions.inbox, args)).page).toHaveLength(2);
  expect((await member.query(api.questions.inbox, args)).page).toMatchObject([{ content: "shared secret", visibility: "private", boxName: "部会質問箱", canDelete: false }]);
  expect((await owner.query(api.questions.inbox, { ...args, boxId })).page).toMatchObject([{ canDelete: true }]);
  expect((await owner.query(api.questions.inbox, { ...args, boxId: personal._id })).page).toMatchObject([{ content: "personal secret", boxName: "個人の質問箱" }]);
  expect((await outsider.query(api.questions.inbox, args)).page).toEqual([]);
  for (const id of [boxId, personal._id]) await expect(outsider.query(api.questions.inbox, { ...args, boxId: id })).rejects.toThrow("NOT_FOUND");
  await expect(member.query(api.questions.inbox, { ...args, boxId: personal._id })).rejects.toThrow("NOT_FOUND");
  await expect(outsider.mutation(api.questions.remove, { questionId: question._id })).rejects.toThrow("NOT_FOUND");
  await expect(outsider.mutation(api.answers.create, { questionId: question._id, content: "answer" })).rejects.toThrow("NOT_FOUND");
  await expect(outsider.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "public" })).rejects.toThrow("NOT_FOUND");
  expect((await t.query(api.questions.publicUnanswered, { boxId, paginationOpts })).page).toEqual([]);
});
it("OwnerとMemberの公開切替・回答、実際の回答者、Ownerのみ削除を保証する", async () => {
  const { t, owner, member, boxId, memberUser, question } = await fixture();
  // receiverUserId is not the shared-box authorization source.
  await t.run(ctx => ctx.db.patch(question._id, { receiverUserId: memberUser._id }));
  for (const user of [owner, member]) {
    await user.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "public" });
    expect((await t.query(api.questions.publicUnanswered, { boxId, paginationOpts })).page).toHaveLength(1);
    await user.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "private" });
    expect((await t.query(api.questions.publicUnanswered, { boxId, paginationOpts })).page).toEqual([]);
  }
  await member.mutation(api.answers.create, { questionId: question._id, content: "member answer" });
  expect(await t.run(ctx => ctx.db.query("answers").unique())).toMatchObject({ authorUserId: memberUser._id });
  const publicResult = await t.query(api.answers.publicAnswered, { boxId, paginationOpts });
  expect(publicResult.page).toMatchObject([{ answer: "member answer" }]);
  expect(publicResult.page[0]).not.toHaveProperty("authorUserId");
  await member.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "private" });
  expect((await t.query(api.answers.publicAnswered, { boxId, paginationOpts })).page).toEqual([]);
  await expect(member.mutation(api.questions.remove, { questionId: question._id })).rejects.toThrow("NOT_FOUND");
  await owner.mutation(api.questions.remove, { questionId: question._id });
  expect(await t.run(ctx => ctx.db.get(question._id))).toBeNull();
  expect(await t.run(ctx => ctx.db.query("answers").collect())).toEqual([]);
});
it("複数Memberの同時回答は1件のみ成功する", async () => {
  const { t, owner, member, question } = await fixture();
  const results = await Promise.allSettled([owner, member].map(user => user.mutation(api.answers.create, { questionId: question._id, content: "answer" })));
  expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
  expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
  expect(await t.run(ctx => ctx.db.query("answers").collect())).toHaveLength(1);
});
it("全箱のページングは同時刻の質問も重複・欠落なく返す", async () => {
  const { t, owner, boxId, personal } = await fixture();
  await t.run(async ctx => {
    for (let i = 0; i < 9; i++) await ctx.db.insert("questions", { boxId: i % 2 ? boxId : personal._id, receiverUserId: personal.ownerUserId, content: `question ${i}`, visibility: "private", status: "unanswered", createdAt: 123, updatedAt: 123 });
  });
  const ids: string[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 10; i++) {
    const result: FunctionReturnType<typeof api.questions.inbox> = await owner.query(api.questions.inbox, { status: "unanswered", paginationOpts: { numItems: 2, cursor } });
    ids.push(...result.page.map(q => q._id));
    cursor = result.continueCursor;
    if (result.isDone) break;
  }
  expect(ids).toHaveLength(11);
  expect(new Set(ids).size).toBe(11);
});

it("Membershipを失うと保存済みcursorでも共有質問を取得・操作できない", async () => {
  const { t, member, boxId, memberUser, question } = await fixture();
  const first = await member.query(api.questions.inbox, { status: "unanswered", paginationOpts });
  await t.run(async ctx => {
    const membership = await ctx.db.query("boxMembers").withIndex("by_box_user", q => q.eq("boxId", boxId).eq("userId", memberUser._id)).unique();
    await ctx.db.delete(membership!._id);
  });
  expect((await member.query(api.questions.inbox, { status: "unanswered", paginationOpts: { numItems: 20, cursor: first.continueCursor } })).page).toEqual([]);
  await expect(member.query(api.questions.inbox, { boxId, status: "unanswered", paginationOpts })).rejects.toThrow("NOT_FOUND");
  await expect(member.mutation(api.answers.create, { questionId: question._id, content: "answer" })).rejects.toThrow("NOT_FOUND");
  await expect(member.query(api.questions.inbox, { status: "unanswered", paginationOpts: { numItems: 20, cursor: "[]" } })).rejects.toThrow("INVALID_CURSOR");
});

it("拡大したInbox windowは削除・回答・新規投稿後も重複や欠落なく最新の順序を返す", async () => {
  const { t, owner, boxId, personal } = await fixture();
  await t.run(async ctx => {
    for (let i = 0; i < 125; i++) await ctx.db.insert("questions", { boxId: i % 2 ? boxId : personal._id, receiverUserId: personal.ownerUserId, content: `row ${i}`, visibility: "private", status: "unanswered", createdAt: 100 + i, updatedAt: 100 + i });
  });
  const list = (numItems: number) => owner.query(api.questions.inbox, { status: "unanswered", paginationOpts: { numItems, cursor: null } });
  const first = await list(20);
  expect(first.page).toHaveLength(20);
  const expanded = await list(120);
  expect(expanded.page).toHaveLength(120);
  expect(expanded.page.slice(0, 20)).toEqual(first.page);
  await owner.mutation(api.questions.remove, { questionId: expanded.page[0]._id });
  await owner.mutation(api.answers.create, { questionId: expanded.page[1]._id, content: "answer" });
  await t.mutation(api.questions.submit, { boxId, content: "newest", clientId: "anonymous-client-002" });
  const refreshed = await list(120);
  const expected = await t.run(ctx => ctx.db.query("questions").collect());
  const ids = expected.filter(q => q.status === "unanswered").sort((a, b) => b.createdAt - a.createdAt || b._creationTime - a._creationTime || (a._id < b._id ? 1 : -1)).slice(0, 120).map(q => q._id);
  expect(refreshed.page.map(q => q._id)).toEqual(ids);
  expect(new Set(refreshed.page.map(q => q._id)).size).toBe(120);
  expect(refreshed.page[0].content).toBe("newest");
  expect(refreshed.isDone).toBe(false);
});
