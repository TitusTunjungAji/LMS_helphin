import Link from "next/link";
import { MarketplaceShell } from "../Shell";

export default function PrivasiPage() {
  return (
    <MarketplaceShell>
      <article className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <h1 className="font-[family-name:var(--font-fredoka)] text-[32px] font-bold">Kebijakan privasi</h1>
          <div className="mt-4 space-y-3 text-[14px] font-medium leading-relaxed text-[#455A64]">
            <p>Data yang dikumpulkan terbatas pada nama, email, NIM, program studi, dan isi percakapan dengan mentor.</p>
            <p>Data digunakan untuk verifikasi mahasiswa Telkom University dan penyelenggaraan sesi pendampingan.</p>
            <p>UKM helPhin tidak memublikasikan NIM atau kata sandi.</p>
          </div>
          <Link href="/marketplace" className="mt-6 inline-block font-bold text-[#0288D1]">Kembali ke marketplace</Link>
        </div>
      </article>
    </MarketplaceShell>
  );
}
