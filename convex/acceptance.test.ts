/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
const paginationOpts = { numItems: 20, cursor: null };

it.each(["public", "approval", "private"] as const)("部会の通しシナリオ: %s → 匿名投稿 → Inbox → 公開管理 → 回答 → 非公開 → 削除", async visibilityMode => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner-id", name: "Owner", preferredUsername: "owner" });
  const stranger = t.withIdentity({ subject: "stranger-id", name: "Stranger", email: "private@example.com", preferredUsername: "stranger" });
  await owner.mutation(api.users.upsert, {});
  await owner.mutation(api.users.upsert, {});
  await stranger.mutation(api.users.upsert, {});
  const profile = await t.query(api.profiles.byUsername, { username: "owner" });
  const box = await owner.query(api.boxes.current, {});
  if (!box || !profile) throw new Error("missing fixture");
  expect(profile.box.id).toBe(box._id);
  expect(await t.run(ctx => ctx.db.query("questionBoxes").collect())).toHaveLength(2);
  await owner.mutation(api.boxes.setMode, { boxId: box._id, visibilityMode });
  // Unauthenticated posting and authenticated posting both remain anonymous.
  await t.mutation(api.questions.submit, { boxId: box._id, content: "未ログインからの質問", clientId: "private-browser-0001" });
  await stranger.mutation(api.questions.submit, { boxId: box._id, content: "ログイン中でも匿名", clientId: "another-browser-0002" });
  const unanswered = () => t.query(api.questions.publicUnanswered, { boxId: box._id, paginationOpts });
  const answered = () => t.query(api.answers.publicAnswered, { boxId: box._id, paginationOpts });
  expect((await unanswered()).page).toHaveLength(visibilityMode === "public" ? 2 : 0);
  const inbox = await owner.query(api.questions.inbox, { status: "unanswered", paginationOpts });
  expect(inbox.page).toHaveLength(2);
  expect((await stranger.query(api.questions.inbox, { status: "unanswered", paginationOpts })).page).toEqual([]);
  const question = inbox.page.find(row => row.content === "ログイン中でも匿名")!;
  expect(Object.keys(question).sort()).toEqual(["boxName", "canDelete", "_id", "_creationTime", "boxId", "receiverUserId", "content", "visibility", "status", "createdAt", "updatedAt"].sort());
  await expect(stranger.mutation(api.answers.create, { questionId: question._id, content: "wrong owner" })).rejects.toThrow("NOT_FOUND");
  await owner.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "public" });
  expect((await unanswered()).page.some(row => row.id === question._id)).toBe(true);
  await owner.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "private" });
  expect((await unanswered()).page.some(row => row.id === question._id)).toBe(false);
  await owner.mutation(api.answers.create, { questionId: question._id, content: "部会での回答" });
  expect((await owner.query(api.questions.inbox, { status: "unanswered", paginationOpts })).page).toHaveLength(1);
  expect((await owner.query(api.questions.inbox, { status: "answered", paginationOpts })).page).toHaveLength(1);
  expect((await answered()).page).toEqual([{ id: question._id, question: "ログイン中でも匿名", answer: "部会での回答", answeredAt: expect.any(Number) }]);
  const publicPayload = JSON.stringify([await unanswered(), await answered()]);
  for (const value of ["stranger-id", "Stranger", "stranger", "private@example.com", "another-browser-0002", "receiverUserId", "authorUserId", "rawIp"]) expect(publicPayload).not.toContain(value);
  await owner.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "private" });
  expect((await answered()).page).toEqual([]);
  await owner.mutation(api.questions.remove, { questionId: question._id });
  expect(await t.run(ctx => ctx.db.get(question._id))).toBeNull();
  expect(await t.run(ctx => ctx.db.query("answers").collect())).toEqual([]);
});
