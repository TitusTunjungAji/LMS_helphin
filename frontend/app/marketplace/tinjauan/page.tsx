"use client";

import { useEffect, useState } from "react";
import { MarketplaceShell, popClass } from "../Shell";

type Application = {
  id: string;
  name: string;
  email: string;
  nim: string;
  phone: string;
  fakultas: string;
  prodi: string;
  angkatan: string;
  status: string;
  reviewNote: string;
};

const TOKEN_KEY = "helphin-marketplace-review-token";

export default function TinjauanPage() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [localStaff, setLocalStaff] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Application[]>([]);
  const [photos, setPhotos] = useState<Record<string, { foto: string; ktm: string }>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY) || "";
    setToken(saved);
    fetch("/api/marketplace/mode").then((response) => response.json()).then((body) => {
      if (body.data?.storage === "local") setLocalStaff(body.data.staffEmail || "");
    }).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    (async () => {
      const response = await fetch("/api/marketplace/tinjauan?status=menunggu", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        sessionStorage.removeItem(TOKEN_KEY);
        if (!cancel) {
          setToken("");
          setError(body?.message || "Sesi tinjauan berakhir.");
        }
        return;
      }
      const list = (body.data || []) as Application[];
      if (!cancel) setRows(list);
      const images: Record<string, { foto: string; ktm: string }> = {};
      await Promise.all(list.map(async (item) => {
        const [foto, ktm] = await Promise.all([loadImage(item.id, "foto", token), loadImage(item.id, "ktm", token)]);
        images[item.id] = { foto, ktm };
      }));
      if (!cancel) setPhotos(images);
    })();
    return () => {
      cancel = true;
    };
  }, [token]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/marketplace/tinjauan/masuk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.message || "Masuk petugas gagal.");
      return;
    }
    sessionStorage.setItem(TOKEN_KEY, body.data.token);
    setToken(body.data.token);
  }

  async function decide(id: string, keputusan: "disetujui" | "ditolak") {
    setError("");
    const response = await fetch(`/api/marketplace/tinjauan/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ keputusan, catatan: notes[id] || "" }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.message || "Keputusan gagal disimpan.");
      return;
    }
    setRows((current) => current.filter((item) => item.id !== id));
  }

  return (
    <MarketplaceShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <h1 className="font-[family-name:var(--font-fredoka)] text-[32px] font-bold leading-none">Tinjauan kemahasiswaan</h1>
          <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#607D8B]">
            Periksa foto profil dan KTM. Setujui hanya mahasiswa Telkom University yang terdata.
          </p>
        </section>
        {!ready ? null : !token ? (
          <form onSubmit={login} className="mx-auto mt-4 max-w-md rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
            <label className="block text-[13px] font-semibold text-[#455A64]">
              Email petugas
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none" />
            </label>
            <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
              Kata sandi
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none" />
            </label>
            {localStaff ? <p className="mt-3 text-[13px] font-medium leading-relaxed text-[#0277BD]">Basis data lokal sedang dipakai. Masuk petugas dengan {localStaff} dan kata sandi HelphinTinjau2026.</p> : null}
            {error ? <p className="mt-3 text-[13px] font-semibold text-[#C62828]">{error}</p> : null}
            <button type="submit" className={popClass("ocean", "mt-5 w-full")}>Masuk tinjauan</button>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            {error ? <p className="text-[13px] font-semibold text-[#C62828]">{error}</p> : null}
            {rows.length === 0 ? (
              <p className="rounded-[28px] border-[3px] border-white bg-white p-6 text-[14px] font-medium text-[#607D8B] shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
                Tidak ada pengajuan yang menunggu.
              </p>
            ) : rows.map((item) => (
              <article key={item.id} className="grid gap-4 rounded-[28px] border-[3px] border-white bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.12)] md:grid-cols-[180px_180px_1fr]">
                <Figure label="Foto profil" src={photos[item.id]?.foto} />
                <Figure label="KTM" src={photos[item.id]?.ktm} />
                <div>
                  <h2 className="font-[family-name:var(--font-fredoka)] text-[24px] font-bold leading-none">{item.name}</h2>
                  <p className="mt-2 text-[14px] font-medium text-[#455A64]">{item.nim} · {item.email}</p>
                  <p className="mt-1 text-[14px] font-medium text-[#607D8B]">{item.fakultas} · {item.prodi} · {item.angkatan}</p>
                  <p className="mt-1 text-[14px] font-medium text-[#607D8B]">{item.phone}</p>
                  <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
                    Catatan
                    <textarea value={notes[item.id] || ""} onChange={(e) => setNotes((current) => ({ ...current, [item.id]: e.target.value }))} rows={2} className="mt-1 w-full rounded-xl border-2 border-[#B3E5FC] px-3 py-2 outline-none" />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => decide(item.id, "disetujui")} className={popClass("ocean", "px-4 py-2 text-[14px]")}>Setujui</button>
                    <button type="button" onClick={() => decide(item.id, "ditolak")} className={popClass("white", "px-4 py-2 text-[14px]")}>Tolak</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </MarketplaceShell>
  );
}

function Figure({ label, src }: { label: string; src?: string }) {
  return (
    <figure>
      <figcaption className="text-[12px] font-semibold text-[#78909C]">{label}</figcaption>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="mt-1 h-44 w-full rounded-2xl border-2 border-[#E1F5FE] object-cover" />
      ) : (
        <div className="mt-1 h-44 rounded-2xl bg-[#F7FCFF]" />
      )}
    </figure>
  );
}

async function loadImage(id: string, jenis: "foto" | "ktm", token: string) {
  const response = await fetch(`/api/marketplace/berkas/${id}/${jenis}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return "";
  return URL.createObjectURL(await response.blob());
}
