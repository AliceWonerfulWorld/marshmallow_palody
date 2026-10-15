"use client";
import { useRef, useState, type FormEvent } from "react";
import { getAnonymousClientId } from "@/lib/anonymous-client";
import { useRouter } from "next/navigation";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { submitQuestion } from "@/app/u/[username]/actions";

type VisibilityMode = Doc<"questionBoxes">["visibilityMode"];
const modeNames = { public: "公開", approval: "承認制", private: "非公開" };

export function QuestionComposer({ boxId, boxKind, visibilityMode }: { boxId: Id<"questionBoxes">; boxKind: "personal" | "shared"; visibilityMode: VisibilityMode }) {
  const [modeOverride, setModeOverride] = useState<VisibilityMode | null>(null);
  const currentMode = modeOverride ?? visibilityMode;
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const router = useRouter();
  const length = content.trim().length;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || length < 1 || length > 1000) return;
    submitting.current = true;
    setPending(true);
    setMessage("");
    try {
      const result = await submitQuestion(boxId, content, getAnonymousClientId(), currentMode);
      if (result.ok) { setContent(""); setMessage("質問を送りました"); router.refresh(); }
      else {
        if (result.visibilityMode) setModeOverride(result.visibilityMode);
        setMessage(result.message);
      }
    } catch { setMessage("送信できませんでした。時間をおいて再試行してください。"); }
    finally { submitting.current = false; setPending(false); }
  }
  return <form onSubmit={submit} className="card space-y-3">
    <h2 className="text-xl font-bold">匿名で質問する</h2>
    <p className="metadata">ログイン不要です。投稿者のアカウント情報は保存しません。</p>
    <div id="question-visibility" className="space-y-2" aria-live="polite" aria-atomic="true">
      <p className="font-bold">現在の公開モード：{modeNames[currentMode]}</p>
      <p className="metadata">{currentMode === "public"
        ? "送信直後から、未回答の質問も誰でも閲覧できます。"
        : `送信直後の未回答の質問は、${boxKind === "shared" ? "この箱のオーナーと参加メンバー全員" : "この箱の所有者だけ"}が閲覧できます。一般には公開されません。`}</p>
      {boxKind === "shared" && <p className="metadata">共有質問箱では、非公開の質問もオーナーと参加メンバー全員が閲覧できます。</p>}
      <p className="metadata">承認制・非公開でも、{boxKind === "shared" ? "オーナーやメンバー" : "所有者"}が個別に公開すると質問が、回答すると質問と回答が誰でも閲覧できるようになります。個人情報の入力は避けてください。</p>
    </div>
    <label htmlFor="question-content">質問内容</label>
    <textarea id="question-content" aria-describedby="question-visibility question-length" className="block w-full" rows={5} value={content} disabled={pending} onChange={event => setContent(event.target.value)} />
    <p className="metadata" id="question-length">{length} / 1000文字</p>
    <button type="submit" disabled={pending || length < 1 || length > 1000}>{pending ? "送信中…" : "質問を送信"}</button>
    <p role="status" className="feedback">{message}</p>
  </form>;
}
