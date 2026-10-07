import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserSync } from "./user-sync";

const state = vi.hoisted(() => ({ authenticated: false, userId: "clerk-1", upsert: vi.fn() }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ userId: state.userId }) }));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: state.authenticated }),
  useMutation: () => state.upsert,
}));
beforeEach(() => { state.authenticated = false; state.upsert.mockReset(); });

describe("UserSync", () => {
  it("Convexの認証完了前は同期せず、認証後にidentityのみで同期する", async () => {
    state.upsert.mockResolvedValue("id");
    const { rerender } = render(<UserSync />);
    expect(state.upsert).not.toHaveBeenCalled();
    state.authenticated = true;
    rerender(<UserSync />);
    await waitFor(() => expect(state.upsert).toHaveBeenCalledWith({}));
  });

  it("失敗を表示し、再試行できる", async () => {
    state.authenticated = true;
    state.upsert.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce("id");
    render(<UserSync />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "再試行" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(state.upsert).toHaveBeenCalledTimes(2);
  });
});
