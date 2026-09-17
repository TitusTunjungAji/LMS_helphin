"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function UploadSmartVideoRedirect() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Mengalihkan ke unggah video...</div>}>
      <RedirectInner />
    </Suspense>
  );
}

function RedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = new URLSearchParams();
    const mk = searchParams.get("mataKuliahId");
    const prodi = searchParams.get("prodiId");
    if (mk) q.set("mataKuliahId", mk);
    if (prodi) q.set("prodiId", prodi);
    router.replace(`/superadmin/manajemen/video/tambah${q.toString() ? `?${q}` : ""}`);
  }, [router, searchParams]);

  return <div className="p-8 text-slate-400">Mengalihkan ke unggah video...</div>;
}
