import { validatedContent } from "./lib/content";
import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { visibility, questionStatus } from "./schema";
import { getPersonalBox, isPersonalBox, requireBoxMember, requireUser, requireManageableQuestion } from "./lib/access";
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
  args: { status: questionStatus, boxId: v.optional(v.id("questionBoxes")), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { status, boxId, paginationOpts }) => {
    const user = await requireUser(ctx);
    const personal = await getPersonalBox(ctx, user._id);
    const memberships = await ctx.db.query("boxMembers").withIndex("by_user_joined", q => q.eq("userId", user._id)).collect();
    const shared = await Promise.all(memberships.map(async member => {
      const box = await ctx.db.get(member.boxId);
      return box && !isPersonalBox(box) && (member.role !== "owner" || box.ownerUserId === user._id) ? { box, role: member.role } : null;
    }));
    const accessible = [...(personal ? [{ box: personal, role: "owner" as const }] : []), ...shared.filter(entry => entry !== null)];
    if (boxId) await requireBoxMember(ctx, boxId);
    const boxes = boxId ? accessible.filter(entry => entry.box._id === boxId) : accessible;
    // Bounded reads on each authorized box; keyset cursors avoid Convex's
    // single-paginate-per-function limit when merging multiple boxes.
    type Boundary = { createdAt: number; creationTime: number; id: string };
    let boundary: Boundary | null = null;
    if (paginationOpts.cursor) {
      try { boundary = JSON.parse(paginationOpts.cursor); }
      catch { throw new ConvexError("INVALID_CURSOR"); }
      if (!boundary || typeof boundary.createdAt !== "number" || !Number.isFinite(boundary.createdAt) || typeof boundary.creationTime !== "number" || !Number.isFinite(boundary.creationTime) || typeof boundary.id !== "string") throw new ConvexError("INVALID_CURSOR");
    }
    const count = Math.max(1, Math.min(paginationOpts.numItems, 100));
    const batches = await Promise.all(boxes.map(async ({ box, role }) => {
      const query = ctx.db.query("questions").withIndex("by_box_status_created", q => {
        const range = q.eq("boxId", box._id).eq("status", status);
        return boundary ? range.lte("createdAt", boundary.createdAt) : range;
      }).order("desc");
      const rows = await (boundary ? query.filter(q => q.or(
        q.lt(q.field("createdAt"), boundary!.createdAt),
        q.and(q.eq(q.field("createdAt"), boundary!.createdAt), q.lt(q.field("_creationTime"), boundary!.creationTime)),
        q.and(q.eq(q.field("createdAt"), boundary!.createdAt), q.eq(q.field("_creationTime"), boundary!.creationTime), q.lt(q.field("_id"), boundary!.id)),
      )) : query).take(count + 1);
      return rows.map(question => ({ ...question, boxName: isPersonalBox(box) ? "個人の質問箱" : box.name ?? "共有質問箱", canDelete: role === "owner" }));
    }));
    const rows = batches.flat().sort((a, b) => b.createdAt - a.createdAt || b._creationTime - a._creationTime || (a._id < b._id ? 1 : a._id > b._id ? -1 : 0));
    const page = rows.slice(0, count);
    const last = page.at(-1);
    return { page, isDone: rows.length <= count, continueCursor: last ? JSON.stringify({ createdAt: last.createdAt, creationTime: last._creationTime, id: last._id }) : paginationOpts.cursor ?? "" };
  },
});
export const setVisibility = mutation({
  args: { questionId: v.id("questions"), visibility },
  handler: async (ctx, args) => {
    await requireManageableQuestion(ctx, args.questionId);
    await ctx.db.patch(args.questionId, { visibility: args.visibility, updatedAt: Date.now() });
  },
});
export const remove = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, { questionId }) => {
    await requireManageableQuestion(ctx, questionId, "delete");
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
