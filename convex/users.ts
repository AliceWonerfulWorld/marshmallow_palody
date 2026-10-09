import { ConvexError } from "convex/values";
import { ensurePersonalBox } from "./lib/access";
import { mutation, query } from "./_generated/server";

function slug(value: string | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export const upsert = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");

    const existing = await ctx.db.query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    const displayName = identity.name?.trim() || existing?.displayName || "ユーザー";
    const imageUrl = identity.pictureUrl ?? existing?.imageUrl;
    if (existing) {
      if (existing.displayName !== displayName || existing.imageUrl !== imageUrl) {
        await ctx.db.patch(existing._id, { displayName, imageUrl, updatedAt: Date.now() });
      }
      await ensurePersonalBox(ctx, existing._id);
      return existing._id;
    }

    const base = slug(identity.preferredUsername) || slug(identity.name) || "user";
    let username = base;
    // Indexed reads and insertion share one transaction. Convex retries concurrent conflicts.
    for (let attempt = 0; attempt < 20; attempt++) {
      const taken = await ctx.db.query("users")
        .withIndex("by_username", (q) => q.eq("username", username)).unique();
      if (!taken) {
        const now = Date.now();
        const id = await ctx.db.insert("users", {
          clerkUserId: identity.subject, username, displayName, imageUrl,
          createdAt: now, updatedAt: now,
        });
        await ensurePersonalBox(ctx, id);
        return id;
      }
      username = `${base}-${Math.floor(Math.random() * 36 ** 6).toString(36).padStart(6, "0")}`;
    }
    throw new ConvexError("USERNAME_UNAVAILABLE");
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("UNAUTHENTICATED");
    return await ctx.db.query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject)).unique();
  },
});
