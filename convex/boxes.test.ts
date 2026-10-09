/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { canManageQuestion, ensureBoxMembership, requireBoxMember, requireBoxOwner, requirePersonalBoxOwner } from "./lib/access";
const modules = import.meta.glob("./**/*.ts");

it("legacy personalを共有箱と区別し、同期で重複させない", async () => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner", name: "Alice" });
  const userId = await owner.mutation(api.users.upsert, {});
  const personal = await owner.query(api.boxes.current, {});
  await t.run(ctx => ctx.db.patch(personal!._id, { kind: undefined }));
  await owner.mutation(api.boxes.createShared, { name: "部会", slug: "bukai" });
  await Promise.all([owner.mutation(api.users.upsert, {}), owner.mutation(api.users.upsert, {})]);
  expect((await owner.query(api.boxes.current, {}))?._id).toBe(personal!._id);
  expect((await t.query(api.profiles.byUsername, { username: "alice" }))?.box.id).toBe(personal!._id);
  await t.run(ctx => ctx.db.delete(personal!._id));
  await Promise.all([owner.mutation(api.users.upsert, {}), owner.mutation(api.users.upsert, {})]);
  const boxes = await t.run(ctx => ctx.db.query("questionBoxes").collect());
  expect(boxes.filter(b => b.kind === "personal")).toHaveLength(1);
  expect(boxes.every(b => b.ownerUserId === userId)).toBe(true);
});

it("共有箱作成とmembershipはatomicかつ一意で、認可はidentityを使う", async () => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner" });
  const member = t.withIdentity({ subject: "member" });
  const outsider = t.withIdentity({ subject: "outsider" });
  const ownerId = await owner.mutation(api.users.upsert, {});
  const memberId = await member.mutation(api.users.upsert, {});
  await outsider.mutation(api.users.upsert, {});
  const boxId = await owner.mutation(api.boxes.createShared, { name: " 部会質問箱 ", slug: "bukai", description: " 説明 " });
  await Promise.all([t.run(ctx => ensureBoxMembership(ctx, boxId, ownerId)), t.run(ctx => ensureBoxMembership(ctx, boxId, ownerId))]);
  await t.run(ctx => ensureBoxMembership(ctx, boxId, memberId));
  await t.run(ctx => ensureBoxMembership(ctx, boxId, memberId));
  expect(await t.run(ctx => ctx.db.query("boxMembers").collect())).toHaveLength(2);
  expect(await t.run(ctx => ctx.db.get(boxId))).toMatchObject({ name: "部会質問箱", description: "説明", ownerUserId: ownerId });
  expect((await owner.run(ctx => requireBoxOwner(ctx, boxId))).role).toBe("owner");
  expect((await member.run(ctx => requireBoxMember(ctx, boxId))).role).toBe("member");
  await expect(member.run(ctx => requireBoxOwner(ctx, boxId))).rejects.toThrow("NOT_FOUND");
  await expect(outsider.run(ctx => requireBoxMember(ctx, boxId))).rejects.toThrow("NOT_FOUND");
  await expect(t.run(ctx => requireBoxMember(ctx, boxId))).rejects.toThrow("UNAUTHENTICATED");
  await expect(owner.run(ctx => requirePersonalBoxOwner(ctx, boxId))).rejects.toThrow("NOT_FOUND");
  const questionId = await t.run(ctx => ctx.db.insert("questions", { boxId, receiverUserId: ownerId, content: "共有", status: "unanswered", visibility: "private", createdAt: 1, updatedAt: 1 }));
  const question = await t.run(ctx => ctx.db.get(questionId));
  expect(await member.run(ctx => canManageQuestion(ctx, question!))).toBe(true);
  expect(await member.run(ctx => canManageQuestion(ctx, question!, "delete"))).toBe(false);
  expect(await owner.run(ctx => canManageQuestion(ctx, question!, "delete"))).toBe(true);
  expect((await owner.query(api.questions.inbox, { status: "unanswered", paginationOpts: { numItems: 10, cursor: null } })).page).toHaveLength(1);
  await owner.mutation(api.questions.remove, { questionId });
});

