import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { ensureBoxMembership, isPersonalBox, requireBoxMember, requireBoxOwner, requireUser } from "./lib/access";

export const issue = internalMutation({
  args: { boxId: v.id("questionBoxes"), tokenHash: v.string() },
  handler: async (ctx, { boxId, tokenHash }) => {
    const { user, box } = await requireBoxOwner(ctx, boxId);
    if (isPersonalBox(box)) throw new ConvexError("NOT_FOUND");
    if (!/^[a-f0-9]{64}$/.test(tokenHash)) throw new ConvexError("INVALID_TOKEN_HASH");
    if (await ctx.db.query("boxInvitations").withIndex("by_token_hash", q => q.eq("tokenHash", tokenHash)).unique()) throw new ConvexError("TOKEN_COLLISION");
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    await ctx.db.insert("boxInvitations", { boxId, invitedByUserId: user._id, tokenHash, status: "pending", expiresAt, createdAt: now });
    return { expiresAt };
  },
});

export const inspectHash = internalQuery({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const invite = await ctx.db.query("boxInvitations").withIndex("by_token_hash", q => q.eq("tokenHash", tokenHash)).unique();
    if (!invite) return { status: "invalid" as const };
    if (invite.status !== "pending") return { status: invite.status };
    if (invite.expiresAt <= Date.now()) return { status: "expired" as const };
    const box = await ctx.db.get(invite.boxId);
    if (!box || isPersonalBox(box)) return { status: "invalid" as const };
    return { status: "pending" as const, name: box.name, expiresAt: invite.expiresAt };
  },
});

export const acceptHash = internalMutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const user = await requireUser(ctx);
    const invite = await ctx.db.query("boxInvitations").withIndex("by_token_hash", q => q.eq("tokenHash", tokenHash)).unique();
    if (!invite) throw new ConvexError("INVITE_INVALID");
    if (invite.status === "revoked") throw new ConvexError("INVITE_REVOKED");
    const box = await ctx.db.get(invite.boxId);
    if (!box || isPersonalBox(box)) throw new ConvexError("INVITE_INVALID");
    const existing = await ctx.db.query("boxMembers").withIndex("by_box_user", q => q.eq("boxId", box._id).eq("userId", user._id)).unique();
    if (invite.status === "accepted") {
      // Retrying the successful acceptance is safe, but removal must not allow rejoining.
      if (invite.acceptedByUserId === user._id && existing) return box._id;
      throw new ConvexError("INVITE_ACCEPTED");
    }
    if (invite.expiresAt <= Date.now()) throw new ConvexError("INVITE_EXPIRED");
    if (existing) return box._id; // Existing members do not consume someone else's invite.
    if (box.ownerUserId === user._id) throw new ConvexError("NOT_FOUND");
    await ensureBoxMembership(ctx, box._id, user._id);
    await ctx.db.patch(invite._id, { status: "accepted", acceptedAt: Date.now(), acceptedByUserId: user._id });
    return box._id;
  },
});

export const members = query({
  args: { boxId: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const boxId = ctx.db.normalizeId("questionBoxes", args.boxId);
    if (!boxId) return null;
    let access;
    try { access = await requireBoxMember(ctx, boxId); }
    catch (error) {
      if (error instanceof ConvexError && error.data === "NOT_FOUND") return null;
      throw error;
    }
    if (isPersonalBox(access.box)) return null;
    const rows = await ctx.db.query("boxMembers").withIndex("by_box_joined", q => q.eq("boxId", boxId)).collect();
    const members = await Promise.all(rows.map(async row => {
      const user = await ctx.db.get(row.userId);
      if (!user) return null;
      return { userId: user._id, displayName: user.displayName, role: row.role, isSelf: user._id === access.user._id };
    }));
    return { boxId, name: access.box.name, role: access.role, members: members.filter(row => row !== null) };
  },
});

export const pending = query({
  args: { boxId: v.id("questionBoxes") },
  handler: async (ctx, { boxId }) => {
    const { box } = await requireBoxOwner(ctx, boxId);
    if (isPersonalBox(box)) throw new ConvexError("NOT_FOUND");
    const invites = await ctx.db.query("boxInvitations").withIndex("by_box_status_created", q => q.eq("boxId", boxId).eq("status", "pending")).order("desc").collect();
    // Include expired pending rows so owners can see and revoke them; never return hashes.
    return invites.map(invite => ({ id: invite._id, createdAt: invite.createdAt, expiresAt: invite.expiresAt }));
  },
});

export const revoke = mutation({
  args: { invitationId: v.id("boxInvitations") },
  handler: async (ctx, { invitationId }) => {
    const invite = await ctx.db.get(invitationId);
    if (!invite) { await requireUser(ctx); throw new ConvexError("NOT_FOUND"); }
    const { box } = await requireBoxOwner(ctx, invite.boxId);
    if (isPersonalBox(box)) throw new ConvexError("NOT_FOUND");
    if (invite.status === "revoked") return;
    if (invite.status !== "pending") throw new ConvexError("INVITE_ACCEPTED");
    await ctx.db.patch(invite._id, { status: "revoked" });
  },
});

export const removeMember = mutation({
  args: { boxId: v.id("questionBoxes"), userId: v.id("users") },
  handler: async (ctx, { boxId, userId }) => {
    const { box } = await requireBoxOwner(ctx, boxId);
    if (isPersonalBox(box)) throw new ConvexError("NOT_FOUND");
    if (box.ownerUserId === userId) throw new ConvexError("CANNOT_REMOVE_OWNER");
    const member = await ctx.db.query("boxMembers").withIndex("by_box_user", q => q.eq("boxId", boxId).eq("userId", userId)).unique();
    if (!member) return;
    if (member.role !== "member") throw new ConvexError("CANNOT_REMOVE_OWNER");
    await ctx.db.delete(member._id); // Answers authored by this member are retained.
  },
});
