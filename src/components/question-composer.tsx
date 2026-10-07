"use client";
import { useRef, useState, type FormEvent } from "react";
import { getAnonymousClientId } from "@/lib/anonymous-client";
import { useRouter } from "next/navigation";
import type { Id } from "../../convex/_generated/dataModel";
import { submitQuestion } from "@/app/u/[username]/actions";

export function QuestionComposer({ boxId }: { boxId: Id<"questionBoxes"> }) {
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
      const result = await submitQuestion(boxId, content, getAnonymousClientId());
      if (result.ok) { setContent(""); setMessage("質問を送りました"); router.refresh(); }
      else setMessage(result.message);
    } catch { setMessage("送信できませんでした。時間をおいて再試行してください。"); }
    finally { submitting.current = false; setPending(false); }
  }
  return <form onSubmit={submit} className="card space-y-3">
    <h2 className="text-xl font-bold">匿名で質問する</h2>
    <p className="metadata">ログイン不要です。投稿者のアカウント情報は保存しません。</p>
    <label htmlFor="question-content">質問内容</label>
    <textarea id="question-content" aria-describedby="question-length" className="block w-full" rows={5} value={content} disabled={pending} onChange={event => setContent(event.target.value)} />
    <p className="metadata" id="question-length">{length} / 1000文字</p>
    <button type="submit" disabled={pending || length < 1 || length > 1000}>{pending ? "送信中…" : "質問を送信"}</button>
    <p role="status" className="feedback">{message}</p>
  </form>;
}
