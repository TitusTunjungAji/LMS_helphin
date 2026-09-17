"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import AuthStage from "@/components/AuthStage";

interface Prodi {
  id: string;
  name: string;
  fakultasName: string;
}

export default function StudentRegisterPage() {
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prodiId, setProdiId] = useState("");
  const [prodiList, setProdiList] = useState<Prodi[]>([]);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProdi = async () => {
      try {
        const res = await fetch(`${API_URL}/api/prodi`);
        const data = await res.json();
        if (data.success) {
          setProdiList(data.data);
        }
      } catch (e) {
        console.error("Gagal mengambil data prodi", e);
      }
    };
    fetchProdi();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!prodiId) {
      setError("Silakan pilih program studi Anda.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nim, email, password, prodiId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mendaftar. Periksa kembali data Anda.");
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthStage title="#JoinUs" subtitle="with helPhin x HIMA">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/helPhin 2.svg"
              alt="helPhin"
              width={160}
              height={50}
              priority
            />
          </div>

          <p className="text-center text-[14px] text-gray-500 leading-relaxed mb-8">
            Daftarkan akun Anda untuk mulai
            <br />
            belajar bersama helPhin
          </p>

          <form className="flex flex-col gap-3" onSubmit={handleRegister}>
            {error && (
              <div className="p-3 text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-lg text-center mb-1">
                {error}
              </div>
            )}

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Lengkap"
              required
              className="w-full px-5 py-3.5 rounded-lg bg-white text-gray-800 border border-gray-300 outline-none transition-all duration-200 hover:border-blue-400 focus:border-[#068DFF] focus:ring-2 focus:ring-blue-100 text-[14px]"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="NIM"
                required
                className="w-full px-5 py-3.5 rounded-lg bg-white text-gray-800 border border-gray-300 outline-none transition-all duration-200 hover:border-blue-400 focus:border-[#068DFF] focus:ring-2 focus:ring-blue-100 text-[14px]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-5 py-3.5 rounded-lg bg-white text-gray-800 border border-gray-300 outline-none transition-all duration-200 hover:border-blue-400 focus:border-[#068DFF] focus:ring-2 focus:ring-blue-100 text-[14px]"
              />
            </div>

            <div className="relative">
              <select
                value={prodiId}
                onChange={(e) => setProdiId(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-lg bg-white text-gray-800 border border-gray-300 outline-none transition-all duration-200 hover:border-blue-400 focus:border-[#068DFF] focus:ring-2 focus:ring-blue-100 text-[14px] appearance-none cursor-pointer"
              >
                <option value="">Pilih Program Studi</option>
                {prodiList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 6 karakter)"
              required
              className="w-full px-5 py-3.5 rounded-lg bg-white text-gray-800 border border-gray-300 outline-none transition-all duration-200 hover:border-blue-400 focus:border-[#068DFF] focus:ring-2 focus:ring-blue-100 text-[14px]"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 bg-[#068DFF] hover:bg-[#0570CC] disabled:opacity-50 text-white font-semibold text-[15px] rounded-full shadow-md transition-all duration-200 active:scale-[0.98]"
            >
              {isLoading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>
          </form>

          <p className="text-center text-[14px] text-gray-500 mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-gray-800 font-bold hover:underline">
              Masuk di sini
            </Link>
          </p>
    </AuthStage>
  );
}
