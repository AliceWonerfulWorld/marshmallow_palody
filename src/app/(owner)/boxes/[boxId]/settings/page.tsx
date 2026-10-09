import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import { SharedBoxSettings } from "@/components/shared-box-settings";

export default async function SharedSettingsPage({ params }: { params: Promise<{ boxId: string }> }) {
  const { boxId } = await params;
  const session = await auth();
  const token = await session.getToken({ template: "convex" });
  if (!token) notFound();
  const data = await fetchQuery(api.boxes.getForMember, { boxId }, { token });
  if (!data || data.role !== "owner") notFound();
  return <SharedBoxSettings boxId={boxId} />;
}
