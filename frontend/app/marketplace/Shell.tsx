"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Atmosphere from "./Atmosphere";
import { clearSession, confirmSession, readSession, type MarketplaceSession } from "./data";

const pop =
  "inline-flex items-center justify-center rounded-full border-[3px] border-white px-5 py-2.5 font-[family-name:var(--font-fredoka)] text-[15px] font-semibold shadow-[4px_4px_0_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5 hover:shadow-[5px_6px_0_rgba(0,0,0,0.16)] active:translate-y-0.5 active:shadow-[1px_1px_0_rgba(0,0,0,0.12)]";

export function popClass(tone: "ocean" | "yellow" | "white" = "ocean", extra = "") {
  const tones = {
    ocean: "bg-[#0288D1] text-white",
    yellow: "bg-[#FFEB3B] text-[#263238]",
    white: "bg-white text-[#263238]",
  };
  return `${pop} ${tones[tone]} ${extra}`;
}

export function MarketplaceShell({
  children,
  query,
  onQuery,
  home = "user",
}: {
  children: React.ReactNode;
  query?: string;
  onQuery?: (value: string) => void;
  home?: "user" | "mentor";
}) {
  const [session, setSession] = useState<MarketplaceSession | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const live = typeof onQuery === "function";
  const openPath = ["/marketplace/masuk", "/marketplace/akun", "/marketplace/status", "/marketplace/tinjauan", "/marketplace/ketentuan", "/marketplace/privasi"].includes(pathname);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (openPath) {
        const current = readSession();
        if (!cancel) setSession(current?.verified ? current : null);
        if (!cancel) setReady(true);
        return;
      }
      const confirmed = await confirmSession();
      if (cancel) return;
      if (!confirmed) {
        setSession(null);
        setReady(false);
        router.replace("/marketplace/masuk");
        return;
      }
      setSession(confirmed);
      setReady(true);
    })();
    return () => {
      cancel = true;
    };
  }, [openPath, pathname, router]);

  return (
    <div className="min-h-screen font-[family-name:var(--font-outfit)] text-[#263238]">
      <Atmosphere />
      <header className="sticky top-0 z-30 border-b-[3px] border-white/80 bg-[#E1F5FE]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-5">
          <Link href="/marketplace" className="flex shrink-0 items-center gap-2 rounded-full border-[3px] border-white bg-white py-1 pl-2 pr-3 shadow-[4px_4px_0_rgba(0,0,0,0.12)]">
            <Image src="/helphin/telkom-university.png" alt="Telkom University" width={148} height={40} className="h-9 w-auto" />
            <span className="font-[family-name:var(--font-fredoka)] text-[18px] font-bold text-[#0288D1]" aria-hidden>×</span>
            <Image src="/helphin/ukmhelphintelkomlong.png" alt="UKM helPhin" width={168} height={56} className="h-11 w-auto" />
          </Link>
          {session?.mentor && !live ? <div className="hidden min-w-0 flex-1 md:block" /> : (
          <form className="hidden min-w-0 flex-1 md:block" action="/marketplace?tampilan=direktori" onSubmit={live ? (e) => e.preventDefault() : undefined}>
            <label className="flex h-12 items-center rounded-full border-[3px] border-white bg-white px-4 shadow-[4px_4px_0_rgba(0,0,0,0.1)]">
              <span className="sr-only">Cari mentor</span>
              <input
                name="q"
                value={live ? query : undefined}
                defaultValue={live ? undefined : ""}
                onChange={live ? (e) => onQuery?.(e.target.value) : undefined}
                placeholder="Cari nama mentor"
                className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-[#90A4AE]"
              />
            </label>
          </form>
          )}
          <nav className="relative ml-auto flex shrink-0 items-center gap-2">
            {session?.mentor && home === "mentor" ? (
              <Link href="/marketplace?tampilan=direktori" className={popClass("white", "px-4 py-2 text-[14px]")}>Halaman pengguna</Link>
            ) : null}
            {session?.mentor && home !== "mentor" ? (
              <Link href="/marketplace" className={popClass("yellow", "px-4 py-2 text-[14px]")}>Dashboard</Link>
            ) : null}
            {session ? (
              <ProfileMenu
                mentor={Boolean(session.mentor)}
                onLogout={() => {
                  clearSession();
                  setSession(null);
                  router.push("/marketplace/masuk");
                }}
              />
            ) : (
              <Link href="/marketplace/masuk" className={popClass("white", "px-4 py-2 text-[14px]")}>Masuk</Link>
            )}
            {session?.mentor ? null : session ? (
              <Link href="/marketplace/daftar" className={popClass("yellow", "px-4 py-2 text-[14px]")}>Menjadi Mentor</Link>
            ) : null}
          </nav>
        </div>
      </header>
      <div className="relative z-20">{ready ? children : <MarketplaceLoading />}</div>
      <footer className="relative z-[2] px-4 pb-10 pt-4 md:px-5">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border-[3px] border-white bg-white shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <div className="relative overflow-hidden bg-[#0288D1] px-6 pb-10 pt-5 text-white">
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex w-fit items-center gap-2 rounded-full border-[3px] border-white bg-white px-3 py-1 shadow-[4px_4px_0_rgba(0,0,0,0.12)]">
                <Image src="/helphin/telkom-university.png" alt="" width={110} height={30} className="h-7 w-auto" />
                <span className="font-[family-name:var(--font-fredoka)] font-bold text-[#0288D1]">×</span>
                <Image src="/helphin/ukmhelphintelkomlong.png" alt="" width={130} height={44} className="h-8 w-auto" />
              </div>
              <p className="max-w-sm rounded-2xl bg-white/15 px-4 py-3 text-[13px] font-medium leading-relaxed">
                Marketplace Mentor helPhin menghubungkan mahasiswa Telkom University dengan pendamping belajar dari sesama mahasiswa untuk sesi daring maupun di lingkungan kampus.
              </p>
            </div>
            <svg className="absolute bottom-0 left-0 h-8 w-full" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden>
              <path fill="#ffffff" d="M0 26c80 16 160-16 240 0s160 16 240 0 160-16 240 0 160 16 240 0 160-16 240 0 160 16 240 0v22H0Z" />
            </svg>
          </div>
          <div className="grid gap-6 px-6 pb-6 pt-2 md:grid-cols-3">
            <FooterCol title="Layanan" links={[
              ["Pencarian mentor", "/marketplace?tampilan=direktori"],
              ["Pendampingan daring", "/marketplace?tampilan=direktori&metode=Daring"],
              ["Pendampingan di kampus", "/marketplace?tampilan=direktori&metode=Tatap%20muka"],
            ]} />
            <FooterCol title="Keanggotaan" links={session?.mentor ? [
              ["Halaman pengguna", "/marketplace?tampilan=direktori"],
              ["Dashboard mentor", "/marketplace"],
              ["Pesanan saya", "/marketplace/pesanan"],
              ["Setelan akun", "/marketplace/setelan"],
            ] : session ? [
              ["Pesanan saya", "/marketplace/pesanan"],
              ["Menjadi mentor", "/marketplace/daftar"],
              ["Setelan akun", "/marketplace/setelan"],
            ] : [
              ["Masuk", "/marketplace/masuk"],
              ["Menjadi mentor", "/marketplace/daftar"],
            ]} />
            <FooterCol title="Informasi" links={[
              ["Ketentuan penggunaan", "/marketplace/ketentuan"],
              ["Kebijakan privasi", "/marketplace/privasi"],
            ]} />
          </div>
          <div className="bg-[#E1F5FE] px-6 py-3 text-center text-[12px] font-semibold text-[#0277BD]">
            © {new Date().getFullYear()} UKM helPhin · Telkom University
          </div>
        </div>
      </footer>
    </div>
  );
}

