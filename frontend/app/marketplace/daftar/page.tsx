"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { COHORTS, FACULTIES, parseTarif, readSession, TARIF_HINT, writeReviewState } from "../data";
import { MarketplaceShell, popClass } from "../Shell";

export default function DaftarMentorPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fakultas, setFakultas] = useState(FACULTIES[0].name);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const price = parseTarif(String(data.get("price") || ""));
    if (price === null) {
      setError(TARIF_HINT);
      return;
    }
    const current = readSession();
    if (!current?.verified || !current.token) {
      setError("Masuk dengan SSO terlebih dahulu.");
      return;
    }
    const response = await fetch("/api/marketplace/mentor", {
      method: "POST",
      headers: { Authorization: `Bearer ${current.token}` },
      body: data,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.message || "Pengajuan mentor gagal dikirim.");
      return;
    }
    writeReviewState(body.data);
    router.push("/marketplace/status");
  }

  const prodiOptions = FACULTIES.find((item) => item.name === fakultas)?.prodi || [];

  return (
    <MarketplaceShell>
      <main className="mx-auto max-w-xl px-4 py-10">
        <form onSubmit={submit} className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <h1 className="font-[family-name:var(--font-fredoka)] text-[32px] font-bold leading-none">Pendaftaran mentor</h1>
          <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#607D8B]">
            Pengajuan mentor ditinjau kemahasiswaan. Sebelum disetujui, akun tetap pengguna biasa. Unggah foto profil dan KTM.
          </p>
          <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
            Fakultas
            <select name="fakultas" value={fakultas} onChange={(e) => setFakultas(e.target.value)} className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none">
              {FACULTIES.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
            Program studi
            <select name="prodi" className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none">
              {prodiOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
            Angkatan
            <select name="angkatan" className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none">
              {COHORTS.map((year) => <option key={year}>{year}</option>)}
            </select>
          </label>
          <Field name="course" label="Mata kuliah yang didampingi" />
          <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
            Tarif per sesi
            <span className="mt-0.5 block font-medium leading-relaxed text-[#0277BD]">{TARIF_HINT}</span>
            <input name="price" inputMode="numeric" required placeholder="20000" className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none focus:border-[#0288D1]" />
          </label>
          <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
            Bidang pendampingan
            <textarea name="focus" required rows={3} className="mt-1 w-full rounded-xl border-2 border-[#B3E5FC] px-3 py-2 outline-none focus:border-[#0288D1]" />
          </label>
          <PhotoField name="photo" label="Foto profil" />
          <PhotoField name="ktm" label="Foto KTM" />
          {error ? <p className="mt-3 text-[13px] font-semibold text-[#C62828]">{error}</p> : null}
          <button type="submit" className={popClass("ocean", "mt-5 w-full")}>Kirim pengajuan mentor</button>
        </form>
      </main>
    </MarketplaceShell>
  );
}

function PhotoField({ name, label }: { name: string; label: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="mt-4">
      <p className="text-[13px] font-semibold text-[#455A64]">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {preview ? (
          <img src={preview} alt="" className="h-16 w-16 rounded-2xl border-[3px] border-white object-cover shadow-[3px_3px_0_rgba(0,0,0,0.12)]" />
        ) : null}
        <label className={popClass("ocean", "relative cursor-pointer px-5 py-2.5 text-[15px]")}>
          {file ? "Ganti foto" : "Pilih foto"}
          <input
            name={name}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      <p className="mt-2 text-[12px] font-medium text-[#78909C]">{file ? file.name : "JPG, PNG, atau WebP"}</p>
    </div>
  );
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
      {label}
      <input name={name} type={type} required className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none focus:border-[#0288D1]" />
    </label>
  );
}
