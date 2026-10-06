import Link from "next/link";
import { MarketplaceShell } from "../Shell";

export default function KetentuanPage() {
  return (
    <MarketplaceShell>
      <article className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <h1 className="font-[family-name:var(--font-fredoka)] text-[32px] font-bold">Ketentuan penggunaan</h1>
          <div className="mt-4 space-y-3 text-[14px] font-medium leading-relaxed text-[#455A64]">
            <p>Marketplace Mentor disediakan oleh UKM helPhin bagi mahasiswa Telkom University.</p>
            <p>Mentor menetapkan tarif sesinya sendiri. Tarif tidak boleh melebihi Rp20.000 dan harus berkelipatan Rp1.000.</p>
            <p>Pendampingan membahas pemahaman mata kuliah. Pengerjaan tugas, kuis, atau ujian atas nama mahasiswa lain tidak diperkenankan.</p>
            <p>Pertemuan tatap muka hanya dilakukan di lingkungan kampus.</p>
          </div>
          <Link href="/marketplace" className="mt-6 inline-block font-bold text-[#0288D1]">Kembali ke marketplace</Link>
        </div>
      </article>
    </MarketplaceShell>
  );
}
