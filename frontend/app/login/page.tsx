"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import AuthStage from "@/components/AuthStage";

function homePath(user: { role?: string; permissions?: string[] }) {
  const role = user?.role || "";
  const permissions = user?.permissions || [];
  if (permissions.includes("*") || role === "super_admin") return "/superadmin/dashboard";
  if (role === "admin" || role === "admin_prodi") return "/admin/dashboard";
  return "/student/dashboard";
}

export default function StudentLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal login. Periksa NIM & password.");
      }

      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken || "");
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("lastActivity", Date.now().toString());

      const redirectUrl = sessionStorage.getItem("redirectAfterLogin");
      if (redirectUrl) {
        sessionStorage.removeItem("redirectAfterLogin");
        router.push(redirectUrl);
      } else {
        router.push(homePath(data.data.user));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthStage title="#Explore" subtitle="with helPhin x HIMA">
      <div className="flex justify-center mb-4">
        <Image src="/images/helPhin 2.svg" alt="helPhin" width={170} height={55} priority />
      </div>
      <p className="text-center text-[14px] text-gray-500 leading-relaxed mb-6">
        Masuk dengan Email atau NIM untuk lanjut belajar.
      </p>
      <form className="flex flex-col gap-3" onSubmit={handleLogin}>
        {error && (
          <div className="p-3 text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-lg text-center">
            {error}
          </div>
        )}
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Email atau NIM"
          required
          className="w-full px-5 py-3.5 rounded-lg bg-white text-gray-800 border border-gray-300 outline-none transition-all hover:border-blue-400 focus:border-[#068DFF] focus:ring-2 focus:ring-blue-100 text-[14px]"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full px-5 py-3.5 rounded-lg bg-white text-gray-800 border border-gray-300 outline-none transition-all hover:border-blue-400 focus:border-[#068DFF] focus:ring-2 focus:ring-blue-100 text-[14px]"
        />
        <div className="flex justify-end mt-1">
          <Link href="/forgot-password" className="text-[13px] font-medium text-[#068DFF] hover:underline">
            Lupa password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 bg-[#068DFF] hover:bg-[#0570CC] disabled:opacity-50 text-white font-semibold text-[15px] rounded-full shadow-md transition-all active:scale-[0.98]"
        >
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
      </form>
      <p className="text-center text-[14px] text-gray-500 mt-7">
        Belum punya akun?{" "}
        <Link href="/register" className="text-gray-800 font-bold hover:underline">
          Buat Akun
        </Link>
      </p>
    </AuthStage>
  );
}
