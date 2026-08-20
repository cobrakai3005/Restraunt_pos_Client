"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main POS terminal
    router.replace("/employee");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-400">
      <p className="font-semibold text-sm">Opening POS Terminal...</p>
    </div>
  );
}
