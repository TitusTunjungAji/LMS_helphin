"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import BrandRings from "@/components/BrandRings";

interface CampusHeroProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  pills?: string[];
}

export default function CampusHero({
  kicker = "helPhin Campus",
  title,
  subtitle,
  pills = [],
}: CampusHeroProps) {
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date())
    );
  }, []);

  return (
    <section
      className="relative overflow-hidden rounded-[24px] min-h-[240px] md:min-h-[280px] bg-[#068DFF]"
    >
      <div data-campus-building className="absolute -inset-[14%] pointer-events-none">
        <Image
          src="/Assets/gedung_kampus_image.png"
          alt=""
          fill
          priority
          className="object-contain object-center blur-[3px] mix-blend-lighten"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#068DFF] via-[#068DFF]/40 to-transparent pointer-events-none" />
      <BrandRings className="absolute -left-36 -top-40 w-[520px] h-[520px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-[30%] opacity-30 pointer-events-none">
        <img src="/images/Vector%201.svg" alt="" className="w-full object-cover" />
      </div>

      {today ? (
        <p className="absolute top-4 right-4 md:top-5 md:right-6 z-20 text-[11px] md:text-[12px] text-white/90 bg-white/15 px-3 py-1 rounded-full">
          {today}
        </p>
      ) : null}

      <div className="relative z-10 flex flex-col justify-center min-h-[240px] md:min-h-[280px] px-7 md:px-10 py-8 text-white max-w-lg">
        <p className="text-sm text-white/80 mb-2">{kicker}</p>
        <h1 className="text-[28px] md:text-[36px] font-bold leading-[1.12] tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm md:text-base text-white/90 font-medium">{subtitle}</p>
        ) : null}
        {pills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {pills.map((pill) => (
              <span
                key={pill}
                className="text-[11px] md:text-xs font-medium bg-white/18 px-3 py-1 rounded-full"
              >
                {pill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
