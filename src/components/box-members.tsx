"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function BoxMembers({ boxId }: { boxId: string }) {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const data = useQuery(api.invitations.members, user ? { boxId } : "skip");
  const create = useAction(api.invitationTokens.create);
  const revoke = useMutation(api.invitations.revoke);
  const remove = useMutation(api.invitations.removeMember);
  const invites = useQuery(api.invitations.pending, data?.role === "owner" ? { boxId: data.boxId } : "skip");
  const [link, setLink] = useState<{ url: string; expiresAt: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState<Id<"users"> | null>(null);
  async function perform(task: () => Promise<unknown>, success: string) {
    if (pending) return;
    setPending(true); setError(""); setMessage("");
    try { await task(); setMessage(success); }
    catch { setError("操作できませんでした。権限を確認し、時間をおいて再試行してください。"); }
    finally { setPending(false); }
  }
  return <main className="space-y-5 p-4 sm:p-6">
    <Link href="/boxes">← あなたの質問箱</Link>
    <h1 className="text-2xl font-bold">メンバー</h1>
    {data === undefined ? <p role="status">読み込み中…</p> : !data ? <p role="alert">この質問箱を利用できません。</p> : <>
      <h2 className="text-xl font-bold">{data.name}</h2>
      <p>あなたの役割: <span className="badge">{data.role === "owner" ? "Owner" : "Member"}</span></p>
      <ul className="space-y-3" aria-label="参加メンバー">
        {data.members.map(member => <li key={member.userId} className="card space-y-3">
          <div className="flex flex-wrap items-center gap-2"><span>{member.displayName}</span><span className="badge">{member.role === "owner" ? "Owner" : "Member"}</span>{member.isSelf && <span className="metadata">あなた</span>}</div>
          {data.role === "owner" && member.role === "member" && <>
            {confirm !== member.userId ? <button type="button" disabled={pending} className="danger" onClick={() => setConfirm(member.userId)}>メンバーを削除</button>
              : <div role="group" aria-label={`${member.displayName}の削除確認`} className="space-y-2">
                <p>このメンバーを削除しますか？過去の回答は残ります。</p>
                <div className="flex flex-wrap gap-2"><button type="button" className="danger" disabled={pending} onClick={() => perform(async () => { await remove({ boxId: data.boxId, userId: member.userId }); setConfirm(null); }, "メンバーを削除しました。")}>削除する</button><button type="button" disabled={pending} onClick={() => setConfirm(null)}>キャンセル</button></div>
              </div>}
          </>}
        </li>)}
      </ul>
      {data.role === "owner" && <section className="card space-y-4" aria-labelledby="invitation-title">
        <h2 id="invitation-title" className="text-xl font-bold">メンバーを招待</h2>
        <p>1つのリンクで1人を招待できます。有効期限は7日です。質問募集用の公開URLとは異なります。</p>
        <button type="button" disabled={pending} onClick={() => perform(async () => {
          const result = await create({ boxId: data.boxId });
          setLink({ url: `${window.location.origin}/invite/${result.token}`, expiresAt: result.expiresAt });
        }, "招待リンクを発行しました。")}>招待リンクを発行</button>
        {link && <div className="space-y-2">
          <label htmlFor="invitation-link">メンバー参加用リンク</label>
          <input id="invitation-link" className="block w-full" readOnly value={link.url} onFocus={event => event.target.select()} />
          <p className="metadata">期限: {new Date(link.expiresAt).toLocaleString("ja-JP")}</p>
          <p className="metadata">リンクはこの画面で発行した直後だけ確認できます。</p>
          <button type="button" disabled={pending} onClick={() => perform(() => navigator.clipboard.writeText(link.url), "リンクをコピーしました。")}>リンクをコピー</button>
        </div>}
        <h3 className="font-bold">未使用の招待</h3>
        {invites === undefined ? <p>読み込み中…</p> : invites.length === 0 ? <p>未使用の招待はありません。</p> : <ul className="space-y-3">{invites.map(invite => <li key={invite.id} className="space-y-2 border-t border-stone-200 pt-3">
          <p className="metadata">発行: {new Date(invite.createdAt).toLocaleString("ja-JP")} / 期限: {new Date(invite.expiresAt).toLocaleString("ja-JP")}</p>
          <button type="button" disabled={pending} onClick={() => perform(async () => { await revoke({ invitationId: invite.id }); setLink(null); }, "招待を失効しました。")}>招待を失効</button>
        </li>)}</ul>}
      </section>}
    </>}
    {error && <p role="alert">{error}</p>}
    <p role="status" className="feedback">{message}</p>
  </main>;
}
