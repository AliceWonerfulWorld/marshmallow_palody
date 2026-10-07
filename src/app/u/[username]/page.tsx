import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { ProfileHeader } from "@/components/profile-header";
import { QuestionComposer } from "@/components/question-composer";
import { QuestionFeed } from "@/components/question-feed";

export default async function PublicPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <main className="p-6"><p role="alert">現在この質問箱を利用できません。</p></main>;
  const data = await fetchQuery(api.profiles.byUsername, { username });
  if (!data) notFound();
  return <main className="space-y-6 p-4 sm:p-6"><ProfileHeader profile={data.profile} /><QuestionComposer boxId={data.box.id} /><QuestionFeed /></main>;
}
