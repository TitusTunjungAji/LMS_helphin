"use client";

import { useEffect, useState } from "react";
import { Eye, X, FileText } from "lucide-react";
import { previewAuthFile, downloadAuthFile, suggestedDownloadName } from "@/lib/api";

interface CurrentFilePreviewProps {
  apiPreviewPath: string;
  apiDownloadPath: string;
  fileName?: string;
  fileType?: string | null;
  title?: string;
}

export default function CurrentFilePreview({
  apiPreviewPath,
  apiDownloadPath,
  fileName,
  fileType,
  title,
}: CurrentFilePreviewProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const kind = (fileType || "").toLowerCase();
  const isPdf = kind === "pdf";
  const isImage = /(jpg|jpeg|png|webp|gif)/i.test(kind);

  useEffect(() => {
    if (!open) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    setLoading(true);
    setError("");
    previewAuthFile(apiPreviewPath, fileType)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        objectUrl = blobUrl;
        setUrl(blobUrl);
        // #region agent log
        fetch("http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf3566" },
          body: JSON.stringify({
            sessionId: "bf3566",
            runId: "post-fix",
            hypothesisId: "Q",
            location: "CurrentFilePreview.tsx:open",
            message: "Current material preview opened",
            data: { apiPreviewPath, fileType: fileType || null, ok: true },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Gagal memuat preview file saat ini.");
        // #region agent log
        fetch("http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf3566" },
          body: JSON.stringify({
            sessionId: "bf3566",
            runId: "post-fix",
            hypothesisId: "Q",
            location: "CurrentFilePreview.tsx:open",
            message: "Current material preview failed",
            data: { apiPreviewPath, error: String(err) },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [open, apiPreviewPath, fileType]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleDownload = async () => {
    try {
      await downloadAuthFile(apiDownloadPath, suggestedDownloadName(title || fileName || "materi", fileType, "materi"));
    } catch {
      alert("Gagal mengunduh file.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition"
      >
        <Eye size={16} />
        Preview file saat ini
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-4xl h-[min(86vh,820px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{title || "Preview materi"}</p>
                <p className="text-xs text-gray-400 truncate">{fileName || "File saat ini"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Unduh
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Tutup preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-50 flex items-center justify-center overflow-hidden">
              {loading && <p className="text-sm font-medium text-gray-500">Memuat preview...</p>}
              {!loading && error && <p className="text-sm font-medium text-red-500">{error}</p>}
              {!loading && !error && url && isPdf && (
                <iframe src={url} title="Preview materi" className="w-full h-full border-0 bg-white" />
              )}
              {!loading && !error && url && isImage && (
                <img src={url} alt="Preview materi" className="max-w-full max-h-full object-contain p-4" />
              )}
              {!loading && !error && url && !isPdf && !isImage && (
                <div className="text-center px-8">
                  <FileText size={40} className="mx-auto text-blue-500 mb-3" />
                  <p className="text-sm font-semibold text-gray-700 mb-2">Preview langsung tidak tersedia untuk file {kind.toUpperCase() || "ini"}.</p>
                  <p className="text-xs text-gray-500 mb-4">Unduh file untuk membukanya di perangkat Anda.</p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
                  >
                    Unduh file
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
