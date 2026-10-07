import { validatedContent } from "./lib/content";
import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { visibility, questionStatus } from "./schema";
import { requireUser, requireOwnedQuestion } from "./lib/access";
import { mutation, query } from "./_generated/server";

export const submit = mutation({
  args: { boxId: v.id("questionBoxes"), content: v.string(), clientId: v.string() },
  handler: async (ctx, args) => {
    const content = validatedContent(args.content, 1000);
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(args.clientId)) throw new ConvexError("INVALID_CLIENT");
    const box = await ctx.db.get(args.boxId);
    if (!box || !await ctx.db.get(box.ownerUserId)) throw new ConvexError("NOT_FOUND");
    const now = Date.now();
    // Browser IDs are anonymous and resettable; this is a minimal MVP limit.
    const limit = await ctx.db.query("questionRateLimits").withIndex("by_box_client", q => q.eq("boxId", box._id).eq("clientId", args.clientId)).unique();
    const inWindow = limit && now - limit.windowStartedAt < 60_000;
    if (inWindow && limit.count >= 3) throw new ConvexError("RATE_LIMITED");
    if (limit) await ctx.db.patch(limit._id, { windowStartedAt: inWindow ? limit.windowStartedAt : now, count: inWindow ? limit.count + 1 : 1 });
    else await ctx.db.insert("questionRateLimits", { boxId: box._id, clientId: args.clientId, windowStartedAt: now, count: 1 });
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

export const publicUnanswered = query({
  args: { boxId: v.id("questionBoxes"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { boxId, paginationOpts }) => {
    if (!await ctx.db.get(boxId)) return { page: [], isDone: true, continueCursor: "" };
    const result = await ctx.db.query("questions")
      .withIndex("by_box_visibility_status_created", q => q.eq("boxId", boxId).eq("visibility", "public").eq("status", "unanswered"))
      .order("desc").paginate(paginationOpts);
    return { ...result, page: result.page.map(question => ({ id: question._id, content: question.content, createdAt: question.createdAt, status: question.status })) };
  },
});
