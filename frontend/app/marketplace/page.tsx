"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { COHORTS, FACULTIES, MENTORS, readSession, rupiah, type MarketplaceSession, type Mentor } from "./data";
import { ChatDock } from "./Inbox";
import { MentorHome } from "./MentorHome";
import { MarketplaceLoading, MarketplaceShell, popClass } from "./Shell";

const METHODS = ["Semua", "Daring", "Tatap muka"] as const;

type SortKey = "sesuai" | "tarif" | "penilaian";

function Stars({ value }: { value: number }) {
  return (
    <span className="text-[13px] tracking-tight text-[#F9A825]" aria-label={`Penilaian ${value} dari 5`}>
      {"★★★★★".slice(0, Math.round(value))}
      <span className="text-[#CFD8DC]">{"★★★★★".slice(Math.round(value))}</span>
    </span>
  );
}

function Listing({ mentor, delay }: { mentor: Mentor; delay: number }) {
  return (
    <article
      style={{ animationDelay: `${delay}ms` }}
      className="group mp-card flex h-full flex-col overflow-hidden rounded-[24px] border-[3px] border-white bg-white shadow-[6px_6px_0_rgba(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[8px_10px_0_rgba(0,0,0,0.14)]"
    >
      <div className="relative h-[230px]" style={{ background: mentor.wash }}>
        <Image
          src={`/marketplace/mentor-${mentor.id}.jpg`}
          alt={mentor.name}
          fill
          className="object-cover object-[center_16%] transition duration-500 group-hover:scale-[1.03]"
          sizes="(min-width: 1024px) 320px, 100vw"
        />
        <span className="absolute left-3 top-3 rounded-full border-2 border-white bg-[#FFEB3B] px-3 py-1 font-[family-name:var(--font-fredoka)] text-[12px] font-semibold text-[#263238] shadow-[3px_3px_0_rgba(0,0,0,0.1)]">
          {mentor.badge}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-fredoka)] text-[22px] font-bold leading-none text-[#263238]">{mentor.name}</h2>
            <p className="mt-1 text-[12px] font-semibold text-[#607D8B]">S1 {mentor.prodi} · Angkatan {mentor.angkatan}</p>
          </div>
          <p className="text-right font-[family-name:var(--font-fredoka)] text-[18px] font-bold leading-none text-[#0288D1]">
            {rupiah(mentor.price)}
            <span className="mt-1 block text-[11px] font-semibold text-[#90A4AE]">/ sesi</span>
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-[#B3E5FC] bg-[#E1F5FE] px-2.5 py-1 text-[11px] font-semibold text-[#0277BD]">{mentor.course}</span>
          {mentor.methods.map((method) => (
            <span key={method} className="rounded-full bg-[#F5F7F8] px-2.5 py-1 text-[11px] font-semibold text-[#546E7A]">{method}</span>
          ))}
        </div>
        <p className="mt-3 text-[13px] font-medium leading-relaxed text-[#546E7A]">{mentor.focus}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-[12px] font-semibold text-[#78909C]">
          <span className="flex items-center gap-1.5"><Stars value={mentor.rating} /> {mentor.rating.toFixed(1)}</span>
          <span>{mentor.sessions} sesi</span>
        </div>
        <Link href={`/marketplace/mentor/${mentor.id}`} className={popClass("ocean", "mt-3 w-full")}>Lihat profil</Link>
      </div>
    </article>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceShell><MarketplaceLoading /></MarketplaceShell>}>
      <MarketplaceHome />
    </Suspense>
  );
}

