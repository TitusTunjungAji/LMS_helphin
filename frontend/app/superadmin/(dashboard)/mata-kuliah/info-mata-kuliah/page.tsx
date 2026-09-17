"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InfoMataKuliahRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/superadmin/manajemen/matkul");
  }, [router]);
  return <div className="p-8 text-slate-400">Mengalihkan ke daftar mata kuliah...</div>;
}
