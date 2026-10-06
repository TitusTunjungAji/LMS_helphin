"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AkunPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/marketplace/masuk");
  }, [router]);
  return null;
}
