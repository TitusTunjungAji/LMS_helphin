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

function startNavigationLoading() {
  if (stopNavigation || navigationTimer) return;
  navigationTimer = setTimeout(() => {
    navigationTimer = null;
    stopNavigation = beginActivity("Memuat halaman...");
  }, 160);
}

function stopNavigationLoading() {
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

    return withActivity(guessActivityMessage(url, method), () => originalFetch(input, init), 280);
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

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-center justify-center bg-slate-900/40 backdrop-blur-[3px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex min-w-[240px] flex-col items-center gap-4 rounded-3xl bg-white px-8 py-7 shadow-2xl dark:bg-slate-900">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#068DFF] animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{state.message}</p>
          <p className="mt-1 text-xs font-medium text-slate-400">Mohon tunggu sebentar</p>
        </div>
      </div>
    </div>
  );
}
