import { fireEvent, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { expect, it, vi } from "vitest";
import { Inbox } from "./inbox";
const text = '<img src=x onerror="alert(1)">';
const state = vi.hoisted(() => ({ canDelete: true, paginated: vi.fn() }));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useQuery: (reference: Parameters<typeof getFunctionName>[0], args: unknown) => {
    const name = getFunctionName(reference);
    if (name === "boxes:listMine") return { personal: { _id: "personal" }, shared: [{ box: { _id: "shared", name: "部会質問箱" }, role: "member" }] };
    if (name === "questions:inbox") {
      state.paginated(reference, args);
      return { isDone: false, page: [{ _id: "question", content: text, boxName: "部会質問箱", canDelete: state.canDelete, createdAt: 1000, visibility: "private", status: "unanswered" }] };
    }
    return { username: "owner" };
  },
  useMutation: () => vi.fn(),
}));
it("InboxのHTML風本文をHTMLとして描画しない", () => {
  state.canDelete = true;
  const { container } = render(<Inbox />);
  expect(screen.getByText(text)).toBeInTheDocument();
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
});
it("Memberは回答・公開切替でき、削除ボタンはなく、箱と状態filterを併用できる", () => {
  state.canDelete = false;
  render(<Inbox />);
  expect(screen.queryByRole("button", { name: "削除" })).toBeNull();
  expect(screen.getByRole("button", { name: "回答する" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "公開する" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "部会質問箱" }));
  fireEvent.click(screen.getByRole("button", { name: "回答済み" }));
  expect(state.paginated.mock.lastCall?.[1]).toEqual({ status: "answered", boxId: "shared", paginationOpts: { numItems: 20, cursor: null } });
  fireEvent.click(screen.getByRole("button", { name: "すべて" }));
  expect(state.paginated.mock.lastCall?.[1]).toEqual({ status: "answered", boxId: undefined, paginationOpts: { numItems: 20, cursor: null } });
});

it("もっと読むは同じwindowを拡大し、filter変更時は20件へ戻す", () => {
  render(<Inbox />);
  for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole("button", { name: "もっと読む" }));
  expect(state.paginated.mock.lastCall?.[1]).toMatchObject({ paginationOpts: { numItems: 120, cursor: null } });
  fireEvent.click(screen.getByRole("button", { name: "個人" }));
  expect(state.paginated.mock.lastCall?.[1]).toMatchObject({ boxId: "personal", paginationOpts: { numItems: 20, cursor: null } });
  fireEvent.click(screen.getByRole("button", { name: "もっと読む" }));
  fireEvent.click(screen.getByRole("button", { name: "回答済み" }));
  expect(state.paginated.mock.lastCall?.[1]).toMatchObject({ status: "answered", paginationOpts: { numItems: 20, cursor: null } });
});
