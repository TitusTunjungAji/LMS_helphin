type ActivitySnapshot = {
  active: boolean;
  message: string;
  count: number;
};

type Listener = (state: ActivitySnapshot) => void;

let nextId = 1;
let entries: { id: number; message: string }[] = [];
const listeners = new Set<Listener>();
let skipFetchDepth = 0;

function snapshot(): ActivitySnapshot {
  const top = entries[entries.length - 1];
  return {
    active: entries.length > 0,
    message: top?.message || "Memuat...",
    count: entries.length,
  };
}

function emit() {
  const state = snapshot();
  listeners.forEach((listener) => listener(state));
}

export function getActivityState() {
  return snapshot();
}

export function subscribeActivity(listener: Listener) {
  listeners.add(listener);
  listener(snapshot());
  return () => {
    listeners.delete(listener);
  };
}

export function beginActivity(message = "Memuat...") {
  const id = nextId++;
  entries = [...entries, { id, message }];
  emit();
  return () => {
    entries = entries.filter((entry) => entry.id !== id);
    emit();
  };
}

export async function withActivity<T>(
  message: string,
  fn: () => Promise<T>,
  delayMs = 0
): Promise<T> {
  let stop: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const startedAt = Date.now();

  if (delayMs <= 0) {
    stop = beginActivity(message);
  } else {
    timer = setTimeout(() => {
      stop = beginActivity(message);
    }, delayMs);
  }

  try {
    return await fn();
  } finally {
    if (timer) clearTimeout(timer);
    stop?.();
    // #region agent log
    fetch("http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf3566" },
      body: JSON.stringify({
        sessionId: "bf3566",
        runId: "loading-fix",
        hypothesisId: "A",
        location: "lib/activity-loading.ts:withActivity",
        message: "Activity loading finished",
        data: { text: message, delayMs, durationMs: Date.now() - startedAt, overlayShown: !!stop },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }
}

export function withSkippedFetch<T>(fn: () => Promise<T>) {
  skipFetchDepth += 1;
  return fn().finally(() => {
    skipFetchDepth = Math.max(0, skipFetchDepth - 1);
  });
}

export function isFetchLoadingSkipped() {
  return skipFetchDepth > 0;
}

export function guessActivityMessage(url: string, method = "GET") {
  const path = url.toLowerCase();
  const verb = method.toUpperCase();
  if (path.includes("/preview")) return "Memuat preview...";
  if (path.includes("/download")) return "Mengunduh file...";
  if (verb === "DELETE") return "Menghapus data...";
  if (verb === "POST" || verb === "PUT" || verb === "PATCH") return "Menyimpan...";
  return "Memuat...";
}

export function shouldTrackFetch(url: string, method = "GET") {
  if (isFetchLoadingSkipped()) return false;
  if (method.toUpperCase() === "HEAD") return false;
  if (url.includes("127.0.0.1:7711") || url.includes("/ingest/")) return false;
  try {
    const parsed = new URL(url, typeof window === "undefined" ? "http://localhost" : window.location.origin);
    if (parsed.pathname.startsWith("/_next")) return false;
    if (parsed.pathname.startsWith("/api/")) return true;
  } catch {
    return false;
  }
  return false;
}
