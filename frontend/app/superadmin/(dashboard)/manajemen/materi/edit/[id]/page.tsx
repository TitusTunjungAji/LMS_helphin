"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import FooterDashboard from "@/components/dashboard/footer_dashboard";
import { API_URL, superadminReturnPath } from "@/lib/api";

function fileNameFromUrl(url?: string | null) {
    if (!url) return "File saat ini";
    try {
        return decodeURIComponent(url.split("/").pop() || "File saat ini");
    } catch {
        return url.split("/").pop() || "File saat ini";
    }
}

export default function EditMateri() {
    return (
        <Suspense fallback={<div className="p-20 text-center text-gray-500">Memuat data...</div>}>
            <EditMateriContent />
        </Suspense>
    );
}

function EditMateriContent() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        tahunAjaran: "",
        mataKuliahId: "",
        prodiName: "",
        mataKuliahName: ""
    });
    const [file, setFile] = useState<File | null>(null);
    const [currentFileName, setCurrentFileName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) fetchMateri();
    }, [id]);

    const fetchMateri = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/api/materials/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setFormData({
                    title: json.data.title,
                    description: json.data.description || "",
                    tahunAjaran: json.data.tahunAjaran,
                    mataKuliahId: json.data.mataKuliahId,
                    prodiName: json.data.prodiName,
                    mataKuliahName: json.data.mataKuliahName
                });
                setCurrentFileName(fileNameFromUrl(json.data.fileUrl));
                // #region agent log
                fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'F',location:'superadmin/manajemen/materi/edit:fetchMateri',message:'Superadmin edit materi loaded with file field',data:{id,hasFileUrl:!!json.data.fileUrl,fileType:json.data.fileType||null,hasFileInput:true},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
            }
        } catch (error) {
            console.error("Failed to fetch material:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        const destination = superadminReturnPath(searchParams.get("returnTo"), "/superadmin/manajemen/materi");
        // #region agent log
        fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'A',location:'superadmin/manajemen/materi/edit:handleBack',message:'Superadmin materi edit back destination',data:{destination,returnTo:searchParams.get("returnTo"),mataKuliahId:formData.mataKuliahId||null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        router.push(destination);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem("accessToken");
            const fd = new FormData();
            fd.append("title", formData.title);
            fd.append("description", formData.description);
            fd.append("tahunAjaran", formData.tahunAjaran);
            if (file) fd.append("file", file);
            // #region agent log
            fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'F',location:'superadmin/manajemen/materi/edit:handleUpdate',message:'Superadmin edit materi PATCH payload',data:{contentType:'multipart/form-data',hasFile:!!file,fileName:file?.name||null},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            const res = await fetch(`${API_URL}/api/materials/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: fd
            });

            const json = await res.json();
            if (json.success) {
                alert("Materi berhasil diubah!");
                handleBack();
            } else {
                alert(json.message || "Gagal mengubah materi.");
            }
        } catch (error) {
            alert("Terjadi kesalahan sistem.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-gray-500">Memuat data...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50 text-gray-800 font-jakarta">
            <div className="flex-1 p-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        Edit Materi <span className="text-blue-600">✏️</span>
                    </h1>
                    <p className="text-gray-400 text-sm italic">Ubah detail materi pembelajaran yang sudah ada.</p>
                </div>

                <div className="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleUpdate} className="space-y-6">
                        {/* READ ONLY INFO */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                                <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Program Studi</label>
                                <p className="text-gray-700 font-semibold">{formData.prodiName}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mata Kuliah</label>
                                <p className="text-gray-700 font-medium">{formData.mataKuliahName}</p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Judul Materi</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Tahun Ajaran</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-jakarta italic font-bold text-blue-800"
                                placeholder="e.g. 2023/2024"
                                value={formData.tahunAjaran}
                                onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Deskripsi</label>
                            <textarea
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Ganti File Materi (Opsional)</label>
                            <div
                                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50/40 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2"
                                onClick={() => document.getElementById("file-upload")?.click()}
                            >
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                {file ? (
                                    <>
                                        <p className="text-blue-600 font-semibold text-sm">{file.name}</p>
                                        <p className="text-gray-400 text-xs">File ini akan menimpa file yang lama saat disimpan.</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-gray-800 font-semibold text-sm">Klik untuk unggah file baru</p>
                                        <p className="text-gray-400 text-xs">File saat ini: {currentFileName}</p>
                                        <p className="text-gray-400 text-xs">PDF, DOCX, PPTX (kosongkan jika tidak ingin mengganti)</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition active:scale-95"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>

                <FooterDashboard />
            </div>
        </div>
    );
}
