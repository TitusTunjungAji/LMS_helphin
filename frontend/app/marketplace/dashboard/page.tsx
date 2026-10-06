"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readSession, type MarketplaceSession } from "../data";
import { MentorHome } from "../MentorHome";
import { MarketplaceLoading, MarketplaceShell, popClass } from "../Shell";

export default function MentorDashboardPage() {
  const [session, setSession] = useState<MarketplaceSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    setReady(true);
    window.addEventListener("helphin-session", sync);
    return () => window.removeEventListener("helphin-session", sync);
  }, []);

  if (!ready) {
    return (
      <MarketplaceShell>
        <MarketplaceLoading />
      </MarketplaceShell>
    );
  }

  if (!session?.mentor) {
    return (
      <MarketplaceShell>
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
            <h1 className="font-[family-name:var(--font-fredoka)] text-[32px] font-bold">Dashboard mentor</h1>
            <p className="mt-2 text-[14px] font-medium text-[#607D8B]">Akun ini belum terdaftar sebagai mentor.</p>
            <Link href="/marketplace/daftar" className={popClass("ocean", "mt-5")}>Daftar sebagai mentor</Link>
          </div>
        </main>
      </MarketplaceShell>
    );
  }

  return <MentorHome session={session} />;
}
