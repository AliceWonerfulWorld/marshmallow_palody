"use client";
import { useState } from "react";
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export function Inbox() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const [filter, setFilter] = useState<"unanswered" | "answered">("unanswered");
  const { results, status, loadMore } = usePaginatedQuery(api.questions.inbox, user ? { status: filter } : "skip", { initialNumItems: 20 });
  return <main className="space-y-4 p-4 sm:p-6">
    <h1 className="text-2xl font-bold">受信箱</h1>
    <div className="flex gap-4" aria-label="質問の絞り込み">
      <button aria-pressed={filter === "unanswered"} onClick={() => setFilter("unanswered")}>未回答</button>
      <button aria-pressed={filter === "answered"} onClick={() => setFilter("answered")}>回答済み</button>
    </div>
    {!user || status === "LoadingFirstPage" ? <p role="status">読み込み中…</p> : results.length === 0 ? <p>{filter === "unanswered" ? "未回答の質問はありません。" : "回答済みの質問はありません。"}</p> : results.map(question => <InboxCard key={question._id} question={question} />)}
    {status === "CanLoadMore" && <button onClick={() => loadMore(20)}>もっと読む</button>}
    {status === "LoadingMore" && <p role="status">読み込み中…</p>}
  </main>;
}
function InboxCard({ question }: { question: Doc<"questions"> }) {
  const setVisibility = useMutation(api.questions.setVisibility);
  const remove = useMutation(api.questions.remove);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [error, setError] = useState("");
  async function perform(action: () => Promise<unknown>) {
    if (pending) return;
    setPending(true); setError("");
    try { await action(); setConfirmDelete(false); }
    catch { setError("操作できませんでした。時間をおいて再試行してください。"); }
    finally { setPending(false); }
  }
  return <article className="card space-y-3">
    <p className="whitespace-pre-wrap">{question.content}</p>
    <time dateTime={new Date(question.createdAt).toISOString()}>{new Date(question.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</time>
    <p>{question.visibility === "public" ? "公開" : "非公開"} · {question.status === "answered" ? "回答済み" : "未回答"}</p>
    <div className="flex flex-wrap gap-4">
      <button disabled={pending} onClick={() => perform(() => setVisibility({ questionId: question._id, visibility: question.visibility === "public" ? "private" : "public" }))}>{question.visibility === "public" ? "非公開にする" : "公開する"}</button>
      <button disabled={pending} onClick={() => setConfirmDelete(true)}>削除</button>
      {question.status === "unanswered" && <button disabled={pending} aria-expanded={answerOpen} onClick={() => setAnswerOpen(!answerOpen)}>回答する</button>}
    </div>
    {answerOpen && <section className="border-t pt-3"><h2 className="font-bold">回答</h2><p>回答入力は準備中です。</p></section>}
    {confirmDelete && <div role="group" aria-label="削除の確認"><p>質問と回答を削除します。元に戻せません。</p><button disabled={pending} onClick={() => perform(() => remove({ questionId: question._id }))}>削除を確定</button><button disabled={pending} onClick={() => setConfirmDelete(false)} className="ml-4">キャンセル</button></div>}
    {error && <p role="alert">{error}</p>}
  </article>;
}
