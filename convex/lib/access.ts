import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export type PublicProfile = Pick<Doc<"users">, "username" | "displayName" | "bio" | "imageUrl">;
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("UNAUTHENTICATED");
  const user = await ctx.db.query("users").withIndex("by_clerk_user_id", q => q.eq("clerkUserId", identity.subject)).unique();
  if (!user) throw new ConvexError("USER_NOT_READY");
  return user;
}
export function isPersonalBox(box: Doc<"questionBoxes">) {
  return box.kind === undefined || box.kind === "personal";
}
export async function getPersonalBox(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  return ctx.db.query("questionBoxes")
    .withIndex("by_owner_user_id", q => q.eq("ownerUserId", userId))
    .filter(q => q.or(q.eq(q.field("kind"), undefined), q.eq(q.field("kind"), "personal")))
    .first();
}
export async function ensurePersonalBox(ctx: MutationCtx, userId: Id<"users">) {
  const box = await getPersonalBox(ctx, userId);
  if (box) return box._id;
  const now = Date.now();
  // The indexed read and insert are atomic; conflicting transactions are retried.
  return ctx.db.insert("questionBoxes", { ownerUserId: userId, kind: "personal", visibilityMode: "approval", createdAt: now, updatedAt: now });
}
// Compatibility for existing server callers.
export const ensureBox = ensurePersonalBox;
export async function requirePersonalBoxOwner(ctx: QueryCtx | MutationCtx, boxId: Id<"questionBoxes">) {
  const user = await requireUser(ctx);
  const box = await ctx.db.get(boxId);
  if (!box || !isPersonalBox(box) || box.ownerUserId !== user._id) throw new ConvexError("NOT_FOUND");
  return { user, box };
}
export async function requireBoxMember(ctx: QueryCtx | MutationCtx, boxId: Id<"questionBoxes">) {
  const user = await requireUser(ctx);
  const box = await ctx.db.get(boxId);
  if (!box) throw new ConvexError("NOT_FOUND");
  if (isPersonalBox(box)) {
    if (box.ownerUserId !== user._id) throw new ConvexError("NOT_FOUND");
    return { user, box, role: "owner" as const };
  }
  const member = await ctx.db.query("boxMembers")
    .withIndex("by_box_user", q => q.eq("boxId", boxId).eq("userId", user._id)).unique();
  if (!member || (member.role === "owner" && box.ownerUserId !== user._id)) throw new ConvexError("NOT_FOUND");
  return { user, box, role: member.role };
}
export async function requireBoxOwner(ctx: QueryCtx | MutationCtx, boxId: Id<"questionBoxes">) {
  const access = await requireBoxMember(ctx, boxId);
  if (access.role !== "owner") throw new ConvexError("NOT_FOUND");
  return access;
}
// Server-only primitive. Callers must authenticate/authorize invitations first.
export async function ensureBoxMembership(ctx: MutationCtx, boxId: Id<"questionBoxes">, userId: Id<"users">) {
  const box = await ctx.db.get(boxId);
  if (!box || isPersonalBox(box) || !await ctx.db.get(userId)) throw new ConvexError("NOT_FOUND");
  const role = box.ownerUserId === userId ? "owner" as const : "member" as const;
  const existing = await ctx.db.query("boxMembers")
    .withIndex("by_box_user", q => q.eq("boxId", boxId).eq("userId", userId)).unique();
  if (existing) {
    if (existing.role !== role) await ctx.db.patch(existing._id, { role });
    return existing._id;
  }
  return ctx.db.insert("boxMembers", { boxId, userId, role, joinedAt: Date.now() });
}
export async function canManageQuestion(ctx: QueryCtx | MutationCtx, question: Doc<"questions">, action: "manage" | "delete" = "manage") {
  const access = await requireBoxMember(ctx, question.boxId);
  return action !== "delete" || access.role === "owner";
}
export async function requireOwnedQuestion(ctx: QueryCtx | MutationCtx, id: Id<"questions">) {
  const user = await requireUser(ctx);
  const question = await ctx.db.get(id);
  const box = question ? await ctx.db.get(question.boxId) : null;
  if (!question || !box || !isPersonalBox(box) || box.ownerUserId !== user._id || question.receiverUserId !== user._id) throw new ConvexError("NOT_FOUND");
  return { user, question };
}

export async function requireManageableQuestion(ctx: QueryCtx | MutationCtx, id: Id<"questions">, action: "manage" | "delete" = "manage") {
  const question = await ctx.db.get(id);
  if (!question) { await requireUser(ctx); throw new ConvexError("NOT_FOUND"); }
  const access = await requireBoxMember(ctx, question.boxId);
  if (action === "delete" && access.role !== "owner") throw new ConvexError("NOT_FOUND");
  return { ...access, question };
}
