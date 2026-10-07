"use client";
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="card my-6 space-y-4 p-6"><p role="alert">表示できませんでした。時間をおいて再試行してください。</p><button onClick={retry}>再試行</button></main>;
}
