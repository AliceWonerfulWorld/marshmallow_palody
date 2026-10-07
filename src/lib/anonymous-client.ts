const storageKey = "marshmallow-anonymous-client";
let memoryId: string | undefined;

export function getAnonymousClientId() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved && /^[a-zA-Z0-9_-]{16,128}$/.test(saved)) return saved;
  } catch { /* Private browsing may disable storage. Keep a session-only ID. */ }
  memoryId ??= crypto.randomUUID();
  try { localStorage.setItem(storageKey, memoryId); } catch { /* Use the session-only ID. */ }
  return memoryId;
}
