"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COHORTS, FACULTIES, parseTarif, readSession, TARIF_HINT, writeSession, type MarketplaceSession } from "../data";
import { MarketplaceShell, popClass } from "../Shell";

export default function SetelanPage() {
  const [session, setSession] = useState<MarketplaceSession | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSession(readSession());
  }, []);

  function patch(partial: Partial<MarketplaceSession>) {
    setSession((current) => current ? { ...current, ...partial } : current);
    setSaved(false);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    if (session.mentor && parseTarif(String(session.mentor.price)) === null) {
      setError(TARIF_HINT);
      setSaved(false);
      return;
    }
    setError("");
    writeSession(session);
    setSaved(true);
  }

  const prodiOptions = FACULTIES.find((item) => item.name === session?.fakultas)?.prodi || FACULTIES.flatMap((item) => item.prodi);

  return (
    <MarketplaceShell>
      <main className="mx-auto max-w-2xl px-4 py-10">
        {!session ? (
          <div className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
            <h1 className="font-[family-name:var(--font-fredoka)] text-[32px] font-bold">Setelan akun</h1>
            <p className="mt-2 text-[14px] font-medium text-[#607D8B]">Masuk terlebih dahulu untuk mengubah profil.</p>
            <Link href="/marketplace/masuk" className={popClass("ocean", "mt-5")}>Masuk</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <section className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
              <h1 className="font-[family-name:var(--font-fredoka)] text-[32px] font-bold leading-none">Setelan akun</h1>
              <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#607D8B]">Data ini tampil pada akun Anda. Email tidak diubah dari halaman ini.</p>
              <Field label="Nama lengkap" hint="Nama yang terlihat oleh mahasiswa lain." value={session.name} onChange={(name) => patch({ name })} />
              <Field label="Email" hint="Alamat masuk akun. Tidak dapat diubah di sini." value={session.email} readOnly onChange={() => undefined} />
              <Field label="NIM" hint="Nomor induk mahasiswa Telkom University." value={session.nim} onChange={(nim) => patch({ nim })} />
              <Field label="Nomor telepon" hint="Dipakai jika sesi perlu dihubungi di luar percakapan." value={session.phone} onChange={(phone) => patch({ phone })} />
            </section>
            <section className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
              <h2 className="font-[family-name:var(--font-fredoka)] text-[22px] font-bold">Data akademik</h2>
              <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
                Fakultas
                <span className="mt-0.5 block font-medium text-[#78909C]">Menentukan daftar program studi.</span>
                <select value={session.fakultas} onChange={(e) => patch({ fakultas: e.target.value, prodi: "" })} className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none">
                  <option value="">Pilih fakultas</option>
                  {FACULTIES.map((item) => <option key={item.name}>{item.name}</option>)}
                </select>
              </label>
              <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
                Program studi
                <select value={session.prodi} onChange={(e) => patch({ prodi: e.target.value })} className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none">
                  <option value="">Pilih program studi</option>
                  {prodiOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
                Angkatan
                <span className="mt-0.5 block font-medium text-[#78909C]">Marketplace ini dimulai dari angkatan 2022.</span>
                <select value={session.angkatan} onChange={(e) => patch({ angkatan: e.target.value })} className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none">
                  <option value="">Pilih angkatan</option>
                  {COHORTS.map((year) => <option key={year}>{year}</option>)}
                </select>
              </label>
              <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
                Tentang Anda
                <span className="mt-0.5 block font-medium text-[#78909C]">Ringkasan singkat yang membantu mahasiswa mengenal Anda.</span>
                <textarea value={session.bio} onChange={(e) => patch({ bio: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border-2 border-[#B3E5FC] px-3 py-2 outline-none focus:border-[#0288D1]" />
              </label>
            </section>
            {session.mentor ? (
              <section className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
                <h2 className="font-[family-name:var(--font-fredoka)] text-[22px] font-bold">Profil mentor</h2>
                <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#0277BD]">{TARIF_HINT}</p>
                <Field label="Mata kuliah" hint="Mata kuliah yang Anda dampingi." value={session.mentor.course} onChange={(course) => patch({ mentor: { ...session.mentor!, course } })} />
                <Field label="Tarif per sesi" hint="Angka tanpa titik, contoh 15000." value={String(session.mentor.price)} onChange={(price) => patch({ mentor: { ...session.mentor!, price: Number(price.replace(/\D/g, "")) || 0 } })} />
                <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
                  Bidang pendampingan
                  <textarea value={session.mentor.focus} onChange={(e) => patch({ mentor: { ...session.mentor!, focus: e.target.value } })} rows={3} className="mt-1 w-full rounded-xl border-2 border-[#B3E5FC] px-3 py-2 outline-none focus:border-[#0288D1]" />
                </label>
              </section>
            ) : null}
            {error ? <p className="text-[13px] font-semibold text-[#C62828]">{error}</p> : null}
            {saved ? <p className="text-[13px] font-semibold text-[#0277BD]">Perubahan disimpan.</p> : null}
            <button type="submit" className={popClass("ocean", "w-full")}>Simpan profil</button>
          </form>
        )}
      </main>
    </MarketplaceShell>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  readOnly = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
      {label}
      {hint ? <span className="mt-0.5 block font-medium text-[#78909C]">{hint}</span> : null}
      <input value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none read-only:bg-[#F7FCFF] focus:border-[#0288D1]" />
    </label>
  );
}
