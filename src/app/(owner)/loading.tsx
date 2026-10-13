// Keep the loading boundary within management routes. A root loading.tsx
// streams HTTP 200 before public pages can resolve an unknown box to HTTP 404.
export default function Loading() {
  return <main className="empty-state my-6 p-6" role="status">読み込み中…</main>;
}
