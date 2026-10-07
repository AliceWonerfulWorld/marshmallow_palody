/// <reference types="vite/client" />
// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

const modules = import.meta.glob("./**/*.ts");

describe("users", () => {
  it("未認証の読み取り・同期を拒否する", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.users.upsert, {})).rejects.toThrow("UNAUTHENTICATED");
    await expect(t.query(api.users.current, {})).rejects.toThrow("UNAUTHENTICATED");
  });

  it("同期を繰り返してもUserは1件で、メールを保存しない", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ subject: "clerk-1", name: "Alice", email: "private@example.com", preferredUsername: "Alice World" });
    const id = await user.mutation(api.users.upsert, {});
    expect(await user.mutation(api.users.upsert, {})).toBe(id);
    const rows = await t.run((ctx) => ctx.db.query("users").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ clerkUserId: "clerk-1", username: "alice-world", displayName: "Alice" });
    expect(rows[0]).not.toHaveProperty("email");
  });

  it("同期時に承認制の質問箱を1件だけ準備する", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ subject: "owner" });
    const id = await user.mutation(api.users.upsert, {});
    await user.mutation(api.users.upsert, {});
    const boxes = await t.run(ctx => ctx.db.query("questionBoxes").collect());
    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toMatchObject({ ownerUserId: id, visibilityMode: "approval" });
  });

  it("名前の衝突時にURL安全なsuffixを付け、他ユーザーのデータを返さない", async () => {
    const t = convexTest(schema, modules);
    const first = t.withIdentity({ subject: "first", name: "Alice" });
    const second = t.withIdentity({ subject: "second", name: "Alice" });
    await first.mutation(api.users.upsert, {});
    await second.mutation(api.users.upsert, {});
    const a = await first.query(api.users.current, {});
    const b = await second.query(api.users.current, {});
    expect(a?.username).toBe("alice");
    expect(b?.username).toMatch(/^alice-[a-z0-9]{6}$/);
    expect(b?.clerkUserId).toBe("second");
  });

  it("使えるslugがない場合userを使う", async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity({ subject: "jp", preferredUsername: "あいう", name: "日本語" });
    await user.mutation(api.users.upsert, {});
    expect((await user.query(api.users.current, {}))?.username).toBe("user");
  });

  it("identityの更新を同期してもusernameとcreatedAtは維持する", async () => {
    const t = convexTest(schema, modules);
    const before = t.withIdentity({ subject: "same", name: "Alice" });
    await before.mutation(api.users.upsert, {});
    const original = await before.query(api.users.current, {});
    const after = t.withIdentity({ subject: "same", name: "New Name", pictureUrl: "https://example.com/avatar.png" });
    await after.mutation(api.users.upsert, {});
    expect(await after.query(api.users.current, {})).toMatchObject({
      username: "alice", createdAt: original?.createdAt, displayName: "New Name", imageUrl: "https://example.com/avatar.png",
    });
  });
});
