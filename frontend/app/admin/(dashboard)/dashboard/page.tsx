"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";
import { API_URL } from "@/lib/api";
import CampusHero from "@/components/CampusHero";
import BrandRings from "@/components/BrandRings";

// Mock Data for Trendlines
const trendData = [
  { value: 10 }, { value: 25 }, { value: 15 }, { value: 40 }, { value: 30 }, { value: 45 }
];

export default function AdminDashboard() {
  const [user, setUser] = useState<{ name: string; prodi?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    totalStudents: number;
    totalMaterials: number;
    totalVideos: number;
    totalCourses: number;
    totalRequests: number;
    totalExercises: number;
    mataKuliahTerpopuler: any[];
    mahasiswaTeraktif: any[];
    prodiName: string;
    contentCompleteness?: {
      totalCourses: number;
      activeCourses: number;
      withMaterial: number;
      withVideo: number;
      withExercise: number;
    };
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0); // For handling initial mount auth delay


  const fetchStats = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      if (retryCount < 3) {
        console.warn(`[Dashboard] Token missing, retry ${retryCount + 1}/3...`);
        setTimeout(() => setRetryCount(prev => prev + 1), 1000);
      } else {
        console.error("[Dashboard] Authentication token not found after retries. Please login.");
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      console.log(`[Dashboard] Fetching stats from backend... (Retry: ${retryCount})`);
      const res = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("[Dashboard] API Response:", data);
      
      if (data.success) {
        setDashboardData(data.data);
        if (data.data.prodiName) {
          setUser(prev => prev ? { ...prev, prodi: data.data.prodiName } : null);
        }
      } else {
        console.error("[Dashboard] Backend returned error:", data.message);
      }
    } catch (e) {
      console.error("[Dashboard] Network error fetching stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Get User from Local Storage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser({
          name: parsed.name || "User",
          prodi: parsed.prodi || "Admin Prodi",
        });
      } catch (e) {
        setUser({ name: "User", prodi: "Admin Prodi" });
      }
    }
    
    // 2. Fetch Dashboard Stats
    fetchStats();
  }, [retryCount]);


  // Prepare Dynamic Stats Array
  const dynamicStats = [
    { 
      label: "Total Mahasiswa", 
      value: dashboardData?.totalStudents?.toString() || "0", 
      sub: "mahasiswa terdaftar", 
      data: trendData, 
      color: "#3B82F6" 
    },
    { 
      label: "Total Course", 
      value: (dashboardData?.totalCourses || 0).toString(), 
      sub: "mata kuliah aktif", 
      data: trendData, 
      color: "#3B82F6" 
    },
    { 
      label: "Total Video", 
      value: dashboardData?.totalVideos?.toString() || "0", 
      sub: "video pembelajaran", 
      data: trendData, 
      color: "#3B82F6" 
    },
    { 
      label: "Materi & Latihan", 
      value: ((dashboardData?.totalMaterials || 0) + (dashboardData?.totalExercises || 0)).toString(), 
      sub: "modul, file & kuis", 
      data: trendData, 
      color: "#3B82F6" 
    },
  ];

  const popularCourses = dashboardData?.mataKuliahTerpopuler || [];
  const activeStudentsList = dashboardData?.mahasiswaTeraktif || [];

  const content = dashboardData?.contentCompleteness;
  const tc = content?.totalCourses || 1;
  const overallPercentage = Math.round(((content?.activeCourses || 0) / tc) * 100) || 0;
  const pMaterial = Math.round(((content?.withMaterial || 0) / tc) * 100) || 0;
  const pVideo = Math.round(((content?.withVideo || 0) / tc) * 100) || 0;
  const pExercise = Math.round(((content?.withExercise || 0) / tc) * 100) || 0;

  return (
    <div className="p-5 md:p-7 space-y-8">
      {/* Welcome Banner Sync */}
      <CampusHero
        title={`Hallo, ${user?.name || "Admin"}`}
        subtitle={user?.prodi || "Admin Prodi"}
        pills={[
          `${dashboardData?.totalStudents ?? 0} Mahasiswa`,
          `${dashboardData?.totalCourses ?? 0} Course`,
        ]}
      />

      <div className="space-y-8">

      <div>
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="hp-section-title">
            <div className="hp-section-bar"></div>
            <h2>Aktivitas Anda</h2>
          </div>
          <button 
            onClick={fetchStats}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
               <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Performance Card */}
          <div className="lg:col-span-2 hp-card p-8 flex items-center justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">Review Kelengkapan Konten</p>
                <p className="text-xs text-gray-400 max-w-[220px]">Persentase mata kuliah yang aktif menyediakan materi, video, & kuis.</p>
              </div>
              <h3 className="text-6xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">{overallPercentage}%</h3>
              <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-3" title="Mata Kuliah dengan Materi">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 w-6 font-bold">{pMaterial}%</span>
                    <div className="h-1.5 w-32 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full group-hover:scale-x-105 origin-left transition-transform" style={{ width: `${pMaterial}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Materi</span>
                  </div>
                  <div className="flex items-center gap-3" title="Mata Kuliah dengan Video">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 w-6 font-bold">{pVideo}%</span>
                    <div className="h-1.5 w-32 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full group-hover:scale-x-105 origin-left transition-transform" style={{ width: `${pVideo}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Video</span>
                  </div>
                  <div className="flex items-center gap-3" title="Mata Kuliah dengan Kuis/Latihan">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 w-6 font-bold">{pExercise}%</span>
                    <div className="h-1.5 w-32 bg-gray-50 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full group-hover:scale-x-105 origin-left transition-transform" style={{ width: `${pExercise}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Latihan</span>
                  </div>
              </div>
            </div>
          </div>

          {/* Stats Mini Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {dynamicStats.map((stat, i) => (
              <div key={i} className="hp-card p-5 flex flex-col justify-between relative overflow-hidden">
                {loading && (
                   <div className="absolute inset-0 bg-white dark:bg-slate-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                   </div>
                )}
                <div>
                   <p className="text-[12px] font-medium text-gray-400 dark:text-slate-500 mb-2">{stat.label}</p>
                   <div className="flex items-end justify-between">
                      <h4 className="text-3xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">{stat.value}</h4>
                      <div className="h-10 w-20 opacity-60 group-hover/card:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <Line type="monotone" dataKey="value" stroke={stat.color} strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                   </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mt-3 flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                   {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Favorite Course */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Course Terfavorit</h2>
            <span className="text-[11px] font-medium text-[#068DFF] bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">Top 5</span>
          </div>
          <div className="space-y-3">
             {popularCourses.length > 0 ? (
               popularCourses.map((fav, index) => (
                 <div key={fav.id} className="hp-card p-4 flex items-center justify-between hover:translate-x-1 transition-transform group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center font-black text-lg">
                       {index + 1}
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-gray-700 dark:text-slate-200 leading-tight">{fav.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">{fav.materialCount} konten tersedia</span>
                     </div>
                   </div>
                   <button 
                    onClick={() => window.location.href = `/admin/mata-kuliah/${fav.id}`}
                    className="text-[11px] font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-blue-600 transition-colors"
                   >
                    Lihat Course
                   </button>
                 </div>
               ))
             ) : (
               <div className="text-center py-10 bg-gray-50 dark:bg-slate-800 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <p className="text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-xs font-medium">Belum ada data course</p>
               </div>
             )}
          </div>
        </div>

        {/* Active Students */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Student Active</h2>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">Top 10</span>
          </div>
          <div className="space-y-3">
             {activeStudentsList.length > 0 ? (
               activeStudentsList.map((student, index) => (
                 <div key={student.userId} className="hp-card p-4 flex items-center justify-between hover:translate-x-1 transition-transform group">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-black text-lg">
                       {index + 1}
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-gray-700 dark:text-slate-200 leading-tight">{student.userName}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">{student.activityCount} aktivitas terbaru</span>
                     </div>
                   </div>
                        <span className="text-[10px] text-slate-400">{student.userEmail}</span>
                 </div>
               ))
             ) : (
               <div className="text-center py-10 bg-gray-50 dark:bg-slate-800 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <p className="text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-xs font-medium">Belum ada data aktivitas</p>
               </div>
             )}
          </div>
        </div>
         </div>
      </div>

      {/* Support Banner */}
      <div className="relative rounded-[28px] overflow-hidden bg-[#068DFF]">
        <BrandRings className="absolute -right-20 -top-28 w-80 h-80 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5 px-8 md:px-10 py-8">
          <div className="space-y-2 flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-semibold text-white leading-tight">
              Ada kendala? Tanya kami
            </h3>
            <p className="text-white/80 text-sm">
              Tim support helPhin siap membantu kapan pun kamu butuh.
            </p>
          </div>
          <Link
            href="/admin/pusat-layanan"
            className="px-6 py-2.5 bg-white text-[#0570CC] font-semibold rounded-full hover:bg-sky-50 transition-all active:scale-[0.97] whitespace-nowrap shrink-0"
          >
            Hubungi Kami
          </Link>
          <div className="relative hidden md:block w-[88px] h-[88px] shrink-0">
            <Image
              src="/Assets/helphin_1.png"
              alt=""
              fill
              className="object-contain mix-blend-screen"
            />
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between pt-2 pb-1">
        <Image
          src="/Assets/Logo-helphin-biru.png"
          alt="helPhin"
          width={70}
          height={24}
          className="object-contain opacity-50 dark:brightness-0 dark:invert"
        />
        <div className="flex items-center gap-5">
          <button className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 font-medium">About</button>
          <button className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 font-medium">Policy</button>
          <button className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 font-medium">Terms</button>
        </div>
      </footer>
    </div>
  );
}
