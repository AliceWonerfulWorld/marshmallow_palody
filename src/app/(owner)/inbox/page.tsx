import { Inbox } from "@/components/inbox";
export default async function InboxPage({ searchParams }: { searchParams: Promise<{ boxId?: string }> }) {
  const { boxId } = await searchParams;
  return <Inbox key={boxId ?? "all"} initialBoxId={boxId} />;
}
