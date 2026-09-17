"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import { API_URL } from "@/lib/api";
import { formatActivityAction, formatRelativeTime } from "@/lib/activity";

interface ActivityItem {
  id: string;
  userName?: string | null;
  action: string;
  entityType?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export default function LogActivity() {
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/activity-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const list = data.success ? data.data || [] : [];
        setLogs(list);
      } catch (e) {
        console.error("Failed to load activity logs", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) =>
      [log.userName, log.action, log.entityType, formatActivityAction(log.action)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [logs, search]);

  return (
    <div className="p-5 md:p-7 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Log Activity</h1>
        <p className="text-sm text-slate-400 mt-1">Riwayat aktivitas akun di helPhin.</p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, aksi, atau entitas..."
          className="hp-input pl-10"
        />
      </div>

      <div className="hp-card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Memuat log...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">Belum ada log aktivitas.</div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/10">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/10 text-[#068DFF] flex items-center justify-center shrink-0">
                  <Activity size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800 dark:text-slate-100">
                    <span className="font-semibold text-[#068DFF]">{log.userName || "Sistem"}</span>{" "}
                    {formatActivityAction(log.action)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {log.entityType || "sistem"} · {formatRelativeTime(log.createdAt)}
                    {log.ipAddress ? ` · ${log.ipAddress}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
