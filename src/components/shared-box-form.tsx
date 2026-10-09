"use client";

import { useState, type FormEvent } from "react";
import { ConvexError } from "convex/values";
import type { Doc } from "../../convex/_generated/dataModel";

export type BoxMode = Doc<"questionBoxes">["visibilityMode"];
export const boxModeLabels: Record<BoxMode, string> = { public: "公開", approval: "承認制", private: "非公開" };
export type SharedBoxDraft = { name: string; slug: string; description: string; visibilityMode: BoxMode };
const messages: Record<string, string> = {
  INVALID_NAME: "名前は空白を除いて1〜80文字で入力してください。",
  INVALID_DESCRIPTION: "説明は空白を除いて300文字以内で入力してください。",
  INVALID_SLUG: "slugは3〜48文字の半角小文字・数字・ハイフンで入力してください。予約語と先頭・末尾のハイフンは使えません。",
  SLUG_TAKEN: "このslugは使われています。別のslugを入力してください。",
  NOT_FOUND: "この質問箱を変更する権限がありません。",
  UNAUTHENTICATED: "ログイン状態を確認し、もう一度お試しください。",
};

export function SharedBoxForm({ initial, editing = false, onSave }: {
  initial?: SharedBoxDraft;
  editing?: boolean;
  onSave: (draft: SharedBoxDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<SharedBoxDraft>(initial ?? { name: "", slug: "", description: "", visibilityMode: "approval" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function change<K extends keyof SharedBoxDraft>(key: K, value: SharedBoxDraft[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setError(""); setMessage("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(""); setMessage("");
    try {
      await onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() });
      if (editing) setMessage("設定を保存しました。");
    } catch (reason) {
      const code = reason instanceof ConvexError && typeof reason.data === "string" ? reason.data : "";
      setError(messages[code] ?? "保存できませんでした。時間をおいて再試行してください。");
    } finally { setPending(false); }
  }
  return <form onSubmit={submit} className="card space-y-5">
    <fieldset disabled={pending} className="min-w-0 space-y-5">
      <legend className="sr-only">共有質問箱の情報</legend>
      <div className="space-y-1">
        <label htmlFor="shared-box-name">名前</label>
        <input id="shared-box-name" className="block w-full" required maxLength={80} value={draft.name} onChange={event => change("name", event.target.value)} placeholder="部会質問箱" />
        <p className="metadata">1〜80文字。日本語も使えます。</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="shared-box-slug">slug（URLの末尾）</label>
        <input id="shared-box-slug" className="block w-full" required minLength={3} maxLength={48} pattern="[a-z0-9][a-z0-9-]*[a-z0-9]" autoCapitalize="none" spellCheck={false} readOnly={editing} aria-describedby="shared-box-url shared-box-slug-help" value={draft.slug} onChange={event => change("slug", event.target.value)} placeholder="bukai" />
        <p id="shared-box-url" className="metadata break-all">公開URL: /b/{draft.slug || "bukai"}</p>
        <p id="shared-box-slug-help" className="metadata">{editing ? "作成後のslugは変更できません。" : "3〜48文字の半角小文字・数字・ハイフン。先頭・末尾のハイフンは使えません。"}</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="shared-box-description">説明（任意）</label>
        <textarea id="shared-box-description" className="block w-full" maxLength={300} value={draft.description} onChange={event => change("description", event.target.value)} />
        <p className="metadata">300文字以内。</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="shared-box-mode">公開モード</label>
        <select id="shared-box-mode" className="block w-full" value={draft.visibilityMode} onChange={event => change("visibilityMode", event.target.value as BoxMode)}>
          <option value="public">公開：新しい質問をすぐ公開</option>
          <option value="approval">承認制：メンバーが承認すると公開</option>
          <option value="private">非公開：回答時に公開</option>
        </select>
        <p className="metadata">非公開の質問も、この箱のメンバー全員が閲覧できます。{editing && "モード変更は新しい質問に適用され、既存の質問の公開状態は変わりません。"}</p>
      </div>
    </fieldset>
    <button type="submit" disabled={pending}>{pending ? "保存中…" : editing ? "保存する" : "共有質問箱を作る"}</button>
    {error && <p role="alert">{error}</p>}
    <p role="status" className="feedback">{message}</p>
  </form>;
}
