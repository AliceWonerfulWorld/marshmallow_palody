import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const visibilityMode = v.union(v.literal("public"), v.literal("approval"), v.literal("private"));
export const visibility = v.union(v.literal("public"), v.literal("private"));
export const questionStatus = v.union(v.literal("unanswered"), v.literal("answered"));

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    username: v.string(),
    displayName: v.string(),
    bio: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_username", ["username"]),
  questionBoxes: defineTable({
    ownerUserId: v.id("users"), visibilityMode, createdAt: v.number(), updatedAt: v.number(),
    kind: v.optional(v.union(v.literal("personal"), v.literal("shared"))),
    name: v.optional(v.string()), slug: v.optional(v.string()), description: v.optional(v.string()),
  }).index("by_owner_user_id", ["ownerUserId"])
    .index("by_slug", ["slug"]),
  boxMembers: defineTable({
    boxId: v.id("questionBoxes"), userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")), joinedAt: v.number(),
  }).index("by_box_user", ["boxId", "userId"])
    .index("by_user_joined", ["userId", "joinedAt"])
    .index("by_box_joined", ["boxId", "joinedAt"]),
  questions: defineTable({
    boxId: v.id("questionBoxes"), receiverUserId: v.id("users"), content: v.string(),
    visibility, status: questionStatus, createdAt: v.number(), updatedAt: v.number(),
  }).index("by_receiver_status_created", ["receiverUserId", "status", "createdAt"])
    .index("by_box_status_created", ["boxId", "status", "createdAt"])
    .index("by_box_visibility_status_created", ["boxId", "visibility", "status", "createdAt"]),
  questionRateLimits: defineTable({
    boxId: v.id("questionBoxes"), clientId: v.string(), windowStartedAt: v.number(), count: v.number(),
  }).index("by_box_client", ["boxId", "clientId"]),
  answers: defineTable({
    questionId: v.id("questions"), authorUserId: v.id("users"), content: v.string(),
    createdAt: v.number(), updatedAt: v.number(),
  }).index("by_question_id", ["questionId"])
    .index("by_author_created", ["authorUserId", "createdAt"]),
});
