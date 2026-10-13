/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
const paginationOpts = { numItems: 20, cursor: null };
it.each(["public", "approval", "private"] as const)("共有公開ページ: %sの匿名投稿・Member受信・feed分離・privacy", async visibilityMode => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner-secret" });
  const member = t.withIdentity({ subject: "member-secret" });
  await owner.mutation(api.users.upsert, {});
  await member.mutation(api.users.upsert, {});
  const boxId = await owner.mutation(api.boxes.createShared, { name: "部会質問箱", slug: "bukai", description: "部会への質問・お便りはこちら", visibilityMode });
  const memberUser = await member.query(api.users.current, {});
  await t.run(ctx => ctx.db.insert("boxMembers", { boxId, userId: memberUser!._id, role: "member", joinedAt: 1 }));
  expect(await t.query(api.boxes.publicBySlug, { slug: "bukai" })).toEqual({ id: boxId, name: "部会質問箱", slug: "bukai", description: "部会への質問・お便りはこちら", visibilityMode });
  expect(await t.query(api.boxes.publicBySlug, { slug: "unknown" })).toBeNull();
  const personal = await owner.query(api.boxes.current, {});
  await t.run(ctx => ctx.db.patch(personal!._id, { slug: "personal" }));
  expect(await t.query(api.boxes.publicBySlug, { slug: "personal" })).toBeNull();
  await t.mutation(api.questions.submit, { boxId, content: "匿名の質問", clientId: "anonymous-client-001" });
  const inbox = await member.query(api.questions.inbox, { boxId, status: "unanswered", paginationOpts });
  expect(inbox.page).toHaveLength(1);
  const question = inbox.page[0];
  expect(question.boxId).toBe(boxId);
  expect(Object.keys(await t.run(ctx => ctx.db.get(question._id)) ?? {}).sort()).toEqual(["_creationTime", "_id", "boxId", "content", "createdAt", "receiverUserId", "status", "updatedAt", "visibility"].sort());
  const feed = () => t.query(api.questions.publicUnanswered, { boxId, paginationOpts });
  expect((await feed()).page).toHaveLength(visibilityMode === "public" ? 1 : 0);
  if (visibilityMode === "approval") {
    await member.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "public" });
    expect((await feed()).page).toHaveLength(1);
  }
  expect((await t.query(api.questions.publicUnanswered, { boxId: personal!._id, paginationOpts })).page).toEqual([]);
  await member.mutation(api.answers.create, { questionId: question._id, content: "回答" });
  const answered = await t.query(api.answers.publicAnswered, { boxId, paginationOpts });
  expect(answered.page).toHaveLength(1);
  expect(Object.keys(answered.page[0]).sort()).toEqual(["id", "question", "answer", "answeredAt"].sort());
  expect((await t.query(api.answers.publicAnswered, { boxId: personal!._id, paginationOpts })).page).toEqual([]);
});
