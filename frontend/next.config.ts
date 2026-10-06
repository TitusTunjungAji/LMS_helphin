import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sql.js"],
  // Local only. A lockfile in the user home makes Turbopack watch that whole
  // folder and exhaust memory. Vercel sets its own tracing root.
  ...(process.env.VERCEL
    ? {}
    : { turbopack: { root: path.resolve(__dirname) } }),
};

export default nextConfig;
