export default function BrandRings({
  tone = "white",
  className = "",
}: {
  tone?: "white" | "blue";
  className?: string;
}) {
  const stroke = tone === "white" ? "rgba(255,255,255,0.18)" : "rgba(6,141,255,0.14)";
  return (
    <svg viewBox="0 0 900 900" fill="none" aria-hidden className={className}>
      <ellipse cx="430" cy="390" rx="430" ry="340" stroke={stroke} />
      <ellipse cx="430" cy="390" rx="315" ry="248" stroke={stroke} />
      <ellipse cx="430" cy="390" rx="200" ry="158" stroke={stroke} />
    </svg>
  );
}
