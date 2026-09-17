"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Search,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Inbox,
} from "lucide-react";
import CampusHero from "@/components/CampusHero";
import BrandRings from "@/components/BrandRings";
import { API_URL } from "@/lib/api";

interface ResponsiItem {
  id: string;
  title: string;
  description: string | null;
  speaker: string | null;
  topic: string | null;
  scheduleDate: string;
  durationMinutes: number | null;
  meetingLink: string | null;
  status: string;
  mataKuliahId: string | null;
  mataKuliahName: string | null;
  prodiId: string;
  prodiName: string | null;
}

interface MataKuliahItem {
  id: string;
  name: string;
  coverUrl?: string | null;
  prodiId: string;
  prodiName: string | null;
  materialCount?: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `Pukul ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} WIB`;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; prodiId?: string } | null>(null);
  const [prodiName, setProdiName] = useState("");
  const [responsiList, setResponsiList] = useState<ResponsiItem[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliahItem[]>([]);
  const [searchMatkul, setSearchMatkul] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const responsiScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
      } catch {
        setUser({ name: "Student" });
      }
    }

    setIsMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/dashboard/stats?view=student`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      const data = await res.json();

      if (data.success) {
        const now = new Date();
        const activeResponsi = (data.data.upcomingResponsi || []).filter((r: ResponsiItem) => {
          const start = new Date(r.scheduleDate);
          const end = new Date(start.getTime() + (r.durationMinutes || 60) * 60000);
          return end > now;
        });
        setResponsiList(activeResponsi);
        setMataKuliahList(data.data.mataKuliah || []);
        setProdiName(data.data.prodiName || "");
      }
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollResponsi = (direction: "left" | "right") => {
    if (responsiScrollRef.current) {
      const scrollAmount = 260;
      responsiScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const filteredMatkul = mataKuliahList.filter((mk) =>
    mk.name.toLowerCase().includes(searchMatkul.toLowerCase())
  );

  const displayedMatkul = filteredMatkul.slice(0, 8);
  const firstName = isMounted && user?.name ? user.name.split(" ")[0] : "Student";

  return (
    <div className="p-5 md:p-7 space-y-8 relative">
      <CampusHero
        title={`Hallo, ${firstName}`}
        subtitle={`Prodi ${isLoading ? "..." : (prodiName || "S1 Informatika")}`}
        pills={[
          `${isLoading ? "—" : mataKuliahList.length} Mata Kuliah`,
          `${isLoading ? "—" : responsiList.length} Responsi`,
        ]}
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="hp-stat">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/10 text-[#068DFF] flex items-center justify-center shrink-0">
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-none">
              {isLoading ? "—" : mataKuliahList.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Mata kuliah</p>
          </div>
        </div>
        <div className="hp-stat">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/10 text-[#068DFF] flex items-center justify-center shrink-0">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-none">
              {isLoading ? "—" : responsiList.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Responsi aktif</p>
          </div>
        </div>
        <button type="button" onClick={() => router.push("/student/request-materi")} className="hp-stat text-left w-full">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/10 text-[#068DFF] flex items-center justify-center shrink-0">
            <Inbox size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">Ajukan</p>
            <p className="text-[11px] text-slate-400 mt-1">Request materi</p>
          </div>
        </button>
      </div>

        {/* ==================== RESPONSI SECTION ==================== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="hp-section-title">
              <div className="hp-section-bar"></div>
              <h2>Responsi</h2>
            </div>
            {responsiList.length > 3 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollResponsi("left")}
                  className="p-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  <ChevronLeft size={16} className="text-gray-500 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => scrollResponsi("right")}
                  className="p-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  <ChevronRight size={16} className="text-gray-500 dark:text-slate-400" />
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="min-w-[240px] h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-gray-100 dark:border-slate-800"></div>
              ))}
            </div>
          ) : responsiList.length === 0 ? (
            <div className="hp-empty">
              <div className="w-14 h-14 bg-blue-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} className="text-[#068DFF]" />
              </div>
              <p className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Belum ada responsi yang akan datang</p>
              <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">Responsi dari semua mata kuliah akan tampil di sini</p>
            </div>
          ) : (
            <div
              ref={responsiScrollRef}
              className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {responsiList.map((item) => {
                const start = new Date(item.scheduleDate);
                const end = new Date(start.getTime() + (item.durationMinutes || 60) * 60000);
                const now = new Date();
                const live = now >= start && now <= end;
                return (
                  <div
                    key={item.id}
                    className="min-w-[240px] max-w-[240px] hp-card overflow-hidden flex flex-col"
                  >
                    <div
                      data-responsi-thumb
                      className="relative h-[148px] w-full bg-[#068DFF] overflow-hidden px-4 py-4 flex flex-col"
                    >
                      <BrandRings className="absolute -right-14 -top-16 w-44 h-44 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 opacity-25 pointer-events-none">
                        <img src="/images/Vector%201.svg" alt="" className="w-full object-cover" />
                      </div>
                      <div className="relative z-10 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[40px] font-semibold text-white leading-none">{start.getDate()}</p>
                          <p className="text-[11px] text-white/80 mt-1">
                            {start.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                          </p>
                        </div>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${live ? "bg-emerald-300 text-emerald-950" : "bg-white/20 text-white"}`}>
                          {live ? "Live" : "Akan Datang"}
                        </span>
                      </div>
                      <div className="relative z-10 mt-auto">
                        <p className="text-[10px] text-white/75">Responsi</p>
                        <p className="text-white font-semibold text-sm leading-tight line-clamp-1">
                          {item.mataKuliahName || "Umum"}
                        </p>
                        <p className="text-[11px] text-white/80 mt-1">{formatTime(item.scheduleDate)}</p>
                      </div>
                    </div>

                    <div className="px-4 py-3 flex-1 flex flex-col">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-snug line-clamp-2 mb-3">
                        {item.title}
                      </h3>

                      <div className="space-y-1.5 text-[11px] text-gray-500 dark:text-slate-400 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
                          <span className="font-medium">{formatDate(item.scheduleDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
                          <span className="font-medium">{formatTime(item.scheduleDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <button
                        onClick={() => router.push(`/student/responsi/${item.id}`)}
                        className="w-full py-2 bg-[#068DFF] hover:bg-[#0570CC] text-white text-[12px] font-semibold rounded-full transition-all active:scale-[0.97]"
                      >
                        Bergabung
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ==================== MATA KULIAH SECTION ==================== */}
        <section>
          {/* --- HEADER SECTION --- */}
          <div className="flex items-center justify-between mb-4">
            <div className="hp-section-title">
              <div className="hp-section-bar"></div>
              <h2>Mata Kuliah</h2>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Cari Mata Kuliah"
                value={searchMatkul}
                onChange={(e) => setSearchMatkul(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-xs text-gray-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-300 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all w-44"
              />
            </div>
          </div>

          {/* --- STATE HANDLING --- */}
          {isLoading ? (
            /* Loading Skeleton */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl animate-pulse border border-gray-100 dark:border-slate-800"></div>
              ))}
            </div>
          ) : mataKuliahList.length === 0 ? (
            <div className="hp-empty">
              <div className="w-14 h-14 bg-blue-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <BookOpen size={24} className="text-[#068DFF]" />
              </div>
              <p className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Belum ada mata kuliah tersedia</p>
            </div>
          ) : (
            <>
              {/* --- GRID MATA KULIAH (LIMIT 4) --- */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {/* Menggunakan slice(0, 4) untuk membatasi tampilan */}
                {displayedMatkul.slice(0, 4).map((mk) => (
                  <button
                    key={mk.id}
                    onClick={() => router.push(`/student/mata-kuliah/${mk.id}`)}
                    className="group hp-card overflow-hidden text-left flex flex-col"
                  >
                    {/* Cover Image */}
                    <div className="relative w-full h-[128px] bg-[#068DFF] overflow-hidden flex-shrink-0">
                      <Image
                        src="/Assets/bg_matkul.png"
                        alt=""
                        fill
                        className="object-cover opacity-35"
                      />
                      {mk.coverUrl ? (
                        <img
                          src={mk.coverUrl}
                          alt={mk.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-25">
                          <BookOpen size={48} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-100 leading-tight line-clamp-2 mb-2 group-hover:text-[#068DFF] transition-colors">
                        {mk.name}
                      </h3>
                      <div className="mt-auto flex items-center justify-between border-t border-gray-50 dark:border-slate-800 pt-2">
                        <div className="flex items-center gap-1 text-gray-400">
                          <BookOpen size={11} className="text-gray-300 dark:text-slate-600" />
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500">{mk.materialCount || 0} Materi</span>
                        </div>
                        <ChevronRight size={13} className="text-gray-300 dark:text-slate-600 group-hover:text-[#0055FF] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* --- FOOTER SECTION (Show more button) --- */}
              {/* Tombol muncul jika total data yang difilter lebih dari 4 */}
              {filteredMatkul.length > 4 && (
                <div className="text-center mt-5">
                  <button
                    onClick={() => router.push("/student/mata-kuliah")}
                    className="text-xs font-bold text-[#068DFF] hover:text-[#0570CC] transition-colors px-4 py-2 rounded-full bg-sky-50 hover:bg-sky-100"
                  >
                    Lihat mata kuliah lainnya
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ==================== REQUEST MATERI ==================== */}
        <section>
          <div className="hp-section-title mb-4">
            <div className="hp-section-bar"></div>
            <h2>Request Materi</h2>
          </div>

          <div className="hp-empty" data-request-empty="inbox">
            <div className="w-14 h-14 bg-blue-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Inbox size={24} className="text-[#068DFF]" />
            </div>
            <p className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Butuh materi yang belum ada?</p>
            <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">Kirim request ke admin himpunan supaya materi bisa ditambahkan.</p>
            <button
              onClick={() => router.push("/student/request-materi")}
              className="mt-4 px-5 py-2 bg-[#068DFF] text-white text-sm font-semibold rounded-full hover:bg-[#0570CC]"
            >
              Ajukan Request
            </button>
          </div>
        </section>

        {/* ==================== FOOTER BANNER ==================== */}
        <section>
          <div className="relative rounded-[28px] overflow-hidden bg-[#068DFF]">
            <BrandRings className="absolute -right-20 -top-28 w-80 h-80 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-5 px-8 md:px-10 py-8">
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-semibold text-white">
                  Mau menjelajah materi luar prodi?
                </h3>
                <p className="text-white/80 text-sm max-w-md leading-relaxed">
                  Pelajari materi di luar prodi kamu, supaya dapat ilmu lebih banyak.
                </p>
              </div>
              <button
                onClick={() => router.push("/student/matkul-prodi-lain")}
                className="px-6 py-2.5 bg-white text-[#0570CC] font-semibold text-sm rounded-full hover:bg-sky-50 active:scale-[0.97] transition-all whitespace-nowrap shrink-0"
              >
                Jelajahi
              </button>
              <Image
                src="/Assets/Logo-helphin-putih.png"
                alt="helPhin"
                width={96}
                height={32}
                className="hidden md:block object-contain opacity-90 shrink-0"
              />
            </div>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="flex items-center justify-between pt-3 pb-1 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Image
              src="/Assets/Logo-helphin-biru.png"
              alt="helPhin"
              width={70}
              height={24}
              className="object-contain opacity-50 dark:brightness-0 dark:invert"
            />
          </div>
          <div className="flex items-center gap-5">
            <button className="text-[10px] text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 font-medium transition-colors">About</button>
            <button className="text-[10px] text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 font-medium transition-colors">Policy</button>
            <button className="text-[10px] text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 font-medium transition-colors">Terms</button>
          </div>
        </footer>

        {/* Hide scrollbar */}
        <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      </div>
      );
}