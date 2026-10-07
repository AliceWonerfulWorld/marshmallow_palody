import Link from "next/link";
import { ShareButton } from "./share-button";

export function OwnerGuide({ username }: { username: string }) {
  return <section className="card space-y-3" aria-label="質問を募集する">
    <h2 className="text-xl font-bold">質問を募集しましょう</h2>
    <ol className="list-inside list-decimal space-y-1"><li>URL・QRコードを参加者へ共有</li><li>参加者はログインせず、匿名で質問</li><li>受信箱で確認・回答</li></ol>
    <p className="metadata">最初は承認制です。公開方法は設定で変更できます。回答すると質問と回答が公開されます。</p>
    <Link className="button" href={`/u/${encodeURIComponent(username)}`}>自分の質問箱を開く</Link>
    <ShareButton username={username} />
  </section>;
}
