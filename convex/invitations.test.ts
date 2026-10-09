/// <reference types="vite/client" />
// @vitest-environment node
import { createHash } from "node:crypto";
import { convexTest } from "convex-test";
import { expect, it, vi } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
async function fixture() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: "owner" });
  const member = t.withIdentity({ subject: "member" });
  const other = t.withIdentity({ subject: "other" });
  const ownerId = await owner.mutation(api.users.upsert, {});
  const memberId = await member.mutation(api.users.upsert, {});
  await other.mutation(api.users.upsert, {});
  const boxId = await owner.mutation(api.boxes.createShared, { name: "部会", slug: "bukai" });
  const invite = await owner.action(api.invitationTokens.create, { boxId });
  return { t, owner, member, other, ownerId, memberId, boxId, invite };
}
it("256bit tokenはハッシュだけ保存し7日失効、公開previewとOwner一覧に秘密を返さない", async () => {
  const { t, owner, boxId, invite } = await fixture();
  expect(invite.token).toMatch(/^[a-f0-9]{64}$/);
  const rows = await t.run(ctx => ctx.db.query("boxInvitations").collect());
  expect(rows[0].tokenHash).toBe(createHash("sha256").update(invite.token).digest("hex"));
  expect(JSON.stringify(rows)).not.toContain(invite.token);
  expect(rows[0].expiresAt - rows[0].createdAt).toBe(7 * 24 * 60 * 60 * 1000);
  expect(await t.action(api.invitationTokens.inspect, { token: invite.token })).toEqual({ status: "pending", name: "部会", expiresAt: invite.expiresAt });
  const pending = await owner.query(api.invitations.pending, { boxId });
  expect(pending).toHaveLength(1);
  expect(pending[0]).not.toHaveProperty("tokenHash");
  expect(await t.action(api.invitationTokens.inspect, { token: "invalid" })).toEqual({ status: "invalid" });
});
it("未認証・Memberの招待発行/失効/削除を拒否しpersonalにも適用しない", async () => {
  const { t, owner, member, boxId, invite, ownerId } = await fixture();
  await expect(t.action(api.invitationTokens.create, { boxId })).rejects.toThrow("UNAUTHENTICATED");
  await expect(t.action(api.invitationTokens.accept, { token: invite.token })).rejects.toThrow("UNAUTHENTICATED");
  await member.action(api.invitationTokens.accept, { token: invite.token });
  await expect(member.action(api.invitationTokens.create, { boxId })).rejects.toThrow("NOT_FOUND");
  const second = await owner.action(api.invitationTokens.create, { boxId });
  const pending = await owner.query(api.invitations.pending, { boxId });
  await expect(member.mutation(api.invitations.revoke, { invitationId: pending[0].id })).rejects.toThrow("NOT_FOUND");
  await expect(member.query(api.invitations.pending, { boxId })).rejects.toThrow("NOT_FOUND");
  await expect(member.mutation(api.invitations.removeMember, { boxId, userId: ownerId })).rejects.toThrow("NOT_FOUND");
  const personal = (await owner.query(api.boxes.current, {}))!;
  await expect(owner.action(api.invitationTokens.create, { boxId: personal._id })).rejects.toThrow("NOT_FOUND");
  expect(second.token).not.toBe(invite.token);
});
it("受諾は一意・1人限定、Owner/既存Memberはリンクを消費しない", async () => {
  const { t, owner, member, other, boxId, invite } = await fixture();
  expect(await owner.action(api.invitationTokens.accept, { token: invite.token })).toBe(boxId);
  expect((await t.action(api.invitationTokens.inspect, { token: invite.token })).status).toBe("pending");
  await Promise.all([member.action(api.invitationTokens.accept, { token: invite.token }), member.action(api.invitationTokens.accept, { token: invite.token })]);
  expect((await member.query(api.boxes.listMine, {})).shared).toHaveLength(1);
  expect(await t.run(ctx => ctx.db.query("boxMembers").collect())).toHaveLength(2);
  await expect(other.action(api.invitationTokens.accept, { token: invite.token })).rejects.toThrow("INVITE_ACCEPTED");
  const next = await owner.action(api.invitationTokens.create, { boxId });
  await member.action(api.invitationTokens.accept, { token: next.token });
  expect((await t.action(api.invitationTokens.inspect, { token: next.token })).status).toBe("pending");
  const attempts = await Promise.allSettled([other.action(api.invitationTokens.accept, { token: next.token }), owner.action(api.invitationTokens.accept, { token: next.token })]);
  expect(attempts[0].status).toBe("fulfilled");
});
it("失効・期限境界・不存在を拒否する", async () => {
  const { t, owner, member, boxId, invite } = await fixture();
  const pending = await owner.query(api.invitations.pending, { boxId });
  await owner.mutation(api.invitations.revoke, { invitationId: pending[0].id });
  await owner.mutation(api.invitations.revoke, { invitationId: pending[0].id });
  expect((await t.action(api.invitationTokens.inspect, { token: invite.token })).status).toBe("revoked");
  await expect(member.action(api.invitationTokens.accept, { token: invite.token })).rejects.toThrow("INVITE_REVOKED");
  const next = await owner.action(api.invitationTokens.create, { boxId });
  const clock = vi.spyOn(Date, "now").mockReturnValue(next.expiresAt);
  try {
    expect((await t.action(api.invitationTokens.inspect, { token: next.token })).status).toBe("expired");
    await expect(member.action(api.invitationTokens.accept, { token: next.token })).rejects.toThrow("INVITE_EXPIRED");
  } finally { clock.mockRestore(); }
  await expect(member.action(api.invitationTokens.accept, { token: "0".repeat(64) })).rejects.toThrow("INVITE_INVALID");
});
it("Member削除後は即取得拒否・旧招待再利用不可で、過去の回答を残す", async () => {
  const { t, owner, member, ownerId, memberId, boxId, invite } = await fixture();
  await member.action(api.invitationTokens.accept, { token: invite.token });
  const questionId = await t.run(ctx => ctx.db.insert("questions", { boxId, receiverUserId: ownerId, content: "q", visibility: "private", status: "answered", createdAt: 1, updatedAt: 1 }));
  const answerId = await t.run(ctx => ctx.db.insert("answers", { questionId, authorUserId: memberId, content: "a", createdAt: 1, updatedAt: 1 }));
  expect((await member.query(api.invitations.members, { boxId }))?.members).toHaveLength(2);
  await expect(owner.mutation(api.invitations.removeMember, { boxId, userId: ownerId })).rejects.toThrow("CANNOT_REMOVE_OWNER");
  await owner.mutation(api.invitations.removeMember, { boxId, userId: memberId });
  expect(await member.query(api.invitations.members, { boxId })).toBeNull();
  expect(await member.query(api.boxes.getForMember, { boxId })).toBeNull();
  expect((await member.query(api.boxes.listMine, {})).shared).toHaveLength(0);
  await expect(member.action(api.invitationTokens.accept, { token: invite.token })).rejects.toThrow("INVITE_ACCEPTED");
  expect(await t.run(ctx => ctx.db.get(answerId))).not.toBeNull();
  const ownerMembers = await owner.query(api.invitations.members, { boxId });
  expect(ownerMembers?.members[0]).not.toHaveProperty("clerkUserId");
});
it("異なるUserの同時受諾は1人だけ成功し、inviteとmembershipが一致する", async () => {
  const { t, member, other, invite, boxId } = await fixture();
  const attempts = await Promise.allSettled([member.action(api.invitationTokens.accept, { token: invite.token }), other.action(api.invitationTokens.accept, { token: invite.token })]);
  expect(attempts.filter(result => result.status === "fulfilled")).toHaveLength(1);
  const inviteRow = (await t.run(ctx => ctx.db.query("boxInvitations").unique()))!;
  const rows = await t.run(ctx => ctx.db.query("boxMembers").withIndex("by_box_joined", q => q.eq("boxId", boxId)).collect());
  expect(rows).toHaveLength(2);
  expect(rows.find(row => row.role === "member")?.userId).toBe(inviteRow.acceptedByUserId);
});
