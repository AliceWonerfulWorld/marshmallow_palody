import Link from "next/link";
export default function NotFound() {
  return <main className="space-y-4 p-6"><h1 className="text-2xl font-bold">ページが見つかりません</h1><Link href="/">トップへ戻る</Link></main>;
}