function MarketplaceHome() {
  const search = useSearchParams();
  const asDirectory = search.get("tampilan") === "direktori" || search.has("metode");
  const [gate, setGate] = useState<"wait" | "mentor" | "directory">("wait");
  const [session, setSession] = useState<MarketplaceSession | null>(null);

  useEffect(() => {
    const sync = () => {
      const current = readSession();
      const directory = asDirectory || window.location.hash === "#direktori";
      setSession(current);
      setGate(current?.mentor && !directory ? "mentor" : "directory");
    };
    sync();
    window.addEventListener("helphin-session", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("helphin-session", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, [asDirectory]);

  if (gate === "wait") {
    return (
      <MarketplaceShell>
        <MarketplaceLoading />
      </MarketplaceShell>
    );
  }
  if (gate === "mentor" && session?.mentor) return <MentorHome session={session} />;
  return <Directory />;
}

function Directory() {
  const [query, setQuery] = useState("");
  const [fakultas, setFakultas] = useState("Semua");
  const [prodi, setProdi] = useState("Semua");
  const [angkatan, setAngkatan] = useState("Semua");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("Semua");
  const [sort, setSort] = useState<SortKey>("sesuai");
  const [maxPrice, setMaxPrice] = useState(20000);
  const [priceText, setPriceText] = useState("20000");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const metode = params.get("metode");
    if (q) setQuery(q);
    if (metode === "Daring" || metode === "Tatap muka") setMethod(metode);
    if (window.location.hash === "#direktori") {
      document.getElementById("direktori")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  function commitPrice(raw: string) {
    const digits = Number(raw.replace(/\D/g, ""));
    const snapped = Number.isFinite(digits)
      ? Math.min(20000, Math.max(1000, Math.round(digits / 1000) * 1000))
      : 20000;
    setMaxPrice(snapped);
    setPriceText(String(snapped));
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = MENTORS.filter((mentor) => {
      const text = `${mentor.name} ${mentor.fakultas} ${mentor.prodi} ${mentor.angkatan} ${mentor.focus}`.toLowerCase();
      return (
        (fakultas === "Semua" || mentor.fakultas === fakultas) &&
        (prodi === "Semua" || mentor.prodi === prodi) &&
        (angkatan === "Semua" || mentor.angkatan === Number(angkatan)) &&
        (method === "Semua" || mentor.methods.includes(method)) &&
        mentor.price <= maxPrice &&
        (!q || text.includes(q))
      );
    });
    if (sort === "tarif") list.sort((a, b) => a.price - b.price);
    if (sort === "penilaian") list.sort((a, b) => b.rating - a.rating || b.sessions - a.sessions);
    return list;
  }, [query, fakultas, prodi, angkatan, method, sort, maxPrice]);

  return (
    <MarketplaceShell home="user" query={query} onQuery={setQuery}>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-5 md:py-8">
        <form className="mb-4 md:hidden" onSubmit={(e) => e.preventDefault()}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama mentor"
            className="h-12 w-full rounded-full border-[3px] border-white bg-white px-4 text-[14px] font-medium shadow-[4px_4px_0_rgba(0,0,0,0.1)] outline-none"
          />
        </form>

        <section className="group relative mb-5 min-h-[200px] overflow-hidden rounded-[24px] border-4 border-white bg-gradient-to-br from-[#E0F7FA] to-[#B2EBF2] shadow-[6px_6px_0_rgba(0,0,0,0.15)] transition hover:-translate-y-1 hover:shadow-[6px_10px_0_rgba(0,0,0,0.15)] [border-bottom:5px_solid_#4DD0E1]">
          <span className="absolute right-4 top-3 z-20 text-[22px] text-[#FFD54F] [text-shadow:1px_1px_0_#263238]" aria-hidden>★</span>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-full overflow-hidden">
            <Image
              src="/helphin/dolphin-head.png"
              alt="Phinny"
              width={512}
              height={512}
              priority
              className="absolute -bottom-40 -left-16 w-[340px] max-w-none -scale-x-100 object-contain md:-bottom-52 md:-left-10 md:w-[460px]"
            />
          </div>
          <div className="relative z-10 ml-auto w-[62%] px-5 py-8 text-right md:w-[58%] md:py-10 md:pr-10">
            <h1 className="font-[family-name:var(--font-fredoka)] text-[28px] font-bold leading-tight text-[#263238] md:text-[40px]">
              Marketplace <span className="text-[#0288D1]">Mentor</span>
            </h1>
            <p className="mt-1 text-[14px] font-semibold text-[#263238]/70 md:text-[16px]">Pendamping belajar sesuai fakultas, program studi, dan angkatan.</p>
          </div>
        </section>
        <section id="direktori" className="rounded-[28px] border-[3px] border-white bg-white/95 p-4 shadow-[8px_8px_0_rgba(0,0,0,0.12)] md:p-6">
          <div className="flex flex-col gap-3 border-b border-[#ECEFF1] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-fredoka)] text-[28px] font-bold leading-none text-[#263238]">Daftar mentor</h2>
            </div>
            <label className="text-[13px] font-semibold text-[#546E7A]">
              Urutkan
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="ml-2 rounded-full border-2 border-[#B3E5FC] bg-white px-3 py-1.5 font-[family-name:var(--font-fredoka)] text-[14px] text-[#263238] outline-none"
              >
                <option value="sesuai">Paling sesuai</option>
                <option value="penilaian">Penilaian tertinggi</option>
                <option value="tarif">Tarif terendah</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[220px_1fr]">
            <aside className="space-y-5">
              <FilterGroup
                title="Fakultas"
                options={["Semua", ...FACULTIES.map((item) => item.name)]}
                value={fakultas}
                onChange={(value) => {
                  setFakultas(value);
                  setProdi("Semua");
                }}
              />
              <ExpandFilter
                title="Program studi"
                options={["Semua", ...(FACULTIES.find((item) => item.name === fakultas)?.prodi || FACULTIES.flatMap((item) => item.prodi))]}
                value={prodi}
                onChange={setProdi}
              />
              <ExpandFilter title="Angkatan" options={["Semua", ...COHORTS.map(String)]} value={angkatan} onChange={setAngkatan} />
              <FilterGroup title="Metode" options={[...METHODS]} value={method} onChange={(value) => setMethod(value as (typeof METHODS)[number])} />
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-[family-name:var(--font-fredoka)] text-[15px] font-bold">Tarif maksimum</p>
                  <p className="text-[13px] font-semibold text-[#0288D1]">{rupiah(maxPrice)}</p>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={20000}
                  step={1000}
                  value={maxPrice}
                  aria-label="Tarif maksimum per sesi"
                  onChange={(e) => {
                    const value = e.target.value;
                    setMaxPrice(Number(value));
                    setPriceText(value);
                  }}
                  className="mt-3 w-full accent-[#0288D1]"
                />
                <label className="mt-2 block text-[12px] font-semibold text-[#607D8B]">
                  Ketik tarif
                  <input
                    inputMode="numeric"
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value.replace(/[^\d]/g, ""))}
                    onBlur={() => commitPrice(priceText)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitPrice(priceText);
                    }}
                    className="mt-1 h-10 w-full rounded-xl border-2 border-[#B3E5FC] px-3 font-[family-name:var(--font-fredoka)] text-[15px] text-[#263238] outline-none focus:border-[#0288D1]"
                  />
                </label>
                <p className="mt-1 text-[11px] font-medium text-[#90A4AE]">Kelipatan Rp1.000, dari Rp1.000 sampai Rp20.000.</p>
              </div>
              <p className="text-[13px] font-semibold text-[#0288D1]">{visible.length} mentor ditampilkan</p>
            </aside>

            {visible.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center rounded-[20px] bg-[#F7FCFF] text-center font-[family-name:var(--font-fredoka)] text-[18px] text-[#546E7A]">
                Tidak ada mentor yang sesuai dengan saringan ini.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((mentor, index) => (
                  <Listing key={mentor.id} mentor={mentor} delay={index * 60} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <ChatDock />
    </MarketplaceShell>
  );
}

function ExpandFilter({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between border-b border-[#ECEFF1] py-2 text-left"
      >
        <span className="font-[family-name:var(--font-fredoka)] text-[14px] font-semibold text-[#263238]">{title}</span>
        <span className="text-[12px] font-medium text-[#0288D1]">{open ? "Tutup" : value}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-1.5 pl-1">
          {options.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#455A64]">
              <input type="radio" name={title} checked={value === option} onChange={() => onChange(option)} className="accent-[#0288D1]" />
              {option}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="font-[family-name:var(--font-fredoka)] text-[15px] font-bold">{title}</p>
      <div className="mt-2 space-y-1.5">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#455A64]">
            <input
              type="radio"
              name={title}
              checked={value === option}
              onChange={() => onChange(option)}
              className="accent-[#0288D1]"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}
