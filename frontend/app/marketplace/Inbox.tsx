"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChatPane } from "./ChatPane";
import { contactedMentorIds, threadOf } from "./chat";
import { getMentor } from "./data";

function clock(at: number) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(at);
}

export function ChatDock() {
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const load = () => setIds(contactedMentorIds());
    load();
    window.addEventListener("helphin-chats", load);
    return () => window.removeEventListener("helphin-chats", load);
  }, []);

  const mentor = active ? getMentor(active) : undefined;

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {open ? (
        <section className="flex h-[min(540px,70vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[28px] border-[3px] border-white bg-white shadow-[8px_8px_0_rgba(0,0,0,0.16)]">
          <header className="flex items-center gap-3 bg-[#0288D1] px-4 py-3 text-white">
            {mentor ? (
              <button type="button" onClick={() => setActive("")} className="text-[13px] font-semibold">
                Kembali
              </button>
            ) : (
              <p className="font-[family-name:var(--font-fredoka)] text-[18px] font-bold">Pesan</p>
            )}
            <button type="button" onClick={() => setOpen(false)} className="ml-auto text-[13px] font-semibold">
              Tutup
            </button>
          </header>
          {mentor ? (
            <ChatPane mentor={mentor} className="h-full rounded-none border-0 shadow-none" />
          ) : ids.length === 0 ? (
            <p className="px-5 py-10 text-center text-[14px] font-medium leading-relaxed text-[#607D8B]">
              Belum ada pesan. Hubungi mentor dari halaman profilnya.
            </p>
          ) : (
            <ul className="flex-1 divide-y divide-[#ECEFF1] overflow-y-auto">
              {ids.map((id) => {
                const person = getMentor(id);
                const last = threadOf(id).at(-1);
                if (!person || !last) return null;
                return (
                  <li key={id}>
                    <button type="button" onClick={() => setActive(id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#F7FCFF]">
                      <Image src={`/marketplace/mentor-${id}.png`} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-[family-name:var(--font-fredoka)] text-[15px] font-bold">{person.name}</span>
                          <span className="shrink-0 text-[11px] text-[#90A4AE]">{clock(last.at)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-[#607D8B]">{last.text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Tutup pesan" : "Buka pesan"}
        className="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-[#FFEB3B] text-[#263238] shadow-[5px_5px_0_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-3.8 3.2A.8.8 0 0 1 5 18.6V6.5Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        {ids.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0288D1] px-1 text-[11px] font-bold text-white">
            {ids.length}
          </span>
        ) : null}
      </button>
    </div>
  );
}
