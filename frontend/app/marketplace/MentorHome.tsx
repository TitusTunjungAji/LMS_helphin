"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LEVEL1_MAX, rupiah, type MarketplaceSession } from "./data";
import { markInboxRead, readInbox, replyInbox, TRENDING, unreadCount, UPCOMING, type DeskThread } from "./mentorInbox";
import { MarketplaceShell } from "./Shell";

function clock(at: number) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(at);
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function MentorHome({ session }: { session: MarketplaceSession }) {
  const mentor = session.mentor!;
  const [threads, setThreads] = useState<DeskThread[]>([]);
  const [activeId, setActiveId] = useState("nadia");
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => setThreads(readInbox());
    load();
    window.addEventListener("helphin-inbox", load);
    return () => window.removeEventListener("helphin-inbox", load);
  }, []);

  useEffect(() => {
    const current = threads.find((thread) => thread.id === activeId);
    if (current && unreadCount(current) > 0) setThreads(markInboxRead(activeId));
  }, [threads, activeId]);

  const active = threads.find((thread) => thread.id === activeId) || threads[0];
  const waiting = threads.reduce((sum, thread) => sum + unreadCount(thread), 0);
  const mine = TRENDING.some((item) => item.course.toLowerCase() === mentor.course.toLowerCase());

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, active?.id]);

  function openThread(id: string) {
    setActiveId(id);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!active || !text.trim()) return;
    setThreads(replyInbox(active.id, text));
    setText("");
  }

  return (
    <MarketplaceShell home="mentor">
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <section className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#FFEB3B] px-3 py-1 font-[family-name:var(--font-fredoka)] text-[13px] font-semibold text-[#263238]">Level 1</span>
            <span className="text-[13px] font-semibold text-[#0288D1]">Tarif maksimum {rupiah(LEVEL1_MAX)} per sesi</span>
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-fredoka)] text-[34px] font-bold leading-none text-[#263238] md:text-[40px]">{session.name}</h1>
          <p className="mt-2 text-[14px] font-medium text-[#607D8B]">
            {mentor.fakultas} · {mentor.prodi} · Angkatan {mentor.angkatan}
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[#263238]">
            {mentor.course} · {rupiah(mentor.price)} per sesi
          </p>
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["Percakapan aktif", String(threads.length)],
            ["Belum dibaca", String(waiting)],
            ["Tarif Anda", rupiah(mentor.price)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border-[3px] border-white bg-white p-4 shadow-[6px_6px_0_rgba(0,0,0,0.1)]">
              <p className="text-[12px] font-semibold text-[#78909C]">{label}</p>
              <p className="mt-1 font-[family-name:var(--font-fredoka)] text-[26px] font-bold leading-none">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="overflow-hidden rounded-[28px] border-[3px] border-white bg-white shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
            <div className="border-b border-[#ECEFF1] px-4 py-4">
              <h2 className="font-[family-name:var(--font-fredoka)] text-[22px] font-bold leading-none">Mahasiswa yang menghubungi</h2>
              <p className="mt-1 text-[12px] font-medium text-[#78909C]">Percakapan sebelum sesi dimulai.</p>
            </div>
            <ul>
              {threads.map((thread) => {
                const unread = unreadCount(thread);
                const last = thread.messages.at(-1);
                const selected = active?.id === thread.id;
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => openThread(thread.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left ${selected ? "bg-[#E1F5FE]" : "hover:bg-[#F7FCFF]"}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0288D1] font-[family-name:var(--font-fredoka)] text-[13px] font-bold text-white">
                        {initials(thread.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-[family-name:var(--font-fredoka)] text-[15px] font-bold">{thread.name}</span>
                          {unread > 0 ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FFEB3B]" /> : null}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] font-medium text-[#607D8B]">{thread.course} · {last?.text}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {active ? (
            <section className="flex h-[520px] flex-col overflow-hidden rounded-[28px] border-[3px] border-white bg-[#E8F7FC] shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
              <header className="flex items-center gap-3 bg-[#0288D1] px-4 py-3 text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#01579B] font-[family-name:var(--font-fredoka)] text-[13px] font-bold">
                  {initials(active.name)}
                </span>
                <div>
                  <p className="font-[family-name:var(--font-fredoka)] text-[16px] font-bold leading-none">{active.name}</p>
                  <p className="mt-1 text-[12px] text-white/80">{active.course} · {active.prodi} · Angkatan {active.angkatan}</p>
                </div>
              </header>
              <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
                {active.messages.map((message) => {
                  const mineMessage = message.from === "mentor";
                  return (
                    <div key={message.id} className={`flex ${mineMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-[14px] leading-relaxed shadow-sm ${mineMessage ? "rounded-br-sm bg-[#0288D1] text-white" : "rounded-bl-sm bg-white text-[#263238]"}`}>
                        <p>{message.text}</p>
                        <p className={`mt-1 text-right text-[10px] ${mineMessage ? "text-white/70" : "text-[#90A4AE]"}`}>{clock(message.at)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <form onSubmit={submit} className="flex gap-2 border-t border-[#B3E5FC] bg-white p-3">
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Balas pesan"
                  className="h-11 flex-1 rounded-full border-2 border-[#B3E5FC] px-4 text-[14px] outline-none focus:border-[#0288D1]"
                />
                <button type="submit" className="rounded-full bg-[#0288D1] px-4 font-[family-name:var(--font-fredoka)] text-[14px] font-semibold text-white">
                  Kirim
                </button>
              </form>
            </section>
          ) : null}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
            <h2 className="font-[family-name:var(--font-fredoka)] text-[22px] font-bold leading-none">Pengajaran yang sedang tren</h2>
            <p className="mt-1 text-[13px] font-medium text-[#607D8B]">Permintaan pendampingan minggu ini di Marketplace Mentor.</p>
            <ul className="mt-4 space-y-3">
              {TRENDING.map((item) => {
                const match = item.course.toLowerCase() === mentor.course.toLowerCase();
                return (
                  <li key={item.course}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-[family-name:var(--font-fredoka)] text-[16px] font-bold">
                        {item.course}
                        {match ? <span className="ml-2 rounded-full bg-[#E1F5FE] px-2 py-0.5 text-[11px] font-semibold text-[#0277BD]">Mata kuliah Anda</span> : null}
                      </p>
                      <p className="text-[13px] font-semibold text-[#0288D1]">{item.asks} permintaan</p>
                    </div>
                    <p className="text-[12px] font-medium text-[#78909C]">{item.note}</p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E1F5FE]">
                      <div className="h-full rounded-full bg-[#0288D1]" style={{ width: `${(item.asks / TRENDING[0].asks) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            {mine ? null : (
              <p className="mt-4 text-[13px] font-medium text-[#607D8B]">
                Mata kuliah Anda, {mentor.course}, belum masuk daftar teratas minggu ini.
              </p>
            )}
          </div>
          <div className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
            <h2 className="font-[family-name:var(--font-fredoka)] text-[22px] font-bold leading-none">Sesi mendatang</h2>
            <ul className="mt-4 space-y-3">
              {UPCOMING.map((item) => (
                <li key={item.who} className="rounded-2xl bg-[#F7FCFF] px-3 py-3">
                  <p className="font-[family-name:var(--font-fredoka)] text-[16px] font-bold">{item.who}</p>
                  <p className="mt-1 text-[13px] font-medium text-[#455A64]">{item.topic}</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#0288D1]">{item.when} · {item.method}</p>
                </li>
              ))}
            </ul>
            <Link href="/marketplace/setelan" className="mt-4 inline-block text-[14px] font-bold text-[#0288D1]">Ubah profil mentor</Link>
          </div>
        </section>
      </main>
    </MarketplaceShell>
  );
}
