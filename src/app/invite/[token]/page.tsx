import type { Metadata } from "next";
import Link from "next/link";
import { fetchAction } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { InviteAccept } from "@/components/invite-accept";
export const metadata: Metadata = { title: "共有質問箱への招待", robots: { index: false, follow: false }, referrer: "no-referrer" };
const messages = { invalid: "この招待リンクは利用できません。", revoked: "この招待は失効しています。", expired: "この招待は有効期限が切れています。", accepted: "この招待はすでに使用されています。参加済みの場合は質問箱一覧を開いてください。" };
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <main className="p-6"><p role="alert">現在この招待を利用できません。</p></main>;
  const data = await fetchAction(api.invitationTokens.inspect, { token });
  const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  return <main className="space-y-5 p-4 sm:p-6">
    <h1 className="text-2xl font-bold">共有質問箱への招待</h1>
    {data.status !== "pending" ? <p role="alert">{messages[data.status]}</p> : <section className="card space-y-4">
      <h2 className="text-xl font-bold">{data.name}に参加しますか？</h2>
      <p>参加すると、この箱のメンバーになります。非公開の質問もメンバー全員で共有されます。</p>
      {authEnabled ? <InviteAccept key={token} token={token} /> : <p role="alert">現在ログインを利用できません。</p>}
    </section>}
    <Link href="/boxes" prefetch={false}>あなたの質問箱</Link>
  </main>;
}
