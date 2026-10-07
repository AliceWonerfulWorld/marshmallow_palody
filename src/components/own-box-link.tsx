"use client";
import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function OwnBoxLink() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  return user ? <Link href={`/u/${user.username}`}>自分の質問箱</Link> : null;
}
