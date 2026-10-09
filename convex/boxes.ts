import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getPersonalBox, requireUser, requirePersonalBoxOwner, ensureBoxMembership } from "./lib/access";
import { visibilityMode } from "./schema";

export const current = query({
  args: {},
  handler: async ctx => {
    const user = await requireUser(ctx);
    return getPersonalBox(ctx, user._id);
  },
});
export const setMode = mutation({
  args: { boxId: v.id("questionBoxes"), visibilityMode },
  handler: async (ctx, args) => {
    const { box } = await requirePersonalBoxOwner(ctx, args.boxId);
    // Only future posts use this default; existing per-question visibility is preserved.
    await ctx.db.patch(box._id, { visibilityMode: args.visibilityMode, updatedAt: Date.now() });
  },
});

const reservedSlugs = new Set(["u", "b", "invite", "boxes", "inbox", "settings", "sign-in", "sign-up", "api", "admin"]);
export const createShared = mutation({
  args: { name: v.string(), slug: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const name = args.name.trim();
    const description = args.description?.trim();
    const slug = args.slug;
    if (name.length < 1 || name.length > 80) throw new ConvexError("INVALID_NAME");
    if (description && description.length > 300) throw new ConvexError("INVALID_DESCRIPTION");
    if (slug.length < 3 || slug.length > 48 || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || reservedSlugs.has(slug)) throw new ConvexError("INVALID_SLUG");
    const existing = await ctx.db.query("questionBoxes").withIndex("by_slug", q => q.eq("slug", slug)).unique();
    if (existing) throw new ConvexError("SLUG_TAKEN");
    const now = Date.now();
    const boxId = await ctx.db.insert("questionBoxes", {
      ownerUserId: user._id, kind: "shared", name, slug, description,
      visibilityMode: "approval", createdAt: now, updatedAt: now,
    });
    await ensureBoxMembership(ctx, boxId, user._id);
    return boxId;
  },
});
