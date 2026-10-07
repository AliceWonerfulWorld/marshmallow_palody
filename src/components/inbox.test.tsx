import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Inbox } from "./inbox";
const text = '<img src=x onerror="alert(1)">';
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useQuery: () => ({ username: "owner" }),
  useMutation: () => vi.fn(),
  usePaginatedQuery: () => ({ status: "Exhausted", loadMore: vi.fn(), results: [{ _id: "question", content: text, createdAt: 1000, visibility: "public", status: "unanswered" }] }),
}));
it("InboxのHTML風本文をHTMLとして描画しない", () => {
  const { container } = render(<Inbox />);
  expect(screen.getByText(text)).toBeInTheDocument();
  expect(container.querySelector("img")).toBeNull();
});
