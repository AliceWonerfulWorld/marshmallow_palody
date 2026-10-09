"use client";

import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SharedBoxForm } from "./shared-box-form";

export function SharedBoxSettings({ boxId }: { boxId: string }) {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const data = useQuery(api.boxes.getForMember, user ? { boxId } : "skip");
  const update = useMutation(api.boxes.updateShared);
  return <main className="space-y-5 p-4 sm:p-6">
    <Link href="/boxes">← あなたの質問箱</Link>
    <h1 className="text-2xl font-bold">共有質問箱の設定</h1>
    {data === undefined ? <p role="status">読み込み中…</p>
      : !data || data.role !== "owner" ? <p role="alert">この質問箱の設定を利用できません。</p>
      : <SharedBoxForm key={data.box._id} editing initial={{ name: data.box.name ?? "", slug: data.box.slug ?? "", description: data.box.description ?? "", visibilityMode: data.box.visibilityMode }} onSave={async draft => {
        await update({ boxId: data.box._id, name: draft.name, description: draft.description, visibilityMode: draft.visibilityMode });
      }} />}
  </main>;
}
