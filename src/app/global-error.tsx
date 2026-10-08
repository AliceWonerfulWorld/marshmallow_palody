"use client";

// This replaces the root layout when provider initialization fails.
// Never render the received error, stack, JWT, or configuration values.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="ja"><body style={{ margin: 0, padding: "24px", fontFamily: "sans-serif", background: "#f8f7fa", color: "#292433" }}>
    <main style={{ maxWidth: "640px", margin: "0 auto", overflowWrap: "anywhere" }}>
      <h1>現在ページを表示できません</h1>
      <p role="alert">時間をおいて再試行してください。</p>
      <button style={{ minHeight: "44px", padding: "8px 16px" }} onClick={retry}>再試行</button>
    </main>
  </body></html>;
}
