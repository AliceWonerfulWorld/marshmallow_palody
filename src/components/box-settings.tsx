"use client";
import { useState, type FormEvent } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
type Mode = Doc<"questionBoxes">["visibilityMode"];
const modes: { value: Mode; label: string }[] = [
  { value: "public", label: "公開: 新しい質問をすぐ全員に表示" },
  { value: "approval", label: "承認制: 自分が公開した質問だけ表示" },
  { value: "private", label: "非公開: 回答するまで自分だけ表示" },
];
export function BoxSettings() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const box = useQuery(api.boxes.current, user ? {} : "skip");
  const save = useMutation(api.boxes.setMode);
  const [draft, setDraft] = useState<Mode | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!box || pending) return;
    setPending(true); setMessage("");
    try { await save({ boxId: box._id, visibilityMode: draft ?? box.visibilityMode }); setDraft(null); setMessage("設定を保存しました。"); }
    catch { setMessage("保存できませんでした。時間をおいて再試行してください。"); }
    finally { setPending(false); }
  }
  return <main className="space-y-4 p-4 sm:p-6"><h1 className="text-2xl font-bold">設定</h1>
    {!box ? <p role="status" className="feedback">読み込み中…</p> : <form onSubmit={submit} className="card space-y-4">
      <h2 className="text-xl font-bold">質問箱の公開モード</h2>
      <p>現在: {modes.find(mode => mode.value === box.visibilityMode)?.label}</p>
      <fieldset disabled={pending} className="space-y-3"><legend>新しい質問の公開方法</legend>
        {modes.map(mode => <label key={mode.value} className="flex items-start gap-2"><input type="radio" name="visibilityMode" value={mode.value} checked={(draft ?? box.visibilityMode) === mode.value} onChange={() => setDraft(mode.value)} />{mode.label}</label>)}
      </fieldset>
      <p>変更は今後の新規質問に適用します。既存の質問の公開状態は変わりません。個別の公開・非公開は受信箱で変更できます。</p>
      <button type="submit" disabled={pending}>{pending ? "保存中…" : "保存する"}</button>
      <p role="status" className="feedback">{message}</p>
    </form>}
  </main>;
}
