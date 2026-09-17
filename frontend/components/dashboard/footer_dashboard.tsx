"use client";
import Image from "next/image";

export default function FooterDashboard() {
  return (
    <div className="mt-5 flex items-center justify-between">
      <Image
        src="/Assets/Logo-helphin-biru.png"
        alt="Logo Helphin"
        width={80}
        height={28}
        priority
        className="object-contain opacity-50 dark:brightness-0 dark:invert"
      />
      <div className="space-x-5 text-xs text-gray-400">
        <span className="cursor-pointer hover:text-gray-600">About</span>
        <span className="cursor-pointer hover:text-gray-600">Policy</span>
        <span className="cursor-pointer hover:text-gray-600">Terms</span>
      </div>
    </div>
  );
}
