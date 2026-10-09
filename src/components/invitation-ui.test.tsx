import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";
import { ConvexError } from "convex/values";
import { BoxMembers } from "./box-members";
import { InviteAccept } from "./invite-accept";
const state = vi.hoisted(() => ({ role: "owner", signedIn: true, create: vi.fn(), accept: vi.fn(), remove: vi.fn(), revoke: vi.fn(), push: vi.fn(), login: vi.fn(), signup: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: state.signedIn }),
  SignInButton: (props: { children: React.ReactNode; forceRedirectUrl: string }) => { state.login(props); return props.children; },
  SignUpButton: (props: { children: React.ReactNode; forceRedirectUrl: string }) => { state.signup(props); return props.children; },
}));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: state.signedIn }),
  useQuery: (reference: Parameters<typeof getFunctionName>[0], args: unknown) => {
    if (args === "skip") return undefined;
    switch (getFunctionName(reference)) {
      case "users:current": return { username: "alice" };
      case "invitations:members": return { boxId: "box", name: "部会", role: state.role, members: [{ userId: "owner", displayName: "Alice", role: "owner", isSelf: state.role === "owner" }, { userId: "member", displayName: "Bob", role: "member", isSelf: state.role === "member" }] };
      case "invitations:pending": return [{ id: "invite", createdAt: 1000, expiresAt: 2000 }];
    }
  },
  useAction: (reference: Parameters<typeof getFunctionName>[0]) => getFunctionName(reference) === "invitationTokens:create" ? state.create : state.accept,
  useMutation: (reference: Parameters<typeof getFunctionName>[0]) => getFunctionName(reference) === "invitations:removeMember" ? state.remove : state.revoke,
}));
beforeEach(() => { state.role = "owner"; state.signedIn = true; for (const mock of [state.create, state.accept, state.remove, state.revoke, state.push, state.login, state.signup]) mock.mockReset(); });
it("Ownerは招待・削除可能、Memberに操作を表示しない", () => {
  const { rerender } = render(<BoxMembers boxId="box" />);
  expect(screen.getByRole("button", { name: "招待リンクを発行" })).toBeVisible();
  expect(screen.getAllByRole("button", { name: "メンバーを削除" })).toHaveLength(1);
  state.role = "member"; rerender(<BoxMembers boxId="box" />);
  expect(screen.queryByRole("button", { name: "招待リンクを発行" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "メンバーを削除" })).not.toBeInTheDocument();
  expect(screen.queryByText("未使用の招待")).not.toBeInTheDocument();
});
it("招待URLはcurrent originで作成しコピー、失効後には表示を消す", async () => {
  state.create.mockResolvedValue({ token: "a".repeat(64), expiresAt: 2000 });
  const clipboard = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: clipboard } });
  render(<BoxMembers boxId="box" />);
  fireEvent.click(screen.getByRole("button", { name: "招待リンクを発行" }));
  await waitFor(() => expect(screen.getByLabelText("メンバー参加用リンク")).toHaveValue(`https://questions.example/invite/${"a".repeat(64)}`));
  fireEvent.click(screen.getByRole("button", { name: "リンクをコピー" }));
  await waitFor(() => expect(clipboard).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole("button", { name: "招待を失効" }));
  await waitFor(() => expect(state.revoke).toHaveBeenCalledWith({ invitationId: "invite" }));
  expect(screen.queryByLabelText("メンバー参加用リンク")).not.toBeInTheDocument();
});
it("削除は確認後だけ実行する", async () => {
  render(<BoxMembers boxId="box" />);
  fireEvent.click(screen.getByRole("button", { name: "メンバーを削除" }));
  expect(state.remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "削除する" }));
  await waitFor(() => expect(state.remove).toHaveBeenCalledWith({ boxId: "box", userId: "member" }));
});
it("ログイン・登録の両方で招待ページへ戻るURLを指定する", () => {
  state.signedIn = false;
  const token = "a".repeat(64);
  render(<InviteAccept token={token} />);
  expect(state.login).toHaveBeenCalledWith(expect.objectContaining({ forceRedirectUrl: `/invite/${token}`, signUpForceRedirectUrl: `/invite/${token}` }));
  expect(state.signup).toHaveBeenCalledWith(expect.objectContaining({ forceRedirectUrl: `/invite/${token}`, signInForceRedirectUrl: `/invite/${token}` }));
  expect(screen.queryByRole("button", { name: "参加する" })).not.toBeInTheDocument();
});
it("参加成功後一覧へ移動、失効エラーでtokenを露出しない", async () => {
  const token = "a".repeat(64);
  state.accept.mockRejectedValueOnce(new ConvexError("INVITE_REVOKED")).mockResolvedValueOnce("box");
  const { container } = render(<InviteAccept token={token} />);
  fireEvent.click(screen.getByRole("button", { name: "参加する" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("失効"));
  expect(container.textContent).not.toContain(token);
  fireEvent.click(screen.getByRole("button", { name: "参加する" }));
  await waitFor(() => expect(state.push).toHaveBeenCalledWith("/boxes"));
});
