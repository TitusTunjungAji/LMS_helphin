"use client";

import Link from "next/link";
import { Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function Setelan() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Setelan</h1>
        <p className="text-sm text-slate-400 mt-1">Atur tampilan dan akun superadmin.</p>
      </div>

      <div className="hp-card p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Tampilan</h2>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-white/10 transition-colors"
        >
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Mode gelap</span>
          <span className="flex items-center gap-2 text-sm text-[#068DFF]">
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            {theme === "dark" ? "Aktif" : "Nonaktif"}
          </span>
        </button>
      </div>

      <div className="hp-card p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Akun</h2>
        <Link
          href="/superadmin/profile"
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-white/10 transition-colors"
        >
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Edit profil & password</span>
          <UserRound size={16} className="text-[#068DFF]" />
        </Link>
      </div>
    </div>
  );
}
