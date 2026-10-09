import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import { BoxMembers } from "@/components/box-members";
export default async function MembersPage({ params }: { params: Promise<{ boxId: string }> }) {
  const { boxId } = await params;
  const token = await (await auth()).getToken({ template: "convex" });
  if (!token) notFound();
  if (!await fetchQuery(api.invitations.members, { boxId }, { token })) notFound();
  return <BoxMembers key={boxId} boxId={boxId} />;
}
