"use node";

import { randomBytes, createHash } from "node:crypto";
import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const isToken = (token: string) => /^[a-f0-9]{64}$/.test(token);

export const create = action({
  args: { boxId: v.id("questionBoxes") },
  handler: async (ctx, { boxId }): Promise<{ token: string; expiresAt: number }> => {
    // Cryptographic randomness belongs in a Node action, not a deterministic mutation.
    const token = randomBytes(32).toString("hex");
    const { expiresAt } = await ctx.runMutation(internal.invitations.issue, { boxId, tokenHash: tokenHash(token) });
    return { token, expiresAt }; // Returned once to the authorized owner; never persisted or logged.
  },
});

export type InvitePreview = { status: "invalid" | "expired" | "revoked" | "accepted" } | { status: "pending"; name?: string; expiresAt: number };
export const inspect = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<InvitePreview> => {
    if (!isToken(token)) return { status: "invalid" };
    return ctx.runQuery(internal.invitations.inspectHash, { tokenHash: tokenHash(token) });
  },
});

export const accept = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<Id<"questionBoxes">> => {
    if (!await ctx.auth.getUserIdentity()) throw new ConvexError("UNAUTHENTICATED");
    if (!isToken(token)) throw new ConvexError("INVITE_INVALID");
    return ctx.runMutation(internal.invitations.acceptHash, { tokenHash: tokenHash(token) });
  },
});
