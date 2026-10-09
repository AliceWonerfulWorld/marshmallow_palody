import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ConvexError } from "convex/values";
import { getFunctionName } from "convex/server";
import { BoxList } from "./box-list";
import { SharedBoxCreate } from "./shared-box-create";
import { SharedBoxSettings } from "./shared-box-settings";

const state = vi.hoisted(() => ({ role: "owner", ready: true, empty: false, pending: false, create: vi.fn(), update: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useQuery: (reference: Parameters<typeof getFunctionName>[0], args: unknown) => {
    if (args === "skip") return undefined;
    const name = getFunctionName(reference);
    if (name === "users:current") return state.ready ? { username: "alice" } : null;
    const box = { _id: "shared", name: "部会", slug: "bukai", description: "みんなで管理", visibilityMode: "approval" };
    if (name === "boxes:getForMember") return state.pending ? undefined : { box, role: state.role };
    if (name === "boxes:listMine") return { personal: { username: "alice", visibilityMode: "private" }, shared: state.empty ? [] : [{ box, role: state.role }] };
  },
  useMutation: (reference: Parameters<typeof getFunctionName>[0]) => getFunctionName(reference) === "boxes:createShared" ? state.create : state.update,
}));
beforeEach(() => { state.role = "owner"; state.ready = true; state.empty = false; state.pending = false; state.create.mockReset(); state.update.mockReset(); state.push.mockReset(); });

it("個人URL・共有metadata・roleを表示し、設定導線はOwnerのみ", () => {
  const { rerender } = render(<BoxList />);
  expect(screen.getByRole("link", { name: "公開ページを開く" })).toHaveAttribute("href", "/u/alice");
  expect(screen.getByRole("link", { name: "設定" })).toHaveAttribute("href", "/boxes/shared/settings");
  expect(screen.getByText("Owner")).toBeVisible();
  expect(screen.getByText("みんなで管理")).toBeVisible();
  expect(screen.getByText("/b/bukai")).toBeVisible();
  state.role = "member";
  rerender(<BoxList />);
  expect(screen.getByText("Member")).toBeVisible();
  expect(screen.queryByRole("link", { name: "設定" })).not.toBeInTheDocument();
  state.empty = true;
  rerender(<BoxList />);
  expect(screen.getByText("参加中の共有質問箱はありません。")).toBeVisible();
});

it("未同期のUserには作成フォームを出さない", () => {
  state.ready = false;
  render(<SharedBoxCreate />);
  expect(screen.getByRole("status")).toHaveTextContent("アカウントを準備しています");
  expect(screen.queryByLabelText("名前")).not.toBeInTheDocument();
});

it("作成フォームはapproval初期値・URL preview・trim・成功後一覧遷移", async () => {
  state.create.mockResolvedValue("new-box");
  render(<SharedBoxCreate />);
  expect(screen.getByLabelText("公開モード")).toHaveValue("approval");
  fireEvent.change(screen.getByLabelText("名前"), { target: { value: " 部会質問箱 " } });
  fireEvent.change(screen.getByLabelText("slug（URLの末尾）"), { target: { value: "bukai" } });
  expect(screen.getByText("公開URL: /b/bukai")).toBeVisible();
  fireEvent.change(screen.getByLabelText("説明（任意）"), { target: { value: " 説明 " } });
  fireEvent.change(screen.getByLabelText("公開モード"), { target: { value: "public" } });
  fireEvent.click(screen.getByRole("button", { name: "共有質問箱を作る" }));
  await waitFor(() => expect(state.push).toHaveBeenCalledWith("/boxes"));
  expect(state.create).toHaveBeenCalledWith({ name: "部会質問箱", slug: "bukai", description: "説明", visibilityMode: "public" });
});

it("duplicate slug失敗では入力を保持し再試行可能、pending中は二重送信不可", async () => {
  let reject!: (error: Error) => void;
  state.create.mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
  render(<SharedBoxCreate />);
  fireEvent.change(screen.getByLabelText("名前"), { target: { value: "部会" } });
  fireEvent.change(screen.getByLabelText("slug（URLの末尾）"), { target: { value: "taken" } });
  fireEvent.click(screen.getByRole("button", { name: "共有質問箱を作る" }));
  const pending = screen.getByRole("button", { name: "保存中…" });
  expect(pending).toBeDisabled();
  fireEvent.click(pending);
  expect(state.create).toHaveBeenCalledOnce();
  reject(new ConvexError("SLUG_TAKEN"));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("別のslug"));
  expect(screen.getByLabelText("名前")).toHaveValue("部会");
  expect(state.push).not.toHaveBeenCalled();
  state.create.mockResolvedValue("new-box");
  fireEvent.change(screen.getByLabelText("slug（URLの末尾）"), { target: { value: "available" } });
  fireEvent.click(screen.getByRole("button", { name: "共有質問箱を作る" }));
  await waitFor(() => expect(state.push).toHaveBeenCalledWith("/boxes"));
});

it("Owner設定はslug読取専用で、更新にslugを送らない", async () => {
  state.update.mockResolvedValue(null);
  render(<SharedBoxSettings boxId="shared" />);
  expect(screen.getByLabelText("slug（URLの末尾）")).toHaveAttribute("readonly");
  fireEvent.change(screen.getByLabelText("名前"), { target: { value: "新しい箱名" } });
  fireEvent.click(screen.getByRole("button", { name: "保存する" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("設定を保存しました"));
  expect(state.update).toHaveBeenCalledWith({ boxId: "shared", name: "新しい箱名", description: "みんなで管理", visibilityMode: "approval" });
});

it("Memberに変更されたら設定フォームを除去する", () => {
  const { rerender } = render(<SharedBoxSettings boxId="shared" />);
  expect(screen.getByLabelText("名前")).toBeVisible();
  state.role = "member";
  rerender(<SharedBoxSettings boxId="shared" />);
  expect(screen.queryByLabelText("名前")).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("利用できません");
});
