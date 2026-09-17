"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  beginActivity,
  getActivityState,
  guessActivityMessage,
  shouldTrackFetch,
  subscribeActivity,
  withActivity,
} from "@/lib/activity-loading";

let fetchPatched = false;
let stopNavigation: (() => void) | null = null;
let navigationTimer: ReturnType<typeof setTimeout> | null = null;
let navigationCancelled = false;

function startNavigationLoading() {
  if (stopNavigation || navigationTimer) return;
  navigationCancelled = false;
  navigationTimer = setTimeout(() => {
    navigationTimer = null;
    if (navigationCancelled) return;
    stopNavigation = beginActivity("Memuat halaman...", "bar");
  }, 450);
}

function stopNavigationLoading() {
  navigationCancelled = true;
  if (navigationTimer) {
    clearTimeout(navigationTimer);
    navigationTimer = null;
  }
  stopNavigation?.();
  stopNavigation = null;
}

function installFetchLoading() {
  if (fetchPatched || typeof window === "undefined") return;
  fetchPatched = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (init?.method || (input instanceof Request ? input.method : "GET") || "GET").toUpperCase();

    if (!shouldTrackFetch(url, method)) {
      return originalFetch(input, init);
    }

    return withActivity(guessActivityMessage(url, method), () => originalFetch(input, init), {
      delayMs: 450,
      kind: "bar",
    });
  };
}

if (typeof window !== "undefined") {
  installFetchLoading();
}

export default function ActivityLoadingOverlay() {
  const pathname = usePathname();
  const [state, setState] = useState(getActivityState);

  useEffect(() => subscribeActivity(setState), []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      try {
        const next = new URL(href, window.location.href);
        if (next.origin !== window.location.origin) return;
        if (next.pathname === window.location.pathname && next.search === window.location.search) return;
        startNavigationLoading();
      } catch {
        return;
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    stopNavigationLoading();
  }, [pathname]);

  if (!state.active) return null;

  if (state.kind === "bar") {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[20000] h-[3px] overflow-hidden bg-blue-100/80 dark:bg-slate-800" role="status" aria-live="polite" aria-busy="true">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#068DFF] via-[#3DB4FF] to-[#068DFF] animate-[helphin-progress_1.1s_ease-in-out_infinite]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[20000] flex items-end justify-center bg-slate-900/20 p-8 sm:items-center" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3 rounded-full bg-white/95 px-5 py-3 shadow-xl ring-1 ring-black/5 backdrop-blur-md dark:bg-slate-900/95">
        <div className="relative h-5 w-5 shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-blue-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#068DFF] animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{state.message}</p>
      </div>
    </div>
  );
}
