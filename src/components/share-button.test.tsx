import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ShareButton } from "./share-button";

const qr = vi.hoisted(() => vi.fn());
vi.mock("qrcode.react", () => ({ QRCodeSVG: (props: { value: string; title: string }) => { qr(props); return <svg role="img" aria-label={props.title} />; } }));
const copy = vi.fn();
beforeEach(() => {
  vi.stubGlobal("navigator", { clipboard: { writeText: copy } });
  copy.mockReset(); copy.mockResolvedValue(undefined); qr.mockClear();
});
afterEach(() => vi.unstubAllGlobals());
const url = "https://questions.example/u/alice%20test";
it("現在のoriginとencoded usernameをコピーし成功feedbackを表示", async () => {
  render(<ShareButton username="alice test" />);
  fireEvent.click(screen.getByRole("button", { name: "質問箱のURLをコピー" }));
  await waitFor(() => expect(copy).toHaveBeenCalledWith(url));
  expect(screen.getByRole("status")).toHaveTextContent("URLをコピーしました。");
  expect(screen.getByRole("link")).toHaveAttribute("href", url);
});
it("Web Share非対応ならコピーへfallback", async () => {
  render(<ShareButton username="alice test" />);
  fireEvent.click(screen.getByRole("button", { name: "共有する" }));
  await waitFor(() => expect(copy).toHaveBeenCalledWith(url));
});
it("Web Shareに正しいURLを渡す", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { share, clipboard: { writeText: copy } });
  render(<ShareButton username="alice test" />);
  fireEvent.click(screen.getByRole("button", { name: "共有する" }));
  await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "匿名で質問を送る", url }));
  expect(copy).not.toHaveBeenCalled();
});
it("共有失敗時はコピーし、コピーも失敗したらURLを残す", async () => {
  vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new Error("failed")), clipboard: { writeText: copy } });
  copy.mockRejectedValue(new Error("denied"));
  render(<ShareButton username="alice test" />);
  fireEvent.click(screen.getByRole("button", { name: "共有する" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("URLを選択してコピー"));
  expect(screen.getByRole("link")).toHaveAttribute("href", url);
});
it("キャンセルをfeedbackし勝手にコピーしない", async () => {
  vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")), clipboard: { writeText: copy } });
  render(<ShareButton username="alice test" />);
  fireEvent.click(screen.getByRole("button", { name: "共有する" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("キャンセル"));
  expect(copy).not.toHaveBeenCalled();
});
it("QRへ同じURLとquiet zoneを渡し閉じるとfocusが戻る", () => {
  render(<ShareButton username="alice test" />);
  const trigger = screen.getByRole("button", { name: "QRコードを表示" });
  fireEvent.click(trigger);
  expect(qr).toHaveBeenCalledWith(expect.objectContaining({ value: url, size: 240, marginSize: 4 }));
  const close = screen.getByRole("button", { name: "閉じる" });
  expect(close).toHaveFocus();
  fireEvent.click(close);
  expect(screen.queryByRole("region", { name: "質問箱のQRコード" })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
