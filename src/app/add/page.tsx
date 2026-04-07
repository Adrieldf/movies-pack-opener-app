"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PackType } from "../../components/PackVisual";

function AddToQueueInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const type = searchParams.get("type") as PackType;
    const count = parseInt(searchParams.get("count") || "5", 10);
    const user = searchParams.get("user") || undefined;

    if (type) {
      const newItem = {
        id: crypto.randomUUID(),
        type,
        count,
        username: user,
      };

      try {
        const saved = localStorage.getItem("gacha_overlay_queue");
        const queue = saved ? JSON.parse(saved) : [];
        localStorage.setItem("gacha_overlay_queue", JSON.stringify([...queue, newItem]));
        
        // Use storage event to notify other tabs (like the overlay)
        window.dispatchEvent(new Event("storage"));
      } catch (e) {
        console.error("Failed to add to queue", e);
      }

      // Briefly show success then redirect to home or close
      const t = setTimeout(() => {
        router.push("/");
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xl font-black uppercase tracking-widest text-purple-400">
          Adding to Queue...
        </div>
        <div className="text-sm text-white/40">
          {searchParams.get("user") ? `Redeemed by ${searchParams.get("user")}` : "New pack request"}
        </div>
      </div>
    </div>
  );
}

export default function AddToQueuePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddToQueueInner />
    </Suspense>
  );
}
