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
export async function ensureBox(ctx: MutationCtx, userId: Id<"users">) {
  const box = await ctx.db.query("questionBoxes").withIndex("by_owner_user_id", q => q.eq("ownerUserId", userId)).unique();
  if (box) return box._id;
  const now = Date.now();
  return ctx.db.insert("questionBoxes", { ownerUserId: userId, visibilityMode: "approval", createdAt: now, updatedAt: now });
}
export async function requireOwnedQuestion(ctx: QueryCtx | MutationCtx, id: Id<"questions">) {
  const user = await requireUser(ctx);
  const question = await ctx.db.get(id);
  if (!question || question.receiverUserId !== user._id) throw new ConvexError("NOT_FOUND");
  return { user, question };
}
