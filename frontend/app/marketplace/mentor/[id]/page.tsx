"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChatPane } from "../../ChatPane";
import { getMentor, rupiah } from "../../data";
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
          </div>
        </article>
        <ChatPane mentor={mentor} />
      </main>
    </MarketplaceShell>
  );
}
