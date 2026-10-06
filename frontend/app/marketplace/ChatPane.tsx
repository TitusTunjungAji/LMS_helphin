"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { sendChat, threadOf, type ChatMessage } from "./chat";
import { readSession, type Mentor } from "./data";

function clock(at: number) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(at);
}

export function ChatPane({ mentor, className = "" }: { mentor: Mentor; className?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => setMessages(threadOf(mentor.id));
    load();
    window.addEventListener("helphin-chats", load);
    return () => window.removeEventListener("helphin-chats", load);
  }, [mentor.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!readSession()) {
      setError("Silakan masuk terlebih dahulu.");
      return;
    }
    if (!text.trim()) return;
    setError("");
    sendChat(mentor.id, text);
    setText("");
    setMessages(threadOf(mentor.id));
  }

  return (
    <section className={`flex h-[560px] flex-col overflow-hidden rounded-[28px] border-[3px] border-white bg-[#E8F7FC] shadow-[8px_8px_0_rgba(0,0,0,0.12)] ${className}`}>
      <header className="flex items-center gap-3 bg-[#0288D1] px-4 py-3 text-white">
        <Image src={`/marketplace/mentor-${mentor.id}.png`} alt="" width={42} height={42} className="h-10 w-10 rounded-full border-2 border-white object-cover" />
        <div>
          <p className="font-[family-name:var(--font-fredoka)] text-[16px] font-bold leading-none">{mentor.name}</p>
          <p className="mt-1 text-[12px] text-white/80">{mentor.course} · S1 {mentor.prodi}</p>
        </div>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {messages.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] font-medium text-[#607D8B]">
            Mulai percakapan untuk memastikan kesesuaian topik sebelum sesi dipesan.
          </p>
        ) : null}
        {messages.map((message) => {
          const mine = message.from === "me";
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-[14px] leading-relaxed shadow-sm ${mine ? "rounded-br-sm bg-[#0288D1] text-white" : "rounded-bl-sm bg-white text-[#263238]"}`}>
                <p>{message.text}</p>
                <p className={`mt-1 text-right text-[10px] ${mine ? "text-white/70" : "text-[#90A4AE]"}`}>{clock(message.at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-[#B3E5FC] bg-white p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis pesan"
          className="h-11 flex-1 rounded-full border-2 border-[#B3E5FC] px-4 text-[14px] outline-none focus:border-[#0288D1]"
        />
        <button type="submit" className="rounded-full bg-[#0288D1] px-4 font-[family-name:var(--font-fredoka)] text-[14px] font-semibold text-white">
          Kirim
        </button>
      </form>
      {error ? <p className="bg-white px-4 pb-3 text-[12px] font-semibold text-[#C62828]">{error} <Link href="/marketplace/masuk" className="underline">Masuk</Link></p> : null}
    </section>
  );
}
