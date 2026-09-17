import Image from "next/image";

export default function DolphinMark({
  size = 64,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#068DFF] ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/Assets/helphin_1.png"
        alt=""
        fill
        className="object-contain mix-blend-screen p-1"
      />
    </div>
  );
}
