"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import CampusHero from "@/components/CampusHero";
import { API_URL } from "@/lib/api";

interface ResponsiItem {
  id: string;
  title: string;
  scheduleDate: string;
  durationMinutes?: number | null;
  mataKuliahName?: string | null;
  speaker?: string | null;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} WIB`;
}

export default function StudentResponsiList() {
  const router = useRouter();
  const [items, setItems] = useState<ResponsiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/responsi`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setItems(data.success ? data.data || [] : []);
      } catch (e) {
        console.error("Failed to load responsi", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-5 md:p-7 space-y-6">
      <CampusHero title="Responsi" subtitle="Semua sesi responsi yang bisa kamu ikuti" pills={[`${loading ? "—" : items.length} Responsi`]} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 hp-card animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="hp-empty">
          <div className="w-14 h-14 bg-blue-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar size={24} className="text-[#068DFF]" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Belum ada responsi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(`/student/responsi/${item.id}`)}
              className="hp-card p-5 text-left hover:border-[#068DFF]/30 transition-colors"
            >
              <p className="text-[11px] text-[#068DFF] font-medium mb-2">{item.mataKuliahName || "Umum"}</p>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 mb-3">{item.title}</h3>
              <div className="space-y-1.5 text-[12px] text-slate-500">
                <p className="flex items-center gap-2"><Calendar size={13} /> {formatDate(item.scheduleDate)}</p>
                <p className="flex items-center gap-2"><Clock size={13} /> {formatTime(item.scheduleDate)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
