import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import { QuestionComposer } from "./question-composer";
const mocks = vi.hoisted(() => ({ submit: vi.fn(), refresh: vi.fn() }));
vi.mock("@/app/u/[username]/actions", () => ({ submitQuestion: mocks.submit }));
vi.mock("@/lib/anonymous-client", () => ({ getAnonymousClientId: () => "anonymous-browser-001" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
beforeEach(() => { mocks.submit.mockReset(); mocks.refresh.mockReset(); });
it("空白だけでは送信できず、送信中の再操作を防止し成功時にクリアする", async () => {
  let finish!: (value: { ok: true }) => void;
  mocks.submit.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<QuestionComposer boxId={"box" as Id<"questionBoxes">} boxKind="personal" visibilityMode="approval" />);
  const input = screen.getByLabelText("質問内容");
  const button = screen.getByRole("button", { name: "質問を送信" });
  fireEvent.change(input, { target: { value: "   " } });
  expect(button).toBeDisabled();
  fireEvent.change(input, { target: { value: "質問です" } });
  fireEvent.click(button); fireEvent.submit(input.closest("form")!);
  expect(mocks.submit).toHaveBeenCalledTimes(1);
  expect(input).toBeDisabled();
  finish({ ok: true });
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("質問を送りました"));
  expect(input).toHaveValue(""); expect(mocks.refresh).toHaveBeenCalledOnce();
});
it("失敗時は入力を保ち、ユーザー向けメッセージを表示して再試行できる", async () => {
  mocks.submit.mockResolvedValue({ ok: false, message: "少し時間をおいてから送信してください" });
  render(<QuestionComposer boxId={"box" as Id<"questionBoxes">} boxKind="personal" visibilityMode="approval" />);
  const input = screen.getByLabelText("質問内容");
  fireEvent.change(input, { target: { value: "消さない質問" } });
  fireEvent.click(screen.getByRole("button", { name: "質問を送信" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("少し時間をおいてから送信してください"));
  expect(input).toHaveValue("消さない質問");
  expect(screen.getByRole("button", { name: "質問を送信" })).toBeEnabled();
});
it("1000文字境界を検証し超過投稿を防ぐ", () => {
  render(<QuestionComposer boxId={"box" as Id<"questionBoxes">} boxKind="personal" visibilityMode="approval" />);
  const input = screen.getByLabelText("質問内容");
  const button = screen.getByRole("button", { name: "質問を送信" });
  fireEvent.change(input, { target: { value: "a".repeat(1000) } });
  expect(button).toBeEnabled();
  fireEvent.change(input, { target: { value: "a".repeat(1001) } });
  expect(button).toBeDisabled();
  fireEvent.submit(input.closest("form")!);
  expect(mocks.submit).not.toHaveBeenCalled();
});

const cases = (["personal", "shared"] as const).flatMap(boxKind =>
  (["public", "approval", "private"] as const).map(visibilityMode => ({ boxKind, visibilityMode })),
);
it.each(cases)("$boxKind / $visibilityModeの閲覧範囲を説明して表示したモードで送信する", async ({ boxKind, visibilityMode }) => {
  mocks.submit.mockResolvedValue({ ok: true });
  render(<QuestionComposer boxId={"box" as Id<"questionBoxes">} boxKind={boxKind} visibilityMode={visibilityMode} />);
  expect(screen.getByText(`現在の公開モード：${{ public: "公開", approval: "承認制", private: "非公開" }[visibilityMode]}`)).toBeVisible();
  if (visibilityMode === "public") expect(screen.getByText("送信直後から、未回答の質問も誰でも閲覧できます。")).toBeVisible();
  else expect(screen.getByText(`送信直後の未回答の質問は、${boxKind === "shared" ? "この箱のオーナーと参加メンバー全員" : "この箱の所有者だけ"}が閲覧できます。一般には公開されません。`)).toBeVisible();
  expect(screen.getByText(/投稿者のアカウント情報は保存しません/)).toBeVisible();
  expect(screen.getByText(/個別に公開すると質問が、回答すると質問と回答が/)).toBeVisible();
  if (boxKind === "shared") expect(screen.getByText(/非公開の質問もオーナーと参加メンバー全員/)).toBeVisible();
  fireEvent.change(screen.getByLabelText("質問内容"), { target: { value: "質問です" } });
  fireEvent.click(screen.getByRole("button", { name: "質問を送信" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("質問を送りました"));
  expect(mocks.submit).toHaveBeenCalledWith("box", "質問です", "anonymous-browser-001", visibilityMode);
});

it("送信時のモード変更は説明を更新し、入力を保持して利用者の再送信を待つ", async () => {
  mocks.submit.mockResolvedValueOnce({ ok: false, visibilityMode: "public", message: "公開モードが変更されました。まだ送信していません。" }).mockResolvedValueOnce({ ok: true });
  render(<QuestionComposer boxId={"box" as Id<"questionBoxes">} boxKind="shared" visibilityMode="private" />);
  const input = screen.getByLabelText("質問内容");
  fireEvent.change(input, { target: { value: "保持する質問" } });
  fireEvent.click(screen.getByRole("button", { name: "質問を送信" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("まだ送信していません"));
  expect(screen.getByText("現在の公開モード：公開")).toBeVisible();
  expect(input).toHaveValue("保持する質問");
  expect(mocks.submit).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "質問を送信" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("質問を送りました"));
  expect(mocks.submit).toHaveBeenLastCalledWith("box", "保持する質問", "anonymous-browser-001", "public");
});
