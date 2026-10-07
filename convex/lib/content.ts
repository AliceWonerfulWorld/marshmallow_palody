import { ConvexError } from "convex/values";
export function validatedContent(value: string, max: number) {
  const content = value.trim();
  if (content.length < 1 || content.length > max) throw new ConvexError("INVALID_CONTENT");
  return content;
}
