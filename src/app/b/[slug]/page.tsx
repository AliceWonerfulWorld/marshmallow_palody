import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { ShareButton } from "@/components/share-button";
import { QuestionComposer } from "@/components/question-composer";
import { QuestionFeed } from "@/components/question-feed";

export default async function SharedPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <main className="p-6"><p role="alert">現在この質問箱を利用できません。</p></main>;
  const box = await fetchQuery(api.boxes.publicBySlug, { slug });
  if (!box) notFound();
  return <main className="space-y-6 p-4 sm:p-6">
    <header className="card space-y-3">
      <h1 className="break-words text-2xl font-bold">{box.name}</h1>
      {box.description && <p className="whitespace-pre-wrap break-words">{box.description}</p>}
      <p className="metadata">質問・お便りを募集する公開ページです。</p>
      <ShareButton slug={box.slug!} name={box.name!} />
    </header>
    <QuestionComposer boxId={box.id} />
    <QuestionFeed boxId={box.id} />
  </main>;
}