it("metadata境界と予約slug・重複を拒否する", async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(api.boxes.createShared, { name: "箱", slug: "valid" })).rejects.toThrow("UNAUTHENTICATED");
  const owner = t.withIdentity({ subject: "owner" });
  await owner.mutation(api.users.upsert, {});
  for (const slug of ["ab", "a".repeat(49), "Upper", "日本語", "-abc", "abc-", "a_b", "a b", "abc\n", "abc\r\n", "u", "b", "invite", "boxes", "inbox", "settings", "sign-in", "sign-up", "api", "admin"]) {
    await expect(owner.mutation(api.boxes.createShared, { name: "箱", slug })).rejects.toThrow("INVALID_SLUG");
  }
  for (const name of [" ", "あ".repeat(81)]) {
    await expect(owner.mutation(api.boxes.createShared, { name, slug: "valid" })).rejects.toThrow("INVALID_NAME");
  }
  await expect(owner.mutation(api.boxes.createShared, { name: "箱", slug: "valid", description: "あ".repeat(301) })).rejects.toThrow("INVALID_DESCRIPTION");
  await owner.mutation(api.boxes.createShared, { name: "あ".repeat(80), slug: "a".repeat(48), description: "あ".repeat(300) });
  await owner.mutation(api.boxes.createShared, { name: "箱", slug: "a--b" });
  const attempts = await Promise.allSettled([owner.mutation(api.boxes.createShared, { name: "箱", slug: "abc" }), owner.mutation(api.boxes.createShared, { name: "箱", slug: "abc" })]);
  expect(attempts.filter(r => r.status === "fulfilled")).toHaveLength(1);
  await expect(owner.mutation(api.boxes.createShared, { name: "箱", slug: "abc" })).rejects.toThrow("SLUG_TAKEN");
});


it("共有箱追加後もlegacy Question / Answerと個人APIを維持する", async () => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner", name: "Alice" });
  await owner.mutation(api.users.upsert, {});
  const personal = (await owner.query(api.boxes.current, {}))!;
  await t.run(ctx => ctx.db.patch(personal._id, { kind: undefined }));
  await t.mutation(api.questions.submit, { boxId: personal._id, content: "既存質問", clientId: "anonymous-client-001" });
  const question = (await t.run(ctx => ctx.db.query("questions").unique()))!;
  await owner.mutation(api.answers.create, { questionId: question._id, content: "既存回答" });
  const snapshot = await t.run(async ctx => ({ question: await ctx.db.get(question._id), answers: await ctx.db.query("answers").collect() }));
  await owner.mutation(api.boxes.createShared, { name: "共有", slug: "shared" });
  await owner.mutation(api.users.upsert, {});
  expect(await t.run(async ctx => ({ question: await ctx.db.get(question._id), answers: await ctx.db.query("answers").collect() }))).toEqual(snapshot);
  expect((await owner.run(ctx => requirePersonalBoxOwner(ctx, personal._id))).box._id).toBe(personal._id);
  const paginationOpts = { numItems: 10, cursor: null };
  expect((await owner.query(api.questions.inbox, { status: "answered", paginationOpts })).page.map(q => q._id)).toEqual([question._id]);
  expect((await t.query(api.answers.publicAnswered, { boxId: personal._id, paginationOpts })).page).toEqual([
    { id: question._id, question: "既存質問", answer: "既存回答", answeredAt: snapshot.answers[0].createdAt },
  ]);
  await owner.mutation(api.questions.setVisibility, { questionId: question._id, visibility: "private" });
  expect((await t.query(api.answers.publicAnswered, { boxId: personal._id, paginationOpts })).page).toHaveLength(0);
});

it("共有ownerはmembership必須で、別Userのowner roleを信用しない", async () => {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner" });
  const other = t.withIdentity({ subject: "other" });
  await owner.mutation(api.users.upsert, {});
  const otherId = await other.mutation(api.users.upsert, {});
  const boxId = await owner.mutation(api.boxes.createShared, { name: "共有", slug: "shared" });
  const memberships = await t.run(ctx => ctx.db.query("boxMembers").collect());
  expect(memberships).toHaveLength(1);
  expect(memberships[0]).toMatchObject({ boxId, role: "owner", userId: (await owner.query(api.users.current, {}))!._id });
  await t.run(ctx => ctx.db.delete(memberships[0]._id));
  await expect(owner.run(ctx => requireBoxOwner(ctx, boxId))).rejects.toThrow("NOT_FOUND");
  await t.run(ctx => ctx.db.insert("boxMembers", { boxId, userId: otherId, role: "owner", joinedAt: 1 }));
  await expect(other.run(ctx => requireBoxOwner(ctx, boxId))).rejects.toThrow("NOT_FOUND");
  await expect(other.run(ctx => requireBoxMember(ctx, boxId))).rejects.toThrow("NOT_FOUND");
});
