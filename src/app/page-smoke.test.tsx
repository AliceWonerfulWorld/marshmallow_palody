import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import PublicPage from "./u/[username]/page";
import SignInPage from "./sign-in/[[...sign-in]]/page";
import SignUpPage from "./sign-up/[[...sign-up]]/page";
import ErrorPage from "./error";
import GlobalError from "./global-error";
import NotFound from "./not-found";

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }) }));
vi.mock("convex/nextjs", () => ({ fetchQuery: mocks.fetch }));
vi.mock("convex/react", () => ({ usePaginatedQuery: () => ({ results: [], status: "Exhausted" }) }));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound, useRouter: () => ({ refresh: vi.fn() }) }));
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://deployment.example"); mocks.fetch.mockReset(); mocks.notFound.mockClear(); });
afterEach(() => vi.unstubAllEnvs());
it("公開質問箱に宛先・匿名投稿・公開範囲・空状態を表示", async () => {
  mocks.fetch.mockResolvedValue({ profile: { username: "alice", displayName: "アリス" }, box: { id: "box" } });
  render(await PublicPage({ params: Promise.resolve({ username: "alice" }) }));
  expect(screen.getByRole("heading", { level: 1, name: "アリス" })).toBeVisible();
  expect(screen.getByLabelText("質問内容")).toBeVisible();
  expect(screen.getByText(/投稿者のアカウント情報は保存しません/)).toBeVisible();
  expect(screen.getByText(/公開モードでは未回答の質問も表示/)).toBeVisible();
  expect(screen.getByText("まだ公開されている質問はありません")).toBeVisible();
  expect(screen.getByRole("button", { name: "質問を送信" })).toBeDisabled();
});
it("存在しないusernameはNextの404へ移譲", async () => {
  mocks.fetch.mockResolvedValue(null);
  await expect(PublicPage({ params: Promise.resolve({ username: "missing" }) })).rejects.toThrow("NOT_FOUND");
  expect(mocks.notFound).toHaveBeenCalledOnce();
  render(<NotFound />);
  expect(screen.getByRole("link", { name: "トップへ戻る" })).toHaveAttribute("href", "/");
});
it("Convex設定なしの公開ページは固定エラーで外部queryを呼ばない", async () => {
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");
  render(await PublicPage({ params: Promise.resolve({ username: "alice" }) }));
  expect(screen.getByRole("alert")).toHaveTextContent("現在この質問箱を利用できません。");
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it.each([SignInPage, SignUpPage])("認証設定不足でも固定メッセージを表示しsecretを描画しない", Page => {
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
  vi.stubEnv("CLERK_SECRET_KEY", "SENSITIVE_SENTINEL");
  const { container } = render(<Page />);
  expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  expect(screen.getByText(/現在.*利用できません/)).toBeVisible();
  expect(container.textContent).not.toContain("SENSITIVE_SENTINEL");
});
it("page/root errorは受け取ったerror・stack・digestを露出しない", () => {
  const error = Object.assign(new Error("SENSITIVE_SENTINEL"), { stack: "PRIVATE_STACK", digest: "PRIVATE_DIGEST" });
  for (const Page of [ErrorPage, GlobalError]) {
    const html = renderToStaticMarkup(<Page error={error} retry={vi.fn()} />);
    for (const value of ["SENSITIVE_SENTINEL", "PRIVATE_STACK", "PRIVATE_DIGEST"]) expect(html).not.toContain(value);
    expect(html).toContain("再試行");
  }
});
