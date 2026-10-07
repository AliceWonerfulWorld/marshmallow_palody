import { spawnSync } from "node:child_process";

// Explicitly empty values take precedence over .env.local, including public
// values embedded at build time. This smoke never connects to Clerk or Convex.
const env = { ...process.env, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "", CLERK_SECRET_KEY: "", NEXT_PUBLIC_CONVEX_URL: "", CONVEX_DEPLOY_KEY: "", NEXT_TELEMETRY_DISABLED: "1", WRITE_LAYOUT_FIXTURES: "1" };
for (const args of [["run", "build"], ["exec", "vitest", "run", "src/test/layout-fixtures.test.tsx"], ["exec", "playwright", "test"]]) {
  const result = spawnSync("npm", args, { env, stdio: "inherit" });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
