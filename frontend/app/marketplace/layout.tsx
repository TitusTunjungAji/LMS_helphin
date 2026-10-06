import { Fredoka, Outfit } from "next/font/google";
import type { Metadata } from "next";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Marketplace Mentor — helPhin",
  description: "Layanan pendampingan belajar bagi mahasiswa Telkom University.",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fredoka.variable} ${outfit.variable}`}>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      {children}
    </div>
  );
}
