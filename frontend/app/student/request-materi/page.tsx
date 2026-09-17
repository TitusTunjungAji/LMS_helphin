"use client";

import { useEffect, useState } from "react";
import CampusHero from "@/components/CampusHero";
import { Inbox } from "lucide-react";
import { API_URL } from "@/lib/api";
import { formatRelativeTime } from "@/lib/activity";

interface RequestItem {
  id: string;
  title: string;
  subject?: string | null;
  description?: string | null;
  studentId?: string;
  studentName?: string | null;
  createdAt: string;
}

export default function StudentRequestMateri() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<RequestItem[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user.id || "");
      }
      if (!token) return;
      const res = await fetch(`${API_URL}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.success ? data.data || [] : []);
    } catch (e) {
      console.error("Failed to load requests", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), subject: subject.trim() || null, description: description.trim() || null }),
      });
      const data = await res.json();
      if (data.success) {
        setTitle("");
        setSubject("");
        setDescription("");
        setMessage("Request materi terkirim.");
        load();
      } else {
        setMessage(data.message || "Gagal mengirim request.");
      }
    } catch {
      setMessage("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  const mine = items.filter((item) => !userId || item.studentId === userId);

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-3xl">
      <CampusHero title="Request Materi" subtitle="Ajukan materi yang belum tersedia di kelasmu" />

      <form onSubmit={handleSubmit} className="hp-card p-6 space-y-4">
        <input className="hp-input" placeholder="Judul request" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="hp-input" placeholder="Mata kuliah / topik (opsional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea
          className="hp-input min-h-[120px] resize-y"
          placeholder="Jelaskan materi yang kamu butuhkan"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" disabled={saving} className="hp-btn-primary max-w-xs">
          {saving ? "Mengirim..." : "Kirim Request"}
        </button>
        {message ? <p className="text-sm text-[#068DFF]">{message}</p> : null}
      </form>

      <section>
        <div className="hp-section-title mb-4">
          <div className="hp-section-bar" />
          <h2>Request kamu</h2>
        </div>
        {loading ? (
          <div className="h-24 hp-card animate-pulse" />
        ) : mine.length === 0 ? (
          <div className="hp-empty">
            <div className="w-14 h-14 bg-blue-50 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Inbox size={24} className="text-[#068DFF]" />
            </div>
            <p className="text-sm text-slate-500">Belum ada request materi.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mine.map((item) => (
              <div key={item.id} className="hp-card p-5">
                <p className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                {item.subject ? <p className="text-xs text-[#068DFF] mt-1">{item.subject}</p> : null}
                {item.description ? <p className="text-sm text-slate-500 mt-2">{item.description}</p> : null}
                <p className="text-[11px] text-slate-400 mt-2">{formatRelativeTime(item.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
