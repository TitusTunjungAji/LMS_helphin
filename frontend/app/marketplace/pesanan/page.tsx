"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { rupiah } from "../data";
import { readOrders, type SessionOrder } from "../orders";
import { MarketplaceShell, popClass } from "../Shell";

function when(at: number) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(at);
}

export default function PesananPage() {
  const [orders, setOrders] = useState<SessionOrder[]>([]);

  useEffect(() => {
    const sync = () => setOrders(readOrders());
    sync();
    window.addEventListener("helphin-orders", sync);
    return () => window.removeEventListener("helphin-orders", sync);
  }, []);

  return (
    <MarketplaceShell>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <section className="rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <h1 className="font-[family-name:var(--font-fredoka)] text-[32px] font-bold leading-none">Pesanan saya</h1>
          <p className="mt-2 text-[14px] font-medium text-[#607D8B]">Sesi yang sudah dibeli dari marketplace.</p>
        </section>
        {orders.length === 0 ? (
          <div className="mt-4 rounded-[28px] border-[3px] border-white bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
            <p className="text-[14px] font-medium text-[#607D8B]">Belum ada sesi. Pilih mentor, lalu tekan Beli sesi.</p>
            <Link href="/marketplace?tampilan=direktori" className={popClass("ocean", "mt-4")}>Lihat mentor</Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="rounded-[28px] border-[3px] border-white bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-[family-name:var(--font-fredoka)] text-[22px] font-bold leading-none">{order.mentorName}</p>
                    <p className="mt-1 text-[13px] font-semibold text-[#607D8B]">{order.course} · {order.method}</p>
                  </div>
                  <p className="font-[family-name:var(--font-fredoka)] text-[18px] font-bold text-[#0288D1]">{rupiah(order.price)}</p>
                </div>
                {order.note ? <p className="mt-3 text-[14px] font-medium text-[#455A64]">{order.note}</p> : null}
                <p className="mt-3 text-[12px] font-semibold text-[#90A4AE]">{when(order.at)} · Dipesan</p>
                <Link href={`/marketplace/mentor/${order.mentorId}`} className="mt-3 inline-block text-[13px] font-bold text-[#0288D1]">Buka profil mentor</Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </MarketplaceShell>
  );
}
