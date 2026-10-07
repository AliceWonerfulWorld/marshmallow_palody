import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";

export const submit = mutation({
  args: { boxId: v.id("questionBoxes"), content: v.string() },
  handler: async (ctx, args) => {
    const content = args.content.trim();
    if (content.length < 1 || content.length > 1000) throw new ConvexError("INVALID_CONTENT");
    const box = await ctx.db.get(args.boxId);
    if (!box || !await ctx.db.get(box.ownerUserId)) throw new ConvexError("NOT_FOUND");
    const now = Date.now();
    await ctx.db.insert("questions", {
      boxId: box._id, receiverUserId: box.ownerUserId, content,
      visibility: box.visibilityMode === "public" ? "public" : "private",
      status: "unanswered", createdAt: now, updatedAt: now,
    });
    return null;
  },
});
