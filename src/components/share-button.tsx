"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export function ShareButton({ username }: { username: string }) {
  const origin = useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
  const url = origin ? `${origin}/u/${encodeURIComponent(username)}` : "";
  const [message, setMessage] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const qrTrigger = useRef<HTMLButtonElement>(null);
  const focusClose = useCallback((node: HTMLButtonElement | null) => { node?.focus(); }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("URLをコピーしました。");
    } catch {
      setMessage("コピーできませんでした。下のURLを選択してコピーしてください。");
    }
  }
  async function share() {
    if (!navigator.share) { await copy(); return; }
    try {
      await navigator.share({ title: "匿名で質問を送る", url });
      setMessage("共有しました。");
    } catch (error) {
      if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") {
        setMessage("共有をキャンセルしました。");
      } else {
        await copy();
      }
    }
  }
  function closeQr() {
    setQrOpen(false);
    qrTrigger.current?.focus();
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!url} onClick={copy}>質問箱のURLをコピー</button>
      <button type="button" disabled={!url} onClick={share}>共有する</button>
      <button ref={qrTrigger} type="button" disabled={!url} aria-expanded={qrOpen} onClick={() => qrOpen ? closeQr() : setQrOpen(true)}>QRコードを表示</button>
    </div>
    {url && <a className="metadata block break-all" href={url}>{url}</a>}
    {qrOpen && <section className="qr-card space-y-3" aria-label="質問箱のQRコード" onKeyDown={event => { if (event.key === "Escape") closeQr(); }}>
      <h2 className="font-bold">スマホで読み取って質問する</h2>
      <QRCodeSVG value={url} size={240} level="M" marginSize={4} title="質問箱を開くQRコード" className="mx-auto h-auto max-w-full" />
      <a className="metadata block break-all" href={url}>{url}</a>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={copy}>URLをコピー</button><button type="button" ref={focusClose} onClick={closeQr}>閉じる</button></div>
    </section>}
    <p role="status" className="feedback">{message}</p>
  </div>;
}
