"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DUMMY_SSO, sessionFromAccount, writeReviewState, writeSession } from "../data";
import { MarketplaceShell, popClass } from "../Shell";

function takeReturnPath(fallback: string) {
  const next = sessionStorage.getItem("helphin-marketplace-next") || "";
  sessionStorage.removeItem("helphin-marketplace-next");
  if (next.startsWith("/marketplace/") && !next.startsWith("//")) return next;
  return fallback;
}

export default function MasukPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);

  async function sso() {
    setError("");
    setPending(true);
    const response = await fetch("/api/marketplace/sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: DUMMY_SSO.email }),
    });
    const body = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(body?.message || "SSO dummy gagal. Coba lagi.");
      return;
    }
    writeSession(sessionFromAccount(body.data, body.data.token));
    router.push(takeReturnPath("/marketplace?tampilan=direktori"));
  }

  async function staff(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    const response = await fetch("/api/marketplace/masuk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(body?.message || "Masuk petugas gagal.");
      return;
    }
    if (body.data.role === "petugas") {
      sessionStorage.setItem("helphin-marketplace-review-token", body.data.token);
      router.push("/marketplace/tinjauan");
      return;
    }
    if (body.data.status && body.data.status !== "disetujui" && body.data.status !== "pengguna") {
      writeReviewState({
        name: body.data.name,
        email: body.data.email,
        nim: body.data.nim,
        status: body.data.status,
        reviewNote: body.data.reviewNote || "",
      });
      router.push("/marketplace/status");
      return;
    }
    writeSession(sessionFromAccount(body.data, body.data.token));
    const home = body.data.mentorCourse && body.data.status === "disetujui" ? "/marketplace" : "/marketplace?tampilan=direktori";
    router.push(takeReturnPath(home));
  }

  return (
    <MarketplaceShell>
      <main className="mx-auto max-w-md px-4 py-10">
        <section className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <h1 className="font-[family-name:var(--font-fredoka)] text-[32px] font-bold leading-none">Masuk</h1>
          <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#607D8B]">
            Mahasiswa masuk langsung. SSO Telkom yang asli menyusul. Untuk sekarang gunakan akun dummy di bawah ini.
          </p>
          <div className="mt-5 rounded-2xl bg-[#E1F5FE] px-4 py-3">
            <p className="text-[12px] font-semibold text-[#0277BD]">Email SSO dummy</p>
            <p className="mt-1 font-[family-name:var(--font-fredoka)] text-[16px] font-bold text-[#263238]">{DUMMY_SSO.email}</p>
            <p className="mt-1 text-[13px] font-medium text-[#455A64]">{DUMMY_SSO.name} · {DUMMY_SSO.nim}</p>
          </div>
          {error ? <p className="mt-3 text-[13px] font-semibold text-[#C62828]">{error}</p> : null}
          <button type="button" disabled={pending} onClick={sso} className={popClass("ocean", "mt-5 w-full")}>
            {pending ? "Memeriksa…" : "Masuk dengan SSO Telkom"}
          </button>
          <button type="button" onClick={() => setStaffOpen((value) => !value)} className="mt-4 block w-full text-center text-[13px] font-bold text-[#0288D1]">
            Petugas kemahasiswaan
          </button>
          {staffOpen ? (
            <form onSubmit={staff} className="mt-3">
              <label className="block text-[13px] font-semibold text-[#455A64]">
                Email petugas
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none focus:border-[#0288D1]" />
              </label>
              <label className="mt-3 block text-[13px] font-semibold text-[#455A64]">
                Kata sandi
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 h-11 w-full rounded-xl border-2 border-[#B3E5FC] px-3 outline-none focus:border-[#0288D1]" />
              </label>
              <button type="submit" disabled={pending} className={popClass("white", "mt-3 w-full")}>Masuk tinjauan</button>
            </form>
          ) : null}
          <p className="mt-4 text-center text-[13px] font-medium text-[#607D8B]">
            Ingin menjadi mentor? Masuk dulu, lalu ajukan. <Link href="/marketplace/daftar" className="font-bold text-[#0288D1]">Lihat syarat mentor</Link>
          </p>
        </section>
      </main>
    </MarketplaceShell>
  );
}
