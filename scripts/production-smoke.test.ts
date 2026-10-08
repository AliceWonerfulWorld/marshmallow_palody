// @vitest-environment node
import { expect, it, vi } from "vitest";
import { runSmoke } from "./production-smoke.mjs";

it("指定originの2経路にGETだけを送りredirectを追わない", async () => {
  const request = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
  expect(await runSmoke("https://box.example", request, vi.fn(), vi.fn())).toBe(true);
  expect(request.mock.calls.map(([url]) => url.toString())).toEqual(["https://box.example/", "https://box.example/sign-in"]);
  for (const [, options] of request.mock.calls) expect(options).toMatchObject({ method: "GET", redirect: "manual" });
});
it.each(["http://box.example", "https://user:secret@box.example", "https://box.example/private", "https://box.example?token=secret", "https://box.example/#fragment", "invalid"])("不適切なURLはリクエストせず入力もログへ出さない: %s", async input => {
  const request = vi.fn(); const error = vi.fn();
  expect(await runSmoke(input, request, vi.fn(), error)).toBe(false);
  expect(request).not.toHaveBeenCalled();
  expect(error.mock.calls.flat().join(" ")).not.toContain(input);
});
it("500も接続失敗も失敗とし内部エラーやresponse本文を露出しない", async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response("PRIVATE_BODY", { status: 500 })).mockRejectedValueOnce(new Error("PRIVATE_ERROR"));
  const log = vi.fn(); const error = vi.fn();
  expect(await runSmoke("https://box.example", request, log, error)).toBe(false);
  expect(log).toHaveBeenCalledWith("GET /: 500");
  expect(error).toHaveBeenCalledWith("GET /sign-in: request failed");
  const output = JSON.stringify([log.mock.calls, error.mock.calls]);
  expect(output).not.toContain("PRIVATE_BODY"); expect(output).not.toContain("PRIVATE_ERROR");
});
