/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from "convex-test";
import { expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";
const modules = import.meta.glob("./**/*.ts");
it("匿名で公開プロフィールを取得でき、Clerk IDや内部Userを公開しない", async () => {
  const t = convexTest(schema, modules);
  await t.withIdentity({ subject: "private-clerk-id", name: "Alice" }).mutation(api.users.upsert, {});
  const data = await t.query(api.profiles.byUsername, { username: "alice" });
  expect(data?.profile).toEqual({ username: "alice", displayName: "Alice" });
  expect(JSON.stringify(data)).not.toContain("private-clerk-id");
  expect(await t.query(api.profiles.byUsername, { username: "missing" })).toBeNull();
});
