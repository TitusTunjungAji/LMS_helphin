"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import FooterDashboard from "@/components/dashboard/footer_dashboard";
import CampusHero from "@/components/CampusHero";
import { BookOpen } from "lucide-react";
import { API_URL } from "@/lib/api";

const inter = Inter({ subsets: ["latin"] });

interface ProdiItem {
  id: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
}

export default function StudentMatkulProdiLain() {
  const [userName, setUserName] = useState("Student");
  const [prodiList, setProdiList] = useState<ProdiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fakultasName, setFakultasName] = useState("Fakultas Informatika");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.name) setUserName(user.name.split(" ")[0]);
      } catch { }
    }

    fetchProdiData();
  }, []);

  const fetchProdiData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) return;

      const user = JSON.parse(userStr);
      if (!user.prodiId) return;

      // 1. Dapatkan detail Prodi asal student
      const userProdiRes = await fetch(`${API_URL}/api/prodi/${user.prodiId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userProdiData = await userProdiRes.json();

      if (userProdiData.success) {
        if (userProdiData.data?.fakultasName) {
          setFakultasName(userProdiData.data.fakultasName);
        }

        if (userProdiData.data?.fakultasId) {
          const fakultasId = userProdiData.data.fakultasId;

          const res = await fetch(`${API_URL}/api/prodi?fakultasId=${fakultasId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();

          if (data.success && Array.isArray(data.data)) {
            const filteredProdi = data.data.filter((p: ProdiItem) => p.id !== user.prodiId);
            setProdiList(filteredProdi);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch Prodi", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${inter.className} pb-10 flex flex-col gap-6 p-5 md:p-7`}>
      <CampusHero
        title={`Hallo, ${userName}`}
        subtitle={fakultasName}
        pills={[`${isLoading ? "—" : prodiList.length} Prodi`]}
      />

      <section className="flex flex-col gap-6 w-full">
        <div className="hp-section-title">
          <div className="hp-section-bar"></div>
          <h2>Prodi</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : prodiList.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {prodiList.map((prodi) => (
              <Link
                key={prodi.id}
                href={`/student/matkul-prodi-lain/${prodi.id}`}
                className="group hp-card overflow-hidden flex flex-col"
              >
                <div className="relative w-full h-[140px] bg-[#068DFF] overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {prodi.logoUrl ? (
                    <img
                      src={prodi.logoUrl}
                      alt={prodi.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-2xl">
                      {prodi.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col flex-1 text-center">
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-slate-200 leading-tight line-clamp-2 mb-2 group-hover:text-[#0055FF] dark:group-hover:text-blue-400 transition-colors">
                    {prodi.name}
                  </h4>
                  <div className="mt-auto flex items-center justify-center pt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-[#0055FF] dark:group-hover:bg-blue-600 transition-colors duration-300">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 dark:text-blue-400 group-hover:text-white transition-colors">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="hp-empty">
            <div className="w-14 h-14 bg-blue-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen size={24} className="text-[#068DFF]" />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Tidak ada Prodi tersedia saat ini.</p>
          </div>
        )}
      </section>

      <div className="mt-auto px-6">
        <FooterDashboard />
      </div>
    </div>
  );
}
