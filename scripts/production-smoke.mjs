import { fileURLToPath } from "node:url";

export async function runSmoke(input, request = fetch, log = console.log, error = console.error) {
  let origin;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error();
    origin = url.origin;
  } catch {
    error("Usage: npm run smoke:production -- https://your-production-domain (or SMOKE_BASE_URL)");
    return false;
  }
  let passed = true;
  for (const path of ["/", "/sign-in"]) {
    try {
      const response = await request(new URL(path, origin), { method: "GET", redirect: "manual", signal: AbortSignal.timeout(15_000) });
      log(`GET ${path}: ${response.status}`);
      await response.body?.cancel();
      if (response.status < 200 || response.status >= 400) passed = false;
    } catch {
      error(`GET ${path}: request failed`);
      passed = false;
    }
  }
  return passed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const passed = await runSmoke(process.argv[2] || process.env.SMOKE_BASE_URL);
  if (!passed) process.exitCode = 1;
}
