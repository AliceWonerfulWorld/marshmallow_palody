import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("トップページ", () => {
  it("アプリ名と匿名質問箱の説明を表示する", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "匿名で送れて、みんなで見られる質問箱" })).toBeInTheDocument();
    expect(screen.getByText(/marshmallow_palody/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "質問箱を作る" })).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("link", { name: "ログイン" })).toHaveAttribute("href", "/sign-in");
  });
});
