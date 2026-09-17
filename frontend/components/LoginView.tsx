"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import AuthStage from "@/components/AuthStage";
import PasswordInput from "@/components/PasswordInput";

interface LoginViewProps {
  roleTitle: string;
  redirectPath: string;
}

export default function LoginView({ roleTitle, redirectPath }: LoginViewProps) {
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal login. Periksa kembali email & password.");
      }

      // Role-based access control: block unauthorized portal access
      const userRole = data.data.user.role;
      const isSuperAdminPortal = redirectPath.includes("superadmin");
      const isAdminPortal = redirectPath.includes("admin");
      const hasSuperAdminAccess = data.data.user.permissions?.includes("*");

      if (isSuperAdminPortal && !hasSuperAdminAccess) {
        throw new Error("Anda tidak memiliki akses ke portal Super Admin.");
      }
      if (isAdminPortal && !isSuperAdminPortal && userRole !== "admin" && !hasSuperAdminAccess) {
        throw new Error("Anda tidak memiliki akses ke portal Admin.");
      }

      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken || "");
      localStorage.setItem("user", JSON.stringify(data.data.user));
      localStorage.setItem("lastActivity", Date.now().toString());

      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = roleTitle.toLowerCase().includes("superadmin");

  return (
    <AuthStage title={isSuperAdmin ? "#Control" : "#Manage"} subtitle={`helPhin ${roleTitle} Portal`}>
      <div className="flex justify-center mb-6">
        <Image src="/images/helPhin 2.svg" alt="helPhin" width={170} height={55} priority />
      </div>
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-xl font-bold text-gray-800">Portal {roleTitle}</h1>
        <p className="text-[14px] text-gray-500 leading-relaxed">
          Masukkan email dan kata sandi Anda untuk masuk.
        </p>
      </div>
      <form className="flex flex-col gap-3" onSubmit={handleLogin}>
        {error && (
          <div className="p-3 text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-lg text-center">
            {error}
          </div>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="hp-input"
        />
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          autoComplete="current-password"
          className="hp-input"
        />
        <div className="flex justify-end mt-1">
          <Link href="/forgot-password" className="text-[13px] font-medium text-[#068DFF] hover:underline">
            Lupa password?
          </Link>
        </div>
        <button type="submit" disabled={isLoading} className="hp-btn-primary mt-2">
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </AuthStage>
  );
}
