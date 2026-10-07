import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { requireOwnedQuestion } from "./lib/access";
import { validatedContent } from "./lib/content";

export const create = mutation({
  args: { questionId: v.id("questions"), content: v.string() },
  handler: async (ctx, args) => {
    const { user, question } = await requireOwnedQuestion(ctx, args.questionId);
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
    const result = await ctx.db.query("answers").withIndex("by_author_created", q => q.eq("authorUserId", box.ownerUserId)).order("desc").paginate(paginationOpts);
    const entries = await Promise.all(result.page.map(async answer => {
      const question = await ctx.db.get(answer.questionId);
      if (!question || question.boxId !== boxId || question.receiverUserId !== box.ownerUserId || question.visibility !== "public" || question.status !== "answered") return null;
      return { id: question._id, question: question.content, answer: answer.content, answeredAt: answer.createdAt };
    }));
    // Private questions and orphan answers never leave the backend.
    return { ...result, page: entries.filter(entry => entry !== null) };
  },
});
