"use client";
import { useRef, useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export function AnswerForm({ question, onClose }: { question: Doc<"questions">; onClose: () => void }) {
  const create = useMutation(api.answers.create);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const length = content.trim().length;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || length < 1 || length > 2000) return;
    lock.current = true; setPending(true); setError("");
    try { await create({ questionId: question._id, content }); onClose(); }
    catch (error) { setError(error instanceof ConvexError && error.data === "ALREADY_ANSWERED" ? "この質問は回答済みです。" : "回答を保存できませんでした。時間をおいて再試行してください。"); }
    finally { lock.current = false; setPending(false); }
  }
  const id = `answer-${question._id}`;
  return <form onSubmit={submit} className="space-y-3 border-t pt-3">
    <h2 className="font-bold">回答する</h2><p className="whitespace-pre-wrap">Q. {question.content}</p>
    <p>回答すると質問と回答が公開されます。</p>
    <label htmlFor={id}>回答内容</label>
    <textarea id={id} aria-describedby={`${id}-length`} rows={5} className="block w-full" value={content} disabled={pending} onChange={event => setContent(event.target.value)} />
    <p id={`${id}-length`}>{length} / 2000文字</p>
    <div className="flex gap-4"><button type="submit" disabled={pending || length < 1 || length > 2000}>{pending ? "投稿中…" : "回答を公開する"}</button><button type="button" disabled={pending} onClick={onClose}>キャンセル</button></div>
    {error && <p role="alert">{error}</p>}
  </form>;
}
