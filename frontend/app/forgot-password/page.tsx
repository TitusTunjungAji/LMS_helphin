"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import AuthStage from "@/components/AuthStage";
import PasswordInput from "@/components/PasswordInput";

type Step = "IDENTIFIER" | "OTP" | "RESET" | "SUCCESS";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("IDENTIFIER");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(""); // Stored email from backend response
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const input = document.querySelector("[data-forgot-identifier]") as HTMLInputElement | null;
    const icon = document.querySelector("[data-forgot-mail-icon]");
    if (!input || !icon) return;
    const inputRect = input.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    const padLeft = parseFloat(getComputedStyle(input).paddingLeft || "0");
    const overlapsPlaceholder = iconRect.right > inputRect.left + padLeft - 2;
    // #region agent log
    fetch("http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf3566" },
      body: JSON.stringify({
        sessionId: "bf3566",
        runId: "forgot-password",
        hypothesisId: "A",
        location: "forgot-password/page.tsx:layout",
        message: "Forgot password identifier input metrics",
        data: {
          padLeft,
          iconLeft: Math.round(iconRect.left - inputRect.left),
          iconRight: Math.round(iconRect.right - inputRect.left),
          overlapsPlaceholder,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [step]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();
      // #region agent log
      fetch("http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf3566" },
        body: JSON.stringify({
          sessionId: "bf3566",
          runId: "forgot-password",
          hypothesisId: "F",
          location: "forgot-password/page.tsx:requestOtp",
          message: "Forgot password OTP request result",
          data: {
            status: res.status,
            ok: res.ok,
            success: data.success === true,
            code: data.code || null,
            hasEmail: Boolean(data?.data?.email),
            identifierKind: identifier.includes("@") ? "email" : "other",
            detail: typeof data.detail === "string" ? data.detail.slice(0, 300) : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (!res.ok) throw new Error(data.message || "Gagal mengirim OTP");

      setEmail(data.data.email);
      setStep("OTP");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Kode OTP tidak valid");

      setStep("RESET");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mereset password");

      setStep("SUCCESS");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthStage title="#Explore" subtitle="with helPhin x HIMA">
      <Link href="/login" className="flex items-center gap-2 text-gray-400 hover:text-[#068DFF] transition-colors mb-6">
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Kembali ke Login</span>
      </Link>

      <div className="flex justify-center mb-6">
        <Image src="/images/helPhin 2.svg" alt="helPhin" width={150} height={48} priority />
      </div>

      {step === "IDENTIFIER" && (
        <div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Lupa Password?</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Masukkan Email atau NIM untuk menerima kode verifikasi OTP.
          </p>
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-3">
            {error && <div className="p-3 text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-lg text-center">{error}</div>}
            <div className="relative">
              <Mail data-forgot-mail-icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                data-forgot-identifier
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email atau NIM"
                required
                className="hp-input !pl-12"
              />
            </div>
            <button type="submit" disabled={isLoading} className="hp-btn-primary mt-1">
              {isLoading ? "Mengirim..." : "Kirim Kode OTP"}
            </button>
          </form>
        </div>
      )}

      {step === "OTP" && (
        <div>
          <div className="w-12 h-12 bg-blue-50 text-[#068DFF] rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Verifikasi OTP</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Kode 6-digit telah dikirim ke <span className="font-semibold text-gray-700">{email}</span>.
          </p>
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
            {error && <div className="p-3 text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-lg text-center">{error}</div>}
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              className="hp-input text-center text-2xl tracking-[0.4em] font-semibold"
            />
            <button type="submit" disabled={isLoading || otp.length < 6} className="hp-btn-primary">
              {isLoading ? "Memverifikasi..." : "Verifikasi Kode"}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-5">
            Tidak menerima kode?{" "}
            <button type="button" onClick={handleRequestOtp} className="text-[#068DFF] font-medium hover:underline">
              Kirim ulang
            </button>
          </p>
        </div>
      )}

      {step === "RESET" && (
        <div>
          <div className="w-12 h-12 bg-blue-50 text-[#068DFF] rounded-xl flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Password Baru</h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Buat password baru untuk mengamankan akun Anda.
          </p>
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
            {error && <div className="p-3 text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-lg text-center">{error}</div>}
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password Baru"
              required
              autoComplete="new-password"
              className="hp-input"
            />
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi Password Baru"
              required
              autoComplete="new-password"
              className="hp-input"
            />
            <button type="submit" disabled={isLoading} className="hp-btn-primary mt-1">
              {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </div>
      )}

      {step === "SUCCESS" && (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Berhasil</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Password Anda sudah diatur ulang. Silakan masuk kembali.
          </p>
          <Link href="/login" className="hp-btn-primary inline-flex items-center justify-center">
            Login Sekarang
          </Link>
        </div>
      )}
    </AuthStage>
  );
}
