import Link from "next/link";

export default function Home() {
  return <main className="space-y-8 px-4 py-12 sm:px-6 sm:py-20">
    <section className="space-y-6">
      <p className="metadata">marshmallow_palody · 匿名質問箱</p>
      <h1 className="text-3xl font-bold sm:text-4xl">匿名で送れて、<br />みんなで見られる質問箱</h1>
      <p className="max-w-lg text-stone-600">聞いてみたいことを、気軽に。届いた質問を公開するかは、受け取る人が選べます。</p>
      <div className="flex flex-wrap gap-3"><Link className="button button-primary" href="/sign-up" prefetch={false}>質問箱を作る</Link><Link className="button" href="/sign-in" prefetch={false}>ログイン</Link></div>
    </section>
    <section className="card space-y-3" aria-label="使い方"><h2 className="text-xl font-bold">あなたの言葉で、つながる</h2><p>質問箱のURLを共有するだけ。質問を送る人のログインは不要です。</p><p className="metadata">公開・承認制・非公開から選べます。回答すると質問と回答が公開されます。</p></section>
  </main>;
}
