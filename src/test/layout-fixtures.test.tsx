import { mkdirSync, writeFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { expect, it, vi } from "vitest";
import { Header } from "@/components/header";
import { ProfileHeader } from "@/components/profile-header";
import { QuestionComposer } from "@/components/question-composer";
import { QuestionFeed } from "@/components/question-feed";
import { Inbox } from "@/components/inbox";
import { BoxSettings } from "@/components/box-settings";
import { BoxList } from "@/components/box-list";
import { SharedBoxCreate } from "@/components/shared-box-create";
import { SharedBoxSettings } from "@/components/shared-box-settings";
import ErrorPage from "@/app/error";
import type { Id } from "../../convex/_generated/dataModel";

const state = vi.hoisted(() => ({ status: "Exhausted", empty: false }));
const sharedBox = { _id: "shared-box", name: "あ".repeat(80), slug: "a".repeat(48), description: "説明".repeat(150), visibilityMode: "approval" };
const longText = "質問の本文です。".repeat(25) + "\nhttps://example.com/" + "long-path".repeat(30);
vi.mock("@clerk/nextjs", () => ({ Show: ({ when, children }: { when: string; children: React.ReactNode }) => when === "signed-in" ? children : null, UserButton: () => <button aria-label="ユーザーメニュー">○</button> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/app/u/[username]/actions", () => ({ submitQuestion: vi.fn() }));
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => vi.fn(),
  useQuery: (reference: Parameters<typeof getFunctionName>[0]) => {
    switch (getFunctionName(reference)) {
      case "boxes:current": return { _id: "box", visibilityMode: "approval" };
      case "boxes:listMine": return { personal: { username: "owner", visibilityMode: "approval" }, shared: [{ box: sharedBox, role: "owner" }, { box: { ...sharedBox, _id: "member-box", name: "招待参加した箱" }, role: "member" }] };
      case "boxes:getForMember": return { box: sharedBox, role: "owner" };
      default: return { username: "owner" };
    }
  },
  usePaginatedQuery: (reference: Parameters<typeof getFunctionName>[0]) => ({
    status: state.status,
    loadMore: vi.fn(),
    results: state.empty ? [] : getFunctionName(reference) === "answers:publicAnswered"
      ? [{ id: "answered", question: longText, answer: "回答の本文です。".repeat(30), answeredAt: 1000 }]
      : [{ _id: "question", id: "question", content: longText, createdAt: 1000, visibility: "private", status: "unanswered" }],
  }),
}));

it("実コンポーネントの長文・QR・回答/削除・設定・各状態を生成し検証", () => {
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://fixture.example");
  const fixtures: Record<string, string> = {};
  function capture(name: string, ui: React.ReactNode, prepare?: () => void) {
    const { container } = render(<><Header authEnabled />{ui}</>);
    prepare?.();
    expect(container.querySelector("main")).not.toBeNull();
    // HTML snapshots must preserve selected properties for browser layout QA.
    for (const option of container.querySelectorAll("select option")) {
      option.toggleAttribute("selected", (option as HTMLOptionElement).selected);
    }
    fixtures[name] = container.innerHTML;
    cleanup();
  }
  const boxId = "box" as Id<"questionBoxes">;
  const publicPage = <main className="space-y-6 p-4 sm:p-6"><ProfileHeader profile={{ username: "owner", displayName: "長い表示名".repeat(12), bio: longText }} /><QuestionComposer boxId={boxId} /><QuestionFeed boxId={boxId} /></main>;
  capture("public", publicPage, () => {
    fireEvent.click(screen.getByRole("button", { name: "QRコードを表示" }));
    expect(screen.getByTitle("質問箱を開くQRコード")).toBeInTheDocument();
    expect(screen.getAllByText(/質問の本文です/, { selector: "article p" })).toHaveLength(2);
  });
  capture("inbox", <Inbox />, () => {
    fireEvent.click(screen.getByRole("button", { name: "回答する" }));
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(screen.getByLabelText("回答内容")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "削除の確認" })).toBeInTheDocument();
  });
  capture("settings", <BoxSettings />, () => { expect(screen.getByRole("radio", { name: /承認制/ })).toBeChecked(); });
  capture("boxes", <BoxList />, () => { expect(screen.getByText("Member")).toBeVisible(); });
  capture("boxes-new", <SharedBoxCreate />, () => {
    fireEvent.change(screen.getByLabelText("名前"), { target: { value: sharedBox.name } });
    fireEvent.change(screen.getByLabelText("slug（URLの末尾）"), { target: { value: sharedBox.slug } });
    fireEvent.change(screen.getByLabelText("説明（任意）"), { target: { value: sharedBox.description } });
    expect(screen.getByText(`公開URL: /b/${sharedBox.slug}`)).toBeVisible();
  });
  capture("boxes-settings", <SharedBoxSettings boxId="shared-box" />);
  state.empty = true;
  capture("empty", publicPage, () => { expect(screen.getByText("まだ公開されている質問はありません")).toBeVisible(); });
  state.status = "LoadingFirstPage";
  capture("loading", publicPage, () => { expect(screen.getAllByText("読み込み中…")).toHaveLength(2); });
  capture("error", <ErrorPage error={new Error("not rendered")} retry={vi.fn()} />);
  state.empty = false; state.status = "Exhausted";
  vi.unstubAllEnvs();
  if (process.env.WRITE_LAYOUT_FIXTURES === "1") {
    mkdirSync("test-results", { recursive: true });
    writeFileSync("test-results/layout-fixtures.json", JSON.stringify(fixtures));
  }
});
