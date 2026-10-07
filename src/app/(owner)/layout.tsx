import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) redirect("/sign-in");
  await auth.protect();
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <p role="alert">現在このページを利用できません。</p>;
  return children;
}
