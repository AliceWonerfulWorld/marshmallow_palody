import { v } from "convex/values";
import { query } from "./_generated/server";
import { getPersonalBox, type PublicProfile } from "./lib/access";

export const byUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db.query("users").withIndex("by_username", q => q.eq("username", username)).unique();
    if (!user) return null;
    const box = await getPersonalBox(ctx, user._id);
    if (!box) return null;
    const profile: PublicProfile = { username: user.username, displayName: user.displayName, bio: user.bio, imageUrl: user.imageUrl };
    return { profile, box: { id: box._id, visibilityMode: box.visibilityMode } };
  },
});
