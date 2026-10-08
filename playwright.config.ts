import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results/browser",
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3100", browserName: "chromium", trace: "retain-on-failure" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 30_000,
    env: { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "", CLERK_SECRET_KEY: "", NEXT_PUBLIC_CONVEX_URL: "" },
  },
});