export function MarketplaceLoading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center rounded-[28px] border-[3px] border-white bg-white px-10 py-8 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
        <div className="flex items-end gap-2.5" aria-hidden>
          <span className="mp-load-dot bg-[#0288D1]" />
          <span className="mp-load-dot bg-[#FFEB3B]" style={{ animationDelay: "0.15s" }} />
          <span className="mp-load-dot bg-[#FF7043]" style={{ animationDelay: "0.3s" }} />
        </div>
        <p className="mt-4 font-[family-name:var(--font-fredoka)] text-[20px] font-bold text-[#0277BD]">Memuat</p>
      </div>
    </main>
  );
}

function ProfileMenu({ mentor, onLogout }: { mentor: boolean; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Akun"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-[#0288D1] text-white shadow-[4px_4px_0_rgba(0,0,0,0.12)]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.5 19.2c1.4-3 3.7-4.4 6.5-4.4s5.1 1.4 6.5 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-52 rounded-2xl border-[3px] border-white bg-white p-2 shadow-[5px_5px_0_rgba(0,0,0,0.12)]">
          {mentor ? (
            <Link href="/marketplace?tampilan=direktori" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-[13px] font-semibold text-[#263238] hover:bg-[#E1F5FE]">
              Halaman pengguna
            </Link>
          ) : null}
          <Link href="/marketplace/pesanan" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-[13px] font-semibold text-[#263238] hover:bg-[#E1F5FE]">
            Pesanan saya
          </Link>
          <Link href="/marketplace/setelan" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-[13px] font-semibold text-[#263238] hover:bg-[#E1F5FE]">
            Setelan akun
          </Link>
          {mentor ? (
            <Link href="/marketplace" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-[13px] font-semibold text-[#263238] hover:bg-[#E1F5FE]">
              Dashboard mentor
            </Link>
          ) : null}
          <button type="button" onClick={onLogout} className="block w-full rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-[#C62828] hover:bg-[#FFEBEE]">
            Keluar
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <p className="font-[family-name:var(--font-fredoka)] text-[16px] font-bold text-[#263238]">
        <span className="mr-1.5 text-[#F9A825]" aria-hidden>★</span>
        {title}
      </p>
      <ul className="mt-3 space-y-1.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="inline-flex rounded-full px-3 py-1 text-[14px] font-semibold text-[#0277BD] hover:bg-[#E1F5FE]">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
