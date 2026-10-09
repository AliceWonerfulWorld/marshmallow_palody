"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { boxModeLabels } from "./shared-box-form";

export function BoxList() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const data = useQuery(api.boxes.listMine, user ? {} : "skip");
  return <main className="space-y-6 p-4 sm:p-6">
    <h1 className="text-2xl font-bold">あなたの質問箱</h1>
    <Link href="/boxes/new" className="button button-primary">共有質問箱を作る</Link>
    {data === undefined ? <p role="status">読み込み中…</p> : <>
      <section className="space-y-3" aria-labelledby="personal-box-title">
        <h2 id="personal-box-title" className="text-xl font-bold">個人質問箱</h2>
        {data.personal ? <article className="card space-y-3">
          <h3 className="font-bold">個人の質問箱</h3>
          <p className="metadata">{boxModeLabels[data.personal.visibilityMode]}</p>
          <div className="flex flex-wrap gap-2">
            <Link className="button" href={`/u/${data.personal.username}`}>公開ページを開く</Link>
            <Link className="button" href="/settings" prefetch={false}>個人設定</Link>
          </div>
        </article> : <p role="status">個人質問箱を準備しています…</p>}
      </section>
      <section className="space-y-3" aria-labelledby="shared-box-title">
        <h2 id="shared-box-title" className="text-xl font-bold">共有質問箱</h2>
        {data.shared.length === 0 && <p className="empty-state">参加中の共有質問箱はありません。</p>}
        {data.shared.map(({ box, role }) => <article key={box._id} className="card space-y-3">
          <div className="flex flex-wrap items-center gap-2"><h3 className="min-w-0 font-bold">{box.name}</h3><span className="badge">{role === "owner" ? "Owner" : "Member"}</span></div>
          <p className="metadata break-all">/b/{box.slug}</p>
          {box.description && <p className="whitespace-pre-wrap">{box.description}</p>}
          <p className="metadata">{boxModeLabels[box.visibilityMode]}</p>
          <div className="flex flex-wrap gap-2">
            {/* These destinations are enabled as their features ship in #32–#33. */}
            <button type="button" disabled title="準備中">公開ページを開く</button>
            <button type="button" disabled title="準備中">Inboxでこの箱を見る</button>
            <Link className="button" href={`/boxes/${box._id}/members`} prefetch={false}>メンバーを見る</Link>
            {role === "owner" && <Link className="button" href={`/boxes/${box._id}/settings`} prefetch={false}>設定</Link>}
          </div>
          <p className="metadata">公開ページ・共有Inboxは準備中です。</p>
        </article>)}
      </section>
    </>}
  </main>;
}
