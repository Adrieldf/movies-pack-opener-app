"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { Sparkles, RefreshCcw } from "lucide-react";

type PackState = "sealed" | "tearing" | "opened" | "revealing" | "done";

export default function Home() {
  const [packState, setPackState] = useState<PackState>("sealed");
  const [tearProgress, setTearProgress] = useState(0); // 0 to 100
  const [isTearing, setIsTearing] = useState(false);

  const topPartRef = useRef<HTMLDivElement>(null);
  const isOpenedRef = useRef(false);
  const controls = useAnimation();

  const handleOpen = useCallback(() => {
    if (isOpenedRef.current) return;
    isOpenedRef.current = true;
    setPackState("opened");
    setTearProgress(100);
    controls.start({
      y: -150,
      x: 100,
      opacity: 0,
      rotate: 25,
      transition: { duration: 0.6, ease: "easeOut" },
    });

    // Auto move to reveal cards after a short delay
    setTimeout(() => {
      setPackState("revealing");
    }, 800);
  }, [controls]);

  const updateTear = (clientX: number) => {
    if (topPartRef.current && !isOpenedRef.current) {
      const rect = topPartRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let progress = (x / rect.width) * 100;
      progress = Math.max(0, Math.min(100, progress));

      setTearProgress((prev) => {
        const newProgress = Math.max(prev, progress);
        if (newProgress >= 85) {
          setTimeout(handleOpen, 0);
          return 100;
        }
        return newProgress;
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (packState !== "sealed" && packState !== "tearing") return;
    setIsTearing(true);
    setPackState("tearing");
    updateTear(e.clientX);
    if (topPartRef.current) {
      topPartRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isTearing) return;
    updateTear(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isTearing) return;
    setIsTearing(false);
    if (topPartRef.current) {
      topPartRef.current.releasePointerCapture(e.pointerId);
    }
    if (tearProgress > 85) {
      handleOpen();
    } else {
      // Snap back if not torn far enough
      setTearProgress(0);
      setPackState("sealed");
    }
  };

  const handleRevealClick = () => {
    if (packState === "revealing") {
      setPackState("done");
    }
  };

  const topFoilContent = (
    <div className="w-full h-full flex flex-col pointer-events-none">
      {/* Foil Crimping Top */}
      <div className="w-full h-4 bg-gradient-to-b from-slate-400 to-slate-500 rounded-t-lg overflow-hidden flex shrink-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`crimp-${i}`} className="flex-1 border-r border-slate-600/30"></div>
        ))}
      </div>

      {/* Pack Top Body */}
      <div className="w-full flex-1 bg-gradient-to-b from-purple-600 to-purple-700 relative overflow-hidden border-b border-purple-500/50 shadow-inner">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex items-center justify-center px-4">
          {(packState === "sealed" || packState === "tearing") && tearProgress < 10 && (
            <div className="bg-white/20 backdrop-blur text-white text-xs py-1 px-3 rounded-full font-semibold animate-pulse shadow-lg border border-white/20">
              Swipe to Tear ✨
            </div>
          )}
        </div>
        {/* Tear line indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] border-b-2 border-dashed border-white/30 truncate"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans text-white">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(120,0,255,0.1),_rgba(0,0,0,1))] pointer-events-none" />

      <main className="relative z-10 w-full max-w-md mx-auto p-6 h-[100dvh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-12 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Pocket Pack Opener
        </h1>

        <div className="w-full aspect-[2/3] relative flex items-center justify-center select-none">

          {/* CARDS */}
          {(packState === "revealing" || packState === "done") && (
            <motion.div
              initial={{ y: 50, scale: 0.8, opacity: 0 }}
              animate={
                packState === "revealing"
                  ? { y: 0, scale: 1, opacity: 1 }
                  : { y: -20, scale: 1.1, opacity: 1 }
              }
              transition={{ type: "spring", bounce: 0.5 }}
              onClick={handleRevealClick}
              className={`absolute cursor-pointer perspective-1000 w-64 h-80 z-20 ${packState === "done" ? 'z-50' : ''}`}
            >
              <motion.div
                className="w-full h-full relative preserve-3d"
                initial={{ rotateY: 180 }}
                animate={{ rotateY: packState === "done" ? 0 : 180 }}
                transition={{ duration: 0.8, type: "spring" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Card Back */}
                <div
                  className="absolute inset-0 w-full h-full bg-blue-900 rounded-xl border-4 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center backface-hidden"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="text-blue-300 font-bold text-2xl tracking-widest uppercase rotate-45 opacity-50">
                    GATCHA
                  </div>
                  {packState === "revealing" && (
                    <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-blue-200 animate-pulse">
                      Tap to flip
                    </div>
                  )}
                </div>

                {/* Card Front */}
                <div
                  className="absolute inset-0 w-full h-full bg-gradient-to-br from-yellow-300 via-amber-200 to-orange-400 rounded-xl p-1 shadow-2xl backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="w-full h-full border-2 border-yellow-100/50 rounded-lg flex flex-col items-center bg-black/10 backdrop-blur-sm p-4 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/30 rounded-full blur-2xl"></div>
                    <div className="w-full h-1/2 bg-white/20 rounded-md mb-4 flex items-center justify-center">
                      <Sparkles className="w-16 h-16 text-yellow-100" />
                    </div>
                    <h2 className="text-xl font-black text-amber-900 w-full text-center uppercase tracking-wider mb-2">
                      Ultra Rare Placeholder
                    </h2>
                    <p className="text-amber-800 text-sm text-center font-medium">
                      Congratulations! You pulled a super rare placeholder item!
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 mix-blend-overlay rounded-xl pointer-events-none"></div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* THE PACK */}
          {packState !== "done" && (
            <motion.div
              className={`absolute w-64 h-80 z-30 flex flex-col items-center ${packState === "revealing" ? "pointer-events-none" : ""
                }`}
              animate={
                packState === "sealed"
                  ? { y: [0, -5, 0], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } }
                  : packState === "revealing"
                    ? { y: 200, opacity: 0, scale: 0.9, transition: { duration: 0.8, delay: 0.2 } }
                    : {}
              }
            >
              <div className="relative w-full h-full flex flex-col group drop-shadow-2xl">

                {/* TOP TEARABLE PART */}
                <motion.div
                  ref={topPartRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  animate={controls}
                  className="relative h-1/4 w-full cursor-pointer z-40 touch-none"
                  style={{
                    transformOrigin: "100% 100%",
                    transform: tearProgress > 0
                      ? `rotate(${tearProgress * 0.05}deg) translateY(${-tearProgress * 0.05}px)`
                      : 'none',
                  }}
                >
                  <div className="absolute inset-0 w-full h-full drop-shadow-2xl">
                    {topFoilContent}

                    {/* Horizontal Tear edge glow to emphasize the cut opening */}
                    {tearProgress > 0 && tearProgress < 100 && (
                      <div
                        className="absolute bottom-[-1px] left-0 h-[3px] bg-white/60 blur-[2px]"
                        style={{ width: `${tearProgress}%` }}
                      ></div>
                    )}
                  </div>
                </motion.div>

                {/* BOTTOM MAIN BODY */}
                <div className="h-3/4 w-full bg-gradient-to-b from-purple-700 to-indigo-900 relative rounded-b-lg overflow-hidden shadow-2xl border-t border-indigo-800">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="w-32 h-32 rounded-full border-4 border-purple-400/30 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border-4 border-t-purple-300 border-r-pink-300 border-b-transparent border-l-transparent rotate-45 opacity-50"></div>
                      <Sparkles className="w-12 h-12 text-pink-300 opacity-80" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-0 right-0 text-center font-bold text-lg text-purple-200 uppercase tracking-widest shadow-black drop-shadow-md">
                    Series 1
                  </div>

                  {/* Foil Crimping Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-500 to-slate-400 rounded-b-lg overflow-hidden flex">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={`crimp-b-${i}`} className="flex-1 border-r border-slate-600/30"></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* CONTROLS */}
        <motion.div
          className="mt-12 h-16 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: packState === "done" ? 1 : 0 }}
          transition={{ delay: 0.5 }}
        >
          {packState === "done" && (
            <button
              onClick={() => {
                isOpenedRef.current = false;
                setPackState("sealed");
                setTearProgress(0);
                controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
              }}
              className="group flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-pink-500/25 transition-all transform hover:scale-105 active:scale-95"
            >
              <RefreshCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
              Open Another Pack
            </button>
          )}
        </motion.div>
      </main>
    </div>
  );
}

