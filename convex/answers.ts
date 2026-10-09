import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireManageableQuestion } from "./lib/access";
import { validatedContent } from "./lib/content";

export const create = mutation({
  args: { questionId: v.id("questions"), content: v.string() },
  handler: async (ctx, args) => {
    const { user, question } = await requireManageableQuestion(ctx, args.questionId);
    const content = validatedContent(args.content, 2000);
    const existing = await ctx.db.query("answers").withIndex("by_question_id", q => q.eq("questionId", question._id)).unique();
    if (question.status !== "unanswered" || existing) throw new ConvexError("ALREADY_ANSWERED");
    const now = Date.now();
    await ctx.db.insert("answers", { questionId: question._id, authorUserId: user._id, content, createdAt: now, updatedAt: now });
    await ctx.db.patch(question._id, { status: "answered", visibility: "public", updatedAt: now });
  },
});
export const publicAnswered = query({
  args: { boxId: v.id("questionBoxes"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { boxId, paginationOpts }) => {
    const box = await ctx.db.get(boxId);
    if (!box) return { page: [], isDone: true, continueCursor: "" };
    const result = await ctx.db.query("questions").withIndex("by_box_visibility_status_created", q => q.eq("boxId", boxId).eq("visibility", "public").eq("status", "answered")).order("desc").paginate(paginationOpts);
    const entries = await Promise.all(result.page.map(async question => {
      const answer = await ctx.db.query("answers").withIndex("by_question_id", q => q.eq("questionId", question._id)).unique();
      if (!answer) return null;
      return { id: question._id, question: question.content, answer: answer.content, answeredAt: answer.createdAt };
    }));
    // Private questions and orphan answers never leave the backend.
    return { ...result, page: entries.filter(entry => entry !== null) };
  },
});
