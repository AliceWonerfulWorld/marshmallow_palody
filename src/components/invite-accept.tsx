"use client";

import { useState } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";

const errors: Record<string, string> = {
  INVITE_INVALID: "この招待リンクは利用できません。",
  INVITE_REVOKED: "この招待は失効しています。",
  INVITE_EXPIRED: "この招待は有効期限が切れています。",
  INVITE_ACCEPTED: "この招待はすでに使用されています。",
  UNAUTHENTICATED: "参加するにはログインしてください。",
};
export function InviteAccept({ token }: { token: string }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const accept = useAction(api.invitationTokens.accept);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const returnUrl = `/invite/${token}`;
  async function join() {
    if (!user || pending) return;
    setPending(true); setError("");
    try { await accept({ token }); router.push("/boxes"); }
    catch (reason) {
      const code = reason instanceof ConvexError && typeof reason.data === "string" ? reason.data : "";
      setError(errors[code] ?? "参加できませんでした。時間をおいて再試行してください。");
      setPending(false);
    }
  }
  return <div className="space-y-3">
    {!isLoaded ? <p role="status">読み込み中…</p> : !isSignedIn ? <>
      <p>参加するにはログインまたはアカウント登録が必要です。</p>
      <div className="flex flex-wrap gap-2">
        <SignInButton forceRedirectUrl={returnUrl} signUpForceRedirectUrl={returnUrl}><button type="button">ログインして参加</button></SignInButton>
        <SignUpButton forceRedirectUrl={returnUrl} signInForceRedirectUrl={returnUrl}><button type="button">登録して参加</button></SignUpButton>
      </div>
    </> : !user ? <p role="status">アカウントを準備しています…</p> : <button type="button" disabled={pending} onClick={join}>{pending ? "参加中…" : "参加する"}</button>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
