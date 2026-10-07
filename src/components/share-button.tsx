"use client";
import { useState } from "react";
export function ShareButton({ username }: { username: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/u/${encodeURIComponent(username)}`);
      setMessage("URLをコピーしました。");
    } catch { setMessage("コピーできませんでした。アドレスバーのURLをコピーしてください。"); }
  }
  return <div><button type="button" onClick={copy} className="underline">質問箱のURLをコピー</button><p role="status">{message}</p></div>;
}
