"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface AuthStageProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthStage({ title, subtitle, children }: AuthStageProps) {
  return (
    <main data-auth-stage className="fixed inset-0 overflow-hidden bg-[#cfe8ff]">
      <div data-auth-art className="absolute inset-0 md:right-[34%]">
        <Image
          src="/images/background.svg"
          alt=""
          fill
          className="object-cover object-[center_18%]"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-[#b9dbff] via-[#cfe8ff]/70 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-45">
          <Image
            src="/images/Vector 1.svg"
            alt=""
            width={1440}
            height={738}
            className="w-full object-cover"
          />
        </div>

        <div className="absolute top-7 left-6 md:top-11 md:left-[9%] z-20">
          <h2 className="text-[42px] md:text-[64px] leading-[0.9] font-extrabold italic text-[#068DFF]">
            {title}
          </h2>
          <p className="text-[12px] md:text-[14px] text-slate-500 font-medium mt-2 italic">
            {subtitle}
          </p>
        </div>

        <div
          data-auth-model
          className="absolute z-[15] pointer-events-none left-1/2 -translate-x-1/2 bottom-[46%] w-[min(92vw,460px)] h-[58%] md:z-30 md:bottom-0 md:left-[56%] md:w-[min(52vw,620px)] md:h-full"
        >
          <Image
            src="/images/Model.svg"
            alt=""
            fill
            priority
            className="object-contain object-bottom"
          />
        </div>

        <div className="hidden md:flex absolute left-[6%] top-[40%] z-30 animate-[float_5s_ease-in-out_infinite] bg-white rounded-2xl shadow-[0_10px_28px_rgba(6,141,255,0.12)] px-3 py-2.5 items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
            <Image src="/images/Group 197.svg" alt="" width={36} height={36} />
          </div>
          <span className="text-[13px] font-semibold text-gray-700 pr-1">Bank Soal</span>
        </div>
        <div className="hidden md:flex absolute right-[8%] top-[24%] z-30 animate-[float_6s_ease-in-out_infinite_0.5s] bg-white rounded-xl shadow-[0_10px_28px_rgba(6,141,255,0.12)] px-3 py-2 items-center gap-2">
          <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 11L3 13L4 8.5L1 5.5L5 5L7 1Z" fill="#068DFF" />
            </svg>
          </div>
          <span className="text-[12px] font-semibold text-gray-700">Explore</span>
        </div>
        <div className="hidden md:flex absolute right-[14%] bottom-[30%] z-30 animate-[float_5.5s_ease-in-out_infinite_1s] bg-white rounded-2xl shadow-[0_10px_28px_rgba(6,141,255,0.12)] px-3 py-2.5 items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="2" stroke="#068DFF" strokeWidth="1.5" />
              <path d="M6.5 6L10.5 8L6.5 10V6Z" fill="#068DFF" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-gray-700 pr-1">Teaching</span>
        </div>
      </div>

      <section
        data-auth-sheet
        className="absolute inset-x-0 bottom-0 z-20 max-h-[58%] md:max-h-none md:inset-y-0 md:left-auto md:w-[38%] bg-white rounded-t-[32px] md:rounded-none shadow-[0_-20px_50px_rgba(15,50,110,0.12)] md:shadow-[-40px_0_60px_rgba(15,50,110,0.08)] flex items-start md:items-center justify-center px-7 pt-8 pb-6 md:px-14 md:py-10 overflow-y-auto"
      >
        <div className="w-full max-w-[380px] my-auto">{children}</div>
      </section>
    </main>
  );
}
