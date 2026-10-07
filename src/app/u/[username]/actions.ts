"use server";
import { fetchMutation } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export async function submitQuestion(boxId: Id<"questionBoxes">, content: string, clientId: string) {
  try {
    await fetchMutation(api.questions.submit, { boxId, content, clientId });
    return { ok: true as const };
  } catch (error) {
    const code = error instanceof ConvexError ? error.data : undefined;
    return { ok: false as const, message: code === "RATE_LIMITED" ? "少し時間をおいてから送信してください" : code === "INVALID_CONTENT" ? "質問は1〜1000文字で入力してください。" : code === "NOT_FOUND" ? "この質問箱は利用できません。" : "送信できませんでした。時間をおいて再試行してください。" };
  }
}
