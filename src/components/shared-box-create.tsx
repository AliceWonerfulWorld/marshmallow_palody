"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SharedBoxForm } from "./shared-box-form";

export function SharedBoxCreate() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const create = useMutation(api.boxes.createShared);
  return <main className="space-y-5 p-4 sm:p-6">
    <Link href="/boxes">← あなたの質問箱</Link>
    <h1 className="text-2xl font-bold">共有質問箱を作る</h1>
    <p>個人の質問箱を残したまま、みんなで管理する質問箱を作れます。</p>
    {!user ? <p role="status">アカウントを準備しています…</p> : <SharedBoxForm onSave={async draft => {
      await create(draft);
      router.push("/boxes");
    }} />}
  </main>;
}
