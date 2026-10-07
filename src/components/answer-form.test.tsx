import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { Doc } from "../../convex/_generated/dataModel";
import { AnswerForm } from "./answer-form";
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("convex/react", () => ({ useMutation: () => mocks.create }));
const question = { _id: "question", content: "質問" } as Doc<"questions">;
beforeEach(() => { mocks.create.mockReset(); });
it("回答の空白・上限を検証し、送信中の二重投稿を防ぐ", async () => {
  let finish!: () => void;
  mocks.create.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
  const close = vi.fn();
  render(<AnswerForm question={question} onClose={close} />);
  const input = screen.getByLabelText("回答内容");
  const button = screen.getByRole("button", { name: "回答を公開する" });
  for (const value of ["  ", "a".repeat(2001)]) {
    fireEvent.change(input, { target: { value } });
    expect(button).toBeDisabled();
  }
  fireEvent.change(input, { target: { value: "a".repeat(2000) } });
  expect(button).toBeEnabled();
  fireEvent.click(button); fireEvent.submit(input.closest("form")!);
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(input).toBeDisabled();
  finish();
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
});
it("回答失敗時は本文を保持し内部エラーを表示せず再試行できる", async () => {
  mocks.create.mockRejectedValue(new Error("SENSITIVE_SENTINEL"));
  render(<AnswerForm question={question} onClose={vi.fn()} />);
  const input = screen.getByLabelText("回答内容");
  fireEvent.change(input, { target: { value: "回答を保持" } });
  fireEvent.click(screen.getByRole("button", { name: "回答を公開する" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("回答を保存できませんでした"));
  expect(screen.getByRole("alert")).not.toHaveTextContent("SENSITIVE_SENTINEL");
  expect(input).toHaveValue("回答を保持");
  expect(screen.getByRole("button", { name: "回答を公開する" })).toBeEnabled();
});
