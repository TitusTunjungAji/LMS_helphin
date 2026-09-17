"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

interface VideoItem {
  id: string;
  title: string;
  description?: string | null;
  embedUrl?: string | null;
  mataKuliahName?: string | null;
  uploaderName?: string | null;
  createdAt?: string;
}

interface ChapterItem {
  id: string;
  time: string;
  title: string;
}

export default function SmartVideoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Memuat video...</div>}>
      <SmartVideoContent />
    </Suspense>
  );
}

function SmartVideoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoId = searchParams.get("id") || searchParams.get("topikId") || "";
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [current, setCurrent] = useState<VideoItem | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const load = async () => {
      try {
        if (videoId) {
          const [videoRes, chapterRes] = await Promise.all([
            fetch(`${API_URL}/api/videos/${videoId}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/api/videos/${videoId}/chapters`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          const videoJson = await videoRes.json();
          const chapterJson = await chapterRes.json();
          if (videoJson.success) setCurrent(videoJson.data);
          setChapters(chapterJson.success ? chapterJson.data || [] : []);
        } else {
          const res = await fetch(`${API_URL}/api/videos`, { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          setVideos(data.success ? data.data || [] : []);
        }
      } catch (e) {
        console.error("Failed to load smart video", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [videoId]);

  if (loading) {
    return <div className="p-8 text-slate-400">Memuat video...</div>;
  }

  if (!videoId) {
    return (
      <div className="p-5 md:p-7 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Smart Video</h1>
          <p className="text-sm text-slate-400 mt-1">Pilih video dari katalog, atau unggah yang baru.</p>
        </div>
        <button
          onClick={() => router.push("/superadmin/manajemen/video/tambah")}
          className="hp-btn-primary max-w-xs"
        >
          Tambah Video
        </button>
        {videos.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada video.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => router.push(`/superadmin/smart-video?id=${video.id}`)}
                className="hp-card p-5 text-left"
              >
                <p className="text-[11px] text-[#068DFF] mb-1">{video.mataKuliahName || "Umum"}</p>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">{video.title}</h3>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-5xl">
      <button onClick={() => router.push("/superadmin/smart-video")} className="text-sm text-slate-400 hover:text-[#068DFF]">
        ← Semua video
      </button>
      <div className="aspect-video rounded-2xl overflow-hidden bg-black">
        {current?.embedUrl ? (
          <iframe
            src={current.embedUrl}
            title={current.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/70">Tidak ada sumber video</div>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{current?.title || "Video"}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {current?.mataKuliahName || "Umum"}
          {current?.uploaderName ? ` · ${current.uploaderName}` : ""}
        </p>
        {current?.description ? <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{current.description}</p> : null}
      </div>
      {chapters.length > 0 ? (
        <div className="hp-card p-5 space-y-2">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Chapter</h2>
          {chapters.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-mono text-[#068DFF] w-14">{ch.time}</span>
              <span>{ch.title}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
