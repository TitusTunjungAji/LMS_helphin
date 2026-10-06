"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatPane } from "../../ChatPane";
import { sendChat } from "../../chat";
import { getMentor, readSession, rupiah, type Mentor } from "../../data";
import { placeOrder, type SessionOrder } from "../../orders";
import { MarketplaceShell, popClass } from "../../Shell";

export default function MentorProfilePage() {
  const params = useParams<{ id: string }>();
  const mentor = getMentor(params.id);

  if (!mentor) {
    return (
      <MarketplaceShell>
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="font-[family-name:var(--font-fredoka)] text-[24px] font-bold">Mentor tidak ditemukan.</p>
          <Link href="/marketplace" className={popClass("ocean", "mt-5")}>Kembali ke marketplace</Link>
        </main>
      </MarketplaceShell>
    );
  }

  return (
    <MarketplaceShell>
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 lg:grid-cols-[0.82fr_1.18fr]">
        <article className="overflow-hidden rounded-[28px] border-[3px] border-white bg-white shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <div className="relative h-[320px]" style={{ background: mentor.wash }}>
            <Image src={`/marketplace/mentor-${mentor.id}.jpg`} alt={mentor.name} fill className="object-cover object-[center_16%]" />
          </div>
          <div className="p-5">
            <span className="rounded-full bg-[#FFEB3B] px-3 py-1 text-[12px] font-bold">{mentor.badge}</span>
            <h1 className="mt-3 font-[family-name:var(--font-fredoka)] text-[32px] font-bold leading-none">{mentor.name}</h1>
            <p className="mt-2 text-[14px] font-semibold text-[#607D8B]">S1 {mentor.prodi} · Angkatan {mentor.angkatan} · {mentor.course}</p>
            <p className="mt-2 text-[14px] font-medium text-[#455A64]">{mentor.focus}</p>
            <p className="mt-3 font-[family-name:var(--font-fredoka)] text-[22px] font-bold text-[#0288D1]">{rupiah(mentor.price)} <span className="text-[13px] text-[#90A4AE]">/ sesi</span></p>
            <BuySession mentor={mentor} />
          </div>
        </article>
        <ChatPane mentor={mentor} />
      </main>
    </MarketplaceShell>
  );
}

function BuySession({ mentor }: { mentor: Mentor }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<(typeof mentor.methods)[number]>(mentor.methods[0]);
  const [note, setNote] = useState("");
  const [order, setOrder] = useState<SessionOrder | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("beli") !== "1") return;
    if (!readSession()?.verified) {
      sessionStorage.setItem("helphin-marketplace-next", `/marketplace/mentor/${mentor.id}?beli=1`);
      router.replace("/marketplace/masuk");
      return;
    }
    setOpen(true);
  }, [mentor.id, router]);

  function buy() {
    if (!readSession()?.verified) {
      sessionStorage.setItem("helphin-marketplace-next", `/marketplace/mentor/${mentor.id}?beli=1`);
      router.push("/marketplace/masuk");
      return;
    }
    const placed = placeOrder({
      mentorId: mentor.id,
      mentorName: mentor.name,
      course: mentor.course,
      method,
      price: mentor.price,
      note: note.trim(),
    });
    const topic = note.trim() ? ` Topik: ${note.trim()}.` : "";
    sendChat(mentor.id, `Saya membeli satu sesi ${method}.${topic}`);
    setOrder(placed);
    setOpen(false);
  }

  if (order) {
    return (
      <div className="mt-4 rounded-2xl bg-[#E8F5E9] px-4 py-3">
        <p className="font-[family-name:var(--font-fredoka)] text-[16px] font-bold text-[#2E7D32]">Sesi berhasil dibeli</p>
        <p className="mt-1 text-[13px] font-medium text-[#455A64]">{order.method} · {rupiah(order.price)}</p>
        <Link href="/marketplace/pesanan" className="mt-2 inline-block text-[13px] font-bold text-[#0288D1]">Lihat pesanan saya</Link>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={popClass("yellow", "mt-4 w-full")}>
        Beli sesi
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-[#B3E5FC] bg-[#F7FCFF] p-4">
      <p className="font-[family-name:var(--font-fredoka)] text-[18px] font-bold">Beli satu sesi</p>
      <p className="mt-1 text-[13px] font-medium text-[#607D8B]">Tarif {rupiah(mentor.price)} untuk satu pertemuan.</p>
      <p className="mt-3 text-[13px] font-semibold text-[#455A64]">Metode</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {mentor.methods.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMethod(item)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${method === item ? "bg-[#0288D1] text-white" : "bg-white text-[#455A64]"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
        Topik yang ingin didampingi
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder={mentor.focus}
          className="mt-1 w-full rounded-xl border-2 border-[#B3E5FC] px-3 py-2 font-medium outline-none focus:border-[#0288D1]"
        />
      </label>
      <button type="button" onClick={buy} className={popClass("yellow", "mt-4 w-full")}>
        Beli sesi · {rupiah(mentor.price)}
      </button>
    </div>
  );
}
