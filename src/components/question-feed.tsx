"use client";
import { usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function QuestionFeed({ boxId }: { boxId: Id<"questionBoxes"> }) {
  const { results, status, loadMore } = usePaginatedQuery(api.questions.publicUnanswered, { boxId }, { initialNumItems: 20 });
  return <section className="space-y-4" aria-label="みんなの質問">
    <h2 className="text-xl font-bold">みんなの質問</h2>
    {status === "LoadingFirstPage" ? <p role="status">読み込み中…</p> : results.length === 0 ? <p>まだ公開されている質問はありません</p> : results.map(question => <article key={question.id} className="card space-y-3">
      <p className="whitespace-pre-wrap">{question.content}</p>
      <time dateTime={new Date(question.createdAt).toISOString()}>{new Date(question.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</time>
      <p>未回答</p>
    </article>)}
    {status === "CanLoadMore" && <button onClick={() => loadMore(20)}>もっと読む</button>}
    {status === "LoadingMore" && <p role="status">読み込み中…</p>}
    <AnsweredFeed boxId={boxId} />
  </section>;
}

function AnsweredFeed({ boxId }: { boxId: Id<"questionBoxes"> }) {
  const { results, status, loadMore } = usePaginatedQuery(api.answers.publicAnswered, { boxId }, { initialNumItems: 20 });
  return <section className="space-y-4" aria-label="回答済み">
    <h2 className="text-xl font-bold">回答済み</h2>
    {status === "LoadingFirstPage" ? <p role="status">読み込み中…</p> : results.length === 0 ? <p>公開された回答はまだありません。</p> : results.map(entry => <article key={entry.id} className="card space-y-3">
      <p className="whitespace-pre-wrap">Q. {entry.question}</p><p className="whitespace-pre-wrap">A. {entry.answer}</p>
      <time dateTime={new Date(entry.answeredAt).toISOString()}>{new Date(entry.answeredAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</time>
    </article>)}
    {status === "CanLoadMore" && <button onClick={() => loadMore(20)}>回答をもっと読む</button>}
    {status === "LoadingMore" && <p role="status">読み込み中…</p>}
  </section>;
}
