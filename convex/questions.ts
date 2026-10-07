import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { visibility, questionStatus } from "./schema";
import { requireUser, requireOwnedQuestion } from "./lib/access";
import { mutation, query } from "./_generated/server";

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

export const inbox = query({
  args: { status: questionStatus, paginationOpts: paginationOptsValidator },
  handler: async (ctx, { status, paginationOpts }) => {
    const user = await requireUser(ctx);
    return ctx.db.query("questions").withIndex("by_receiver_status_created", q => q.eq("receiverUserId", user._id).eq("status", status)).order("desc").paginate(paginationOpts);
  },
});
export const setVisibility = mutation({
  args: { questionId: v.id("questions"), visibility },
  handler: async (ctx, args) => {
    await requireOwnedQuestion(ctx, args.questionId);
    await ctx.db.patch(args.questionId, { visibility: args.visibility, updatedAt: Date.now() });
  },
});
export const remove = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, { questionId }) => {
    await requireOwnedQuestion(ctx, questionId);
    const answers = await ctx.db.query("answers").withIndex("by_question_id", q => q.eq("questionId", questionId)).collect();
    for (const answer of answers) await ctx.db.delete(answer._id);
    await ctx.db.delete(questionId);
  },
});
