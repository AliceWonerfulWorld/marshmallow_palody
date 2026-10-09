/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
import { ensureBoxMembership } from "./lib/access";
const modules = import.meta.glob("./**/*.ts");

async function fixture() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner", name: "Alice" });
  const member = t.withIdentity({ subject: "member" });
  const outsider = t.withIdentity({ subject: "outsider" });
  await owner.mutation(api.users.upsert, {});
  const memberId = await member.mutation(api.users.upsert, {});
  await outsider.mutation(api.users.upsert, {});
  const boxId = await owner.mutation(api.boxes.createShared, { name: " 部会質問箱 ", slug: "bukai", visibilityMode: "private" });
  await t.run(ctx => ensureBoxMembership(ctx, boxId, memberId));
  return { t, owner, member, outsider, boxId };
}

it("listMineはpersonal・所有箱・招待参加箱のみを返す", async () => {
  const { t, owner, member, outsider, boxId } = await fixture();
  const second = await owner.mutation(api.boxes.createShared, { name: "別の箱", slug: "another", visibilityMode: "public" });
  const ownerBoxes = await owner.query(api.boxes.listMine, {});
  expect(ownerBoxes.personal?.username).toBe("alice");
  expect(ownerBoxes.shared.map(x => x.box._id).sort()).toEqual([boxId, second].sort());
  expect(ownerBoxes.shared.every(x => x.role === "owner")).toBe(true);
  const memberBoxes = await member.query(api.boxes.listMine, {});
  expect(memberBoxes.personal).not.toBeNull();
  expect(memberBoxes.shared).toHaveLength(1);
  expect(memberBoxes.shared[0]).toMatchObject({ box: { _id: boxId, visibilityMode: "private" }, role: "member" });
  expect(memberBoxes.shared[0].box).not.toHaveProperty("ownerUserId");
  expect((await outsider.query(api.boxes.listMine, {})).shared).toEqual([]);
  await expect(t.query(api.boxes.listMine, {})).rejects.toThrow("UNAUTHENTICATED");
});

it("getForMemberは参加者のみ取得可、不正ID・personal・削除済み・非参加者は非公開", async () => {
  const { t, owner, member, outsider, boxId } = await fixture();
  expect((await member.query(api.boxes.getForMember, { boxId }))?.role).toBe("member");
  expect(await outsider.query(api.boxes.getForMember, { boxId })).toBeNull();
  expect(await owner.query(api.boxes.getForMember, { boxId: "invalid-id" })).toBeNull();
  const personal = (await owner.query(api.boxes.current, {}))!;
  expect(await owner.query(api.boxes.getForMember, { boxId: personal._id })).toBeNull();
  await expect(t.query(api.boxes.getForMember, { boxId })).rejects.toThrow("UNAUTHENTICATED");
  await t.run(ctx => ctx.db.delete(boxId));
  expect(await member.query(api.boxes.getForMember, { boxId })).toBeNull();
  expect((await member.query(api.boxes.listMine, {})).shared).toEqual([]);
});

it("Ownerだけ共有設定を変更可、slugと既存質問を維持しpersonal変更を拒否", async () => {
  const { t, owner, member, outsider, boxId } = await fixture();
  const args = { boxId, name: " 更新名 ", description: " 説明 ", visibilityMode: "public" as const };
  await expect(member.mutation(api.boxes.updateShared, args)).rejects.toThrow("NOT_FOUND");
  await expect(outsider.mutation(api.boxes.updateShared, args)).rejects.toThrow("NOT_FOUND");
  await expect(t.mutation(api.boxes.updateShared, args)).rejects.toThrow("UNAUTHENTICATED");
  await t.mutation(api.questions.submit, { boxId, content: "非公開を維持", clientId: "anonymous-client-001" });
  const question = await t.run(ctx => ctx.db.query("questions").unique());
  const originalBox = await t.run(ctx => ctx.db.get(boxId));
  await owner.mutation(api.boxes.updateShared, args);
  expect((await owner.query(api.boxes.getForMember, { boxId }))?.box).toMatchObject({ name: "更新名", description: "説明", visibilityMode: "public", slug: "bukai" });
  expect((await t.run(ctx => ctx.db.get(boxId)))?.createdAt).toBe(originalBox?.createdAt);
  expect(await t.run(ctx => ctx.db.get(question!._id))).toEqual(question);
  await owner.mutation(api.boxes.updateShared, { ...args, description: "" });
  expect((await owner.query(api.boxes.getForMember, { boxId }))?.box.description).toBe("");
  const personal = (await owner.query(api.boxes.current, {}))!;
  await expect(owner.mutation(api.boxes.updateShared, { ...args, boxId: personal._id })).rejects.toThrow("NOT_FOUND");
  expect(await owner.query(api.boxes.current, {})).toEqual(personal);
  for (const name of [" ", "あ".repeat(81)]) await expect(owner.mutation(api.boxes.updateShared, { ...args, name })).rejects.toThrow("INVALID_NAME");
  await expect(owner.mutation(api.boxes.updateShared, { ...args, description: "あ".repeat(301) })).rejects.toThrow("INVALID_DESCRIPTION");
});
