"use client";

import Image from "next/image";
import { ReactNode, useEffect } from "react";

interface AuthStageProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthStage({ title, subtitle, children }: AuthStageProps) {
  useEffect(() => {
    const sheet = document.querySelector("[data-auth-sheet]");
    const stage = document.querySelector("[data-auth-stage]");
    const chip = document.querySelector("[data-auth-chip]");
    const sheetRect = sheet?.getBoundingClientRect();
    const chipRect = chip?.getBoundingClientRect();
    const overlap = sheetRect && chipRect
      ? !(chipRect.right < sheetRect.left || chipRect.left > sheetRect.right || chipRect.bottom < sheetRect.top || chipRect.top > sheetRect.bottom)
      : false;
    const vv = window.visualViewport;
    // #region agent log
    fetch("http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf3566" },
      body: JSON.stringify({
        sessionId: "bf3566",
        runId: "auth-side-fix",
        hypothesisId: "A",
        location: "AuthStage.tsx:layout",
        message: "AuthStage layout metrics",
        data: {
          path: window.location.pathname,
          innerH: window.innerHeight,
          innerW: window.innerWidth,
          vvH: vv?.height || null,
          pageScrollH: document.documentElement.scrollHeight,
          canPageScroll: document.documentElement.scrollHeight > window.innerHeight + 4,
          stagePos: stage ? getComputedStyle(stage).position : null,
          stageOverflow: stage ? getComputedStyle(stage).overflow : null,
          sheetMaxH: sheet ? getComputedStyle(sheet).maxHeight : null,
          sheetOverflowY: sheet ? getComputedStyle(sheet).overflowY : null,
          sheetH: sheet ? Math.round(sheet.getBoundingClientRect().height) : null,
          sheetScrollH: sheet?.scrollHeight || null,
          sheetTop: sheet ? Math.round(sheet.getBoundingClientRect().top) : null,
          sheetLeft: sheetRect ? Math.round(sheetRect.left) : null,
          sheetRight: sheetRect ? Math.round(sheetRect.right) : null,
          formOnRight: sheetRect ? sheetRect.left > window.innerWidth / 2 : null,
          chipOverlapsForm: overlap,
          sheetRightCss: sheet ? getComputedStyle(sheet).right : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return (
    <main
      data-auth-stage
      className="relative min-h-dvh overflow-x-hidden bg-[#cfe8ff] md:fixed md:inset-0 md:overflow-hidden"
    >
      <div
        data-auth-art
        className="relative h-[min(38dvh,320px)] w-full md:absolute md:inset-0 md:right-[34%] md:h-auto"
      >
        <Image
          src="/images/background.svg"
          alt=""
          fill
          className="object-cover object-[center_18%]"
          priority
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-[#b9dbff] via-[#cfe8ff]/70 to-transparent" />
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 opacity-45">
          <Image
            src="/images/Vector 1.svg"
            alt=""
            width={1440}
            height={738}
            className="w-full object-cover"
          />
        </div>

        <div className="absolute top-5 left-5 z-20 md:top-11 md:left-[9%]">
          <h2 className="text-[34px] leading-[0.9] font-extrabold italic text-[#068DFF] md:text-[64px]">
            {title}
          </h2>
          <p className="mt-1.5 text-[12px] font-medium text-slate-500 italic md:mt-2 md:text-[14px]">
            {subtitle}
          </p>
        </div>

        <div
          data-auth-model
          className="pointer-events-none absolute bottom-0 left-1/2 z-[15] h-[88%] w-[min(72vw,280px)] -translate-x-1/2 md:bottom-0 md:left-[56%] md:z-30 md:h-full md:w-[min(52vw,620px)]"
        >
          <Image
            src="/images/Model.svg"
            alt=""
            fill
            priority
            className="object-contain object-bottom"
          />
        </div>

        <div data-auth-chip className="absolute top-[40%] left-[6%] z-30 hidden animate-[float_5s_ease-in-out_infinite] items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-[0_10px_28px_rgba(6,141,255,0.12)] md:flex">
          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg">
            <Image src="/images/Group 197.svg" alt="" width={36} height={36} />
          </div>
          <span className="pr-1 text-[13px] font-semibold text-gray-700">Bank Soal</span>
        </div>
        <div className="absolute top-[24%] right-[8%] z-30 hidden animate-[float_6s_ease-in-out_infinite_0.5s] items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_10px_28px_rgba(6,141,255,0.12)] md:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 11L3 13L4 8.5L1 5.5L5 5L7 1Z" fill="#068DFF" />
            </svg>
          </div>
          <span className="text-[12px] font-semibold text-gray-700">Explore</span>
        </div>
        <div className="absolute right-[14%] bottom-[30%] z-30 hidden animate-[float_5.5s_ease-in-out_infinite_1s] items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-[0_10px_28px_rgba(6,141,255,0.12)] md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="2" stroke="#068DFF" strokeWidth="1.5" />
              <path d="M6.5 6L10.5 8L6.5 10V6Z" fill="#068DFF" />
            </svg>
          </div>
          <span className="pr-1 text-[13px] font-semibold text-gray-700">Teaching</span>
        </div>
      </div>

      <section
        data-auth-sheet
        className="relative z-20 -mt-12 flex min-h-[calc(100dvh-min(38dvh,320px)+3rem)] items-start justify-center rounded-t-[32px] bg-white px-6 pt-7 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-[0_-20px_50px_rgba(15,50,110,0.12)] md:absolute md:inset-y-0 md:right-0 md:left-auto md:mt-0 md:w-[38%] md:items-center md:overflow-y-auto md:rounded-none md:px-14 md:py-10 md:shadow-[-40px_0_60px_rgba(15,50,110,0.08)]"
      >
        <div className="w-full max-w-[380px] md:my-auto [&_input]:text-base [&_select]:text-base">
          {children}
        </div>
      </section>
    </main>
  );
}
