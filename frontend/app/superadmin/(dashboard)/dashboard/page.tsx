"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, BookOpen, GraduationCap, Activity, Video } from "lucide-react";
import CampusHero from "@/components/CampusHero";
import { API_URL } from "@/lib/api";
import { formatActivityAction, formatRelativeTime } from "@/lib/activity";

interface DashboardStats {
  totalStudents: number;
  totalProdi: number;
  totalCourses: number;
  totalVideos: number;
  totalMaterials: number;
  totalRequests: number;
}

interface ActivityItem {
  id: string;
  userName?: string | null;
  action: string;
  entityType?: string;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser({ name: "Superadmin" });
      }
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`, { headers }),
        fetch(`${API_URL}/api/activity-logs`, { headers }),
      ]);
      const statsJson = await statsRes.json();
      const logsJson = await logsRes.json();
      if (statsJson.success) setStats(statsJson.data);
      const nextLogs = logsJson.success ? (logsJson.data || []).slice(0, 6) : [];
      if (logsJson.success) setLogs(nextLogs);
    } catch (e) {
      console.error("Failed to load superadmin dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: "Total Mahasiswa", value: stats?.totalStudents ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Prodi", value: stats?.totalProdi ?? 0, icon: GraduationCap, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Total Mata Kuliah", value: stats?.totalCourses ?? 0, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Video", value: stats?.totalVideos ?? 0, icon: Video, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const shortcuts = [
    { label: "Manajemen Role", href: "/superadmin/manajemen/role" },
    { label: "Tambah User Baru", href: "/superadmin/manajemen/akun/tambah" },
    { label: "Kelola Fakultas", href: "/superadmin/manajemen/fakultas" },
    { label: "Log Activity", href: "/superadmin/log_activity" },
  ];

  return (
    <div className="p-5 md:p-7 space-y-8">
      <CampusHero
        kicker="Control Center"
        title="Superadmin Overview"
        subtitle={`Selamat datang, ${user?.name || "Superadmin"}.`}
        pills={[
          `${stats?.totalStudents ?? 0} Users`,
          `${stats?.totalProdi ?? 0} Prodi`,
          `${stats?.totalCourses ?? 0} Courses`,
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat) => (
          <div key={stat.label} className="hp-card p-7">
            <div className="flex items-center justify-between mb-5">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">
                {loading ? "—" : stat.value}
              </h3>
              <p className="text-xs font-medium text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 hp-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Aktivitas Sistem Terkini</h2>
            <Link href="/superadmin/log_activity" className="text-sm font-semibold text-[#068DFF] hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />)
            ) : logs.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Belum ada log aktivitas.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-4 rounded-2xl border border-black/[0.04] dark:border-white/10">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-white/10 flex items-center justify-center text-[#068DFF]">
                    <Activity size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
                      <span className="text-[#068DFF]">{log.userName || "Sistem"}</span> {formatActivityAction(log.action)}
                    </p>
                    <p className="text-[11px] text-gray-400">{formatRelativeTime(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="hp-card p-8 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Cepat Akses</h2>
          <div className="grid grid-cols-1 gap-3">
            {shortcuts.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-gray-700 dark:text-slate-200 font-semibold text-sm hover:bg-[#068DFF] hover:text-white transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
