import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("トップページ", () => {
  it("アプリ名と匿名質問箱の説明を表示する", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "marshmallow_palody" })).toBeInTheDocument();
    expect(screen.getByText(/匿名で質問を送れる質問箱サービス/)).toBeInTheDocument();
  });
});
