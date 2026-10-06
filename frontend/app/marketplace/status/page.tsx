"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readReviewState, type ReviewState } from "../data";
import { MarketplaceShell, popClass } from "../Shell";

export default function StatusPage() {
  const [state, setState] = useState<ReviewState | null>(null);

  useEffect(() => {
    setState(readReviewState());
  }, []);

  const rejected = state?.status === "ditolak";

  return (
    <MarketplaceShell>
      <main className="mx-auto max-w-xl px-4 py-10">
        <section className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <p className="text-[13px] font-semibold text-[#0288D1]">Status pengajuan</p>
          <h1 className="mt-1 font-[family-name:var(--font-fredoka)] text-[32px] font-bold leading-none">
            {rejected ? "Pengajuan mentor ditolak" : "Pengajuan mentor menunggu"}
          </h1>
          {state ? (
            <>
              <p className="mt-3 text-[14px] font-medium leading-relaxed text-[#455A64]">
                {rejected
                  ? "Kemahasiswaan belum menyetujui pendaftaran mentor. Kamu tetap bisa memakai marketplace sebagai pengguna, lalu kirim ulang berkas."
                  : `${state.name} tetap bisa masuk sebagai pengguna. Status mentor aktif setelah kemahasiswaan menyetujui foto profil dan KTM.`}
              </p>
              {state.reviewNote ? <p className="mt-3 rounded-2xl bg-[#F7FCFF] px-4 py-3 text-[14px] font-medium text-[#455A64]">{state.reviewNote}</p> : null}
            </>
          ) : (
            <p className="mt-3 text-[14px] font-medium text-[#607D8B]">Belum ada pengajuan pada peramban ini.</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {rejected ? <Link href="/marketplace/daftar" className={popClass("ocean")}>Kirim ulang</Link> : null}
            <Link href="/marketplace?tampilan=direktori" className={popClass("white")}>Lanjut sebagai pengguna</Link>
          </div>
        </section>
      </main>
    </MarketplaceShell>
  );
}
