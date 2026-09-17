"use client";
import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { formatRelativeTime } from "@/lib/activity";

export default function AdminRequestMateri() {
  const [dataRequests, setDataRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setPermissions(user.permissions || []);
    }
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setDataRequests(json.data || []);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, requestTitle: string) => {
    if (!confirm(`Hapus request "${requestTitle}"?`)) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) fetchRequests();
      else alert(json.message || "Gagal menghapus request.");
    } catch {
      alert("Terjadi kesalahan saat menghapus request.");
    }
  };

  const canDelete = permissions.includes("*") || permissions.includes("request:manage");
  const filtered = dataRequests.filter((req) =>
    `${req.title} ${req.studentName} ${req.subject}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-5 md:p-7 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Request Materi</h1>
        <p className="text-sm text-slate-400 mt-1">Saran materi dari mahasiswa prodi kamu.</p>
      </div>
      <input
        className="hp-input max-w-md"
        placeholder="Cari judul atau mahasiswa..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="hp-card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Memuat data...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-400">Belum ada request materi.</p>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/10">
            {filtered.map((req) => (
              <div key={req.id} className="p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{req.title}</p>
                  {req.subject ? <p className="text-xs text-[#068DFF] mt-1">{req.subject}</p> : null}
                  {req.description ? <p className="text-sm text-slate-500 mt-1">{req.description}</p> : null}
                  <p className="text-[11px] text-slate-400 mt-2">
                    {req.studentName || "Mahasiswa"} · {formatRelativeTime(req.createdAt)}
                  </p>
                </div>
                {canDelete ? (
                  <button onClick={() => handleDelete(req.id, req.title)} className="text-xs text-red-500 hover:underline">
                    Hapus
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
