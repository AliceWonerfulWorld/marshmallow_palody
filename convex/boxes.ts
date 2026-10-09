import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getPersonalBox, requireUser, requirePersonalBoxOwner, ensureBoxMembership, requireBoxMember, requireBoxOwner, isPersonalBox } from "./lib/access";
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
function sharedMetadata(name: string, description?: string) {
  name = name.trim();
  description = description?.trim();
  if (name.length < 1 || name.length > 80) throw new ConvexError("INVALID_NAME");
  if (description && description.length > 300) throw new ConvexError("INVALID_DESCRIPTION");
  return { name, description };
}

export const createShared = mutation({
  args: { name: v.string(), slug: v.string(), description: v.optional(v.string()), visibilityMode: v.optional(visibilityMode) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { name, description } = sharedMetadata(args.name, args.description);
    const slug = args.slug;
    if (slug.length < 3 || slug.length > 48 || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || reservedSlugs.has(slug)) throw new ConvexError("INVALID_SLUG");
    const existing = await ctx.db.query("questionBoxes").withIndex("by_slug", q => q.eq("slug", slug)).unique();
    if (existing) throw new ConvexError("SLUG_TAKEN");
    const now = Date.now();
    const boxId = await ctx.db.insert("questionBoxes", {
      ownerUserId: user._id, kind: "shared", name, slug, description,
      visibilityMode: args.visibilityMode ?? "approval", createdAt: now, updatedAt: now,
    });
    await ensureBoxMembership(ctx, boxId, user._id);
    return boxId;
  },
});


export const listMine = query({
  args: {},
  handler: async ctx => {
    const user = await requireUser(ctx);
    const personal = await getPersonalBox(ctx, user._id);
    const memberships = await ctx.db.query("boxMembers")
      .withIndex("by_user_joined", q => q.eq("userId", user._id)).order("desc").collect();
    const shared = await Promise.all(memberships.map(async membership => {
      const box = await ctx.db.get(membership.boxId);
      if (!box || isPersonalBox(box) || (membership.role === "owner" && box.ownerUserId !== user._id)) return null;
      return { box: { _id: box._id, name: box.name, slug: box.slug, description: box.description, visibilityMode: box.visibilityMode }, role: membership.role };
    }));
    return {
      personal: personal ? { _id: personal._id, username: user.username, visibilityMode: personal.visibilityMode } : null,
      shared: shared.filter(entry => entry !== null),
    };
  },
});

export const getForMember = query({
  // URL segments are untrusted; invalid IDs have the same result as unknown boxes.
  args: { boxId: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const boxId = ctx.db.normalizeId("questionBoxes", args.boxId);
    if (!boxId) return null;
    try {
      const { box, role } = await requireBoxMember(ctx, boxId);
      if (isPersonalBox(box)) return null;
      return { box: { _id: box._id, name: box.name, slug: box.slug, description: box.description, visibilityMode: box.visibilityMode }, role };
    } catch (error) {
      if (error instanceof ConvexError && error.data === "NOT_FOUND") return null;
      throw error;
    }
  },
});

export const updateShared = mutation({
  args: { boxId: v.id("questionBoxes"), name: v.string(), description: v.optional(v.string()), visibilityMode },
  handler: async (ctx, args) => {
    const { box } = await requireBoxOwner(ctx, args.boxId);
    if (isPersonalBox(box)) throw new ConvexError("NOT_FOUND");
    const metadata = sharedMetadata(args.name, args.description);
    // Slug is immutable. Mode changes only affect future questions.
    await ctx.db.patch(box._id, { ...metadata, visibilityMode: args.visibilityMode, updatedAt: Date.now() });
  },
});
