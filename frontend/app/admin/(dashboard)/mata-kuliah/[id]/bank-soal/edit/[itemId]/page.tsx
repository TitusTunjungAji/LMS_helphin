"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from "@/lib/api";

function fileNameFromUrl(url?: string | null) {
    if (!url) return "File saat ini";
    try {
        return decodeURIComponent(url.split("/").pop() || "File saat ini");
    } catch {
        return url.split("/").pop() || "File saat ini";
    }
}

export default function EditBankSoalAdmin() {
    const params = useParams();
    const courseId = params?.id as string;
    const itemId = params?.itemId as string;

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        tahunAjaran: ""
    });
    const [file, setFile] = useState<File | null>(null);
    const [currentFileName, setCurrentFileName] = useState("");
    const [matkulName, setMatkulName] = useState("Memuat...");
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchDetail = async () => {
            setIsFetching(true);
            try {
                const token = localStorage.getItem("accessToken");
                const res = await fetch(`${API_URL}/api/bank-soal/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setFormData({
                        title: data.data.title,
                        description: data.data.description || "",
                        tahunAjaran: data.data.tahunAjaran || ""
                    });
                    setCurrentFileName(fileNameFromUrl(data.data.fileUrl));
                    setMatkulName(data.data.mataKuliahName);
                    // #region agent log
                    fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'B',location:'admin/bank-soal/edit/page.tsx:fetchDetail',message:'Admin edit bank soal loaded',data:{itemId,hasFileUrl:!!data.data.fileUrl,fileType:data.data.fileType||null,formKeys:['title','description','tahunAjaran','file']},timestamp:Date.now()})}).catch(()=>{});
                    // #endregion
                }
            } catch (e) {
                console.error("Failed fetching bank soal", e);
            } finally {
                setIsFetching(false);
            }
        };
        if (itemId) fetchDetail();
    }, [itemId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const fd = new FormData();
            fd.append("title", formData.title);
            fd.append("description", formData.description);
            fd.append("tahunAjaran", formData.tahunAjaran);
            if (file) fd.append("file", file);
            // #region agent log
            fetch('http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bf3566'},body:JSON.stringify({sessionId:'bf3566',runId:'post-fix',hypothesisId:'C',location:'admin/bank-soal/edit/page.tsx:handleSubmit',message:'Admin edit bank soal PATCH payload',data:{contentType:'multipart/form-data',hasFile:!!file,fileName:file?.name||null},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            const res = await fetch(`${API_URL}/api/bank-soal/${itemId}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: fd
            });
            const data = await res.json();
            if (data.success) {
                alert("Bank Soal berhasil diperbarui!");
                router.push(`/admin/mata-kuliah/${courseId}`);
            } else {
                alert(`Gagal: ${data.message}`);
            }
        } catch (e) {
            console.error("Update error", e);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    if (isFetching) return (
        <div className="w-full min-h-screen flex items-center justify-center bg-[#EEF5FF]">
            <p className="text-gray-500">Memuat data bank soal...</p>
        </div>
    );

    return (
        <div className="w-full min-h-screen py-10 px-4 flex justify-center bg-[#EEF5FF] dark:bg-slate-950 transition-colors duration-300" style={{ fontFamily: "inter" }}>
            <div className="w-full max-w-[900px]">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:text-[#2563EB] transition-all">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 leading-tight">Edit Bank Soal</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Mata Kuliah: <strong className="text-[#2563EB]">{matkulName}</strong></p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-blue-50 dark:border-slate-800">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Judul Bank Soal</label>
                                <input type="text" required className="w-full h-[48px] px-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB] outline-none text-gray-900 dark:text-slate-100" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                             <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Tahun Ajaran</label>
                                <input type="text" className="w-full h-[48px] px-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB] outline-none text-gray-900 dark:text-slate-100" value={formData.tahunAjaran} onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Deskripsi (Opsional)</label>
                                <textarea className="w-full p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB] outline-none min-h-[100px] resize-none text-gray-900 dark:text-slate-100" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Ganti File Bank Soal (Opsional)</label>
                                <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-[#2563EB] dark:hover:border-[#2563EB] transition-all cursor-pointer relative">
                                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                        </div>
                                        {file ? (
                                            <>
                                                <p className="text-sm font-medium text-[#2563EB]">{file.name}</p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500">File ini akan menimpa file yang lama saat disimpan.</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Klik untuk unggah file baru</p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500">File saat ini: {currentFileName}</p>
                                                <p className="text-xs text-gray-400 dark:text-slate-500">Kosongkan jika tidak ingin mengganti file</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">Batal</button>
                            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-200 dark:shadow-none transition-colors disabled:opacity-50">{loading ? "Menyimpan..." : "Simpan Perubahan"}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
