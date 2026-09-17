"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Hand } from "lucide-react";

export default function HeaderDashboard() {
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || "User");
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    // Fetch prodi name and mata kuliah
    const token = localStorage.getItem("accessToken");
    if (!token) return;
  }, []);

  useEffect(() => {
    // #region agent log
    const heading = document.querySelector("h1")?.innerHTML || "";
    fetch("http://127.0.0.1:7711/ingest/60cd0445-865c-40e5-90cd-09d9cf1d5283", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bf3566" }, body: JSON.stringify({ sessionId: "bf3566", runId: "emoji-fix", hypothesisId: "C", location: "header_dashboard.tsx:useEffect", message: "Greeting icon audit", data: { headingHasEmoji: /[\u{1F300}-\u{1FAFF}]/u.test(heading), headingHasSvg: heading.includes("svg") || !!document.querySelector("h1 svg"), headingText: document.querySelector("h1")?.textContent || "" }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
  }, [userName]);

  const firstName = userName.split(" ")[0];

  return (
    <header className="overflow-hidden flex justify-between mt-5 pl-5 bg-gradient-to-r from-[#0055FF] to-[#07A3F9] to-75% rounded-lg text-white shadow-lg">
      <div className="flex flex-col justify-end pb-5">
        <h1 className="font-bold text-3xl mb-1 flex items-center gap-2">
          Hallo, {firstName}
          <Hand size={28} strokeWidth={2} className="opacity-90" />
        </h1>
        <p className="text-sm opacity-75 mt-1">by helPhin</p>
      </div>
      <div className="relative">
        <Image
          src="/Assets/gedung_kampus_image.png"
          alt="Gedung Kampus"
          width={350}
          height={350}
          priority
        />
        <div className="absolute left-4 inset-0 bg-gradient-to-t from-[#07A3F9] via-transparent via-25% to-transparent" />
      </div>
    </header>
  );
}
