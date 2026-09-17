import { withActivity, withSkippedFetch } from "@/lib/activity-loading";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function superadminReturnPath(returnTo: string | null | undefined, fallback: string) {
    if (
        returnTo &&
        returnTo.startsWith("/superadmin/") &&
        !returnTo.startsWith("//") &&
        !returnTo.includes("://")
    ) {
        return returnTo;
    }
    return fallback;
}

export function mimeFromFileType(fileType?: string | null) {
    const t = (fileType || "").toLowerCase();
    if (t === "pdf") return "application/pdf";
    if (t === "jpg" || t === "jpeg") return "image/jpeg";
    if (t === "png") return "image/png";
    if (t === "webp") return "image/webp";
    if (t === "gif") return "image/gif";
    return "application/octet-stream";
}

export function suggestedDownloadName(title: string, fileType?: string | null, fallback = "file") {
    const ext = (fileType || "pdf").replace(/^\./, "");
    const safe = (title || fallback).replace(/[\\/:*?"<>|]+/g, " ").trim() || fallback;
    return `${safe}.${ext}`;
}

export async function downloadAuthFile(path: string, filename: string) {
    return withActivity(
        "Mengunduh file...",
        () => withSkippedFetch(async () => {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}${path}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Download failed (${res.status})`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        }),
        { kind: "overlay" }
    );
}

export async function previewAuthFile(path: string, fileType?: string | null) {
    return withActivity(
        "Memuat preview...",
        () => withSkippedFetch(async () => {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}${path}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Preview failed (${res.status})`);
            const blob = await res.blob();
            return URL.createObjectURL(new Blob([blob], { type: blob.type || mimeFromFileType(fileType) }));
        }),
        { kind: "overlay" }
    );
}
