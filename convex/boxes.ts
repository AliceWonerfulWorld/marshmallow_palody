import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/access";
import { visibilityMode } from "./schema";

export const current = query({
  args: {},
  handler: async ctx => {
    const user = await requireUser(ctx);
    return ctx.db.query("questionBoxes").withIndex("by_owner_user_id", q => q.eq("ownerUserId", user._id)).unique();
  },
});
export const setMode = mutation({
  args: { boxId: v.id("questionBoxes"), visibilityMode },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const box = await ctx.db.get(args.boxId);
    if (!box || box.ownerUserId !== user._id) throw new ConvexError("NOT_FOUND");
    // Only future posts use this default; existing per-question visibility is preserved.
    await ctx.db.patch(box._id, { visibilityMode: args.visibilityMode, updatedAt: Date.now() });
  },
});
