"use client";

import { useRef } from "react";
import { motion, useAnimation } from "framer-motion";
type AnimationControls = ReturnType<typeof useAnimation>;
import { RefreshCcw } from "lucide-react";

export type PackType = "movies" | "games" | "music" | "anime" | "pokemon" | "boardgame" | "giphy" | "yugioh" | "mtg" | "disney" | "digimon" | "lorcana" | "countries" | "pokemontcg" | "ghibli" | "dragonball" | "random";

interface PackVisualProps {
  packType: PackType;
  tearProgress: number;
  isLoading: boolean;
  isAutoMode: boolean;
  controls: AnimationControls;
  /** Called with the raw clientX so the parent can compute tear progress using this element's ref */
  onPointerDown: (e: React.PointerEvent, rect: DOMRect) => void;
  onPointerMove: (e: React.PointerEvent, rect: DOMRect) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

export const PackVisual = ({
  packType,
  tearProgress,
  isLoading,
  isAutoMode,
  controls,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: PackVisualProps) => {
  const topPartRef = useRef<HTMLDivElement>(null);

  const getRect = (): DOMRect => topPartRef.current!.getBoundingClientRect();

  const handlePointerDown = (e: React.PointerEvent) => {
    if (topPartRef.current) {
      try {
        topPartRef.current.setPointerCapture(e.pointerId);
      } catch (err) {
        console.warn("Failed to set pointer capture:", err);
      }
    }
    if (topPartRef.current) onPointerDown(e, getRect());
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (topPartRef.current) onPointerMove(e, getRect());
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (topPartRef.current) topPartRef.current.releasePointerCapture(e.pointerId);
    onPointerUp(e);
  };

  const topFoilContent = (
    <div className="w-full h-full flex flex-col pointer-events-none">
      <div className={`w-full h-4 ${packType === 'games' ? 'bg-gradient-to-b from-blue-400 to-blue-600' : packType === 'music' ? 'bg-gradient-to-b from-emerald-400 to-green-600' : packType === 'anime' ? 'bg-gradient-to-b from-pink-400 to-rose-600' : packType === 'pokemon' ? 'bg-gradient-to-b from-yellow-400 to-yellow-600' : packType === 'boardgame' ? 'bg-gradient-to-b from-amber-400 to-amber-600' : packType === 'giphy' ? 'bg-gradient-to-b from-cyan-400 to-blue-600' : packType === 'yugioh' ? 'bg-gradient-to-b from-amber-400 to-amber-600' : packType === 'mtg' ? 'bg-gradient-to-b from-purple-500 to-indigo-900 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : packType === 'disney' ? 'bg-gradient-to-b from-sky-400 to-blue-600' : packType === 'digimon' ? 'bg-gradient-to-b from-orange-400 to-orange-600' : packType === 'lorcana' ? 'bg-gradient-to-b from-yellow-500 to-yellow-700' : packType === 'countries' ? 'bg-gradient-to-b from-green-400 to-emerald-600' : packType === 'pokemontcg' ? 'bg-gradient-to-b from-blue-400 to-yellow-500' : packType === 'ghibli' ? 'bg-gradient-to-b from-sky-400 to-green-400' : packType === 'dragonball' ? 'bg-gradient-to-b from-orange-500 to-red-600' : 'bg-gradient-to-b from-slate-500 to-slate-600'} rounded-t-lg overflow-hidden flex shrink-0`}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`crimp-${i}`} className={`flex-1 border-r ${packType === 'games' ? 'border-blue-300/30' : packType === 'music' ? 'border-green-300/30' : packType === 'anime' ? 'border-pink-300/30' : packType === 'pokemon' ? 'border-yellow-300/30' : packType === 'boardgame' ? 'border-amber-300/30' : packType === 'yugioh' ? 'border-amber-300/30' : packType === 'mtg' ? 'border-purple-400/20' : packType === 'disney' ? 'border-sky-300/30' : packType === 'digimon' ? 'border-orange-300/30' : packType === 'lorcana' ? 'border-yellow-300/30' : packType === 'countries' ? 'border-green-300/30' : packType === 'pokemontcg' ? 'border-yellow-300/30' : packType === 'ghibli' ? 'border-sky-200/30' : packType === 'dragonball' ? 'border-orange-300/30' : 'border-slate-700/30'}`}></div>
        ))}
      </div>
      <div className={`w-full flex-1 ${packType === 'games' ? 'bg-gradient-to-b from-blue-700 via-indigo-900 to-blue-900 border-blue-400/30' : packType === 'music' ? 'bg-gradient-to-b from-green-600 via-emerald-800 to-green-950 border-green-400/30' : packType === 'anime' ? 'bg-gradient-to-b from-pink-700 via-rose-900 to-pink-950 border-pink-400/30' : packType === 'pokemon' ? 'bg-gradient-to-b from-yellow-700 via-red-900 to-yellow-950 border-yellow-400/30' : packType === 'boardgame' ? 'bg-gradient-to-b from-amber-700 via-orange-900 to-amber-950 border-amber-400/30' : packType === 'giphy' ? 'bg-gradient-to-b from-cyan-700 via-blue-900 to-cyan-950 border-cyan-400/30' : packType === 'yugioh' ? 'bg-gradient-to-b from-amber-700 via-orange-900 to-amber-950 border-amber-400/30' : packType === 'mtg' ? 'bg-gradient-to-b from-slate-900 via-purple-950 to-black border-purple-500/30' : packType === 'disney' ? 'bg-gradient-to-b from-blue-600 via-indigo-900 to-slate-950 border-blue-400/40 shadow-[inset_0_0_40px_rgba(59,130,246,0.2)]' : packType === 'digimon' ? 'bg-gradient-to-b from-orange-700 via-yellow-900 to-orange-950 border-orange-400/30' : packType === 'lorcana' ? 'bg-gradient-to-b from-yellow-700 via-amber-800 to-yellow-950 border-yellow-400/30' : packType === 'countries' ? 'bg-gradient-to-b from-emerald-700 via-teal-900 to-emerald-950 border-emerald-400/30' : packType === 'pokemontcg' ? 'bg-gradient-to-b from-blue-700 via-blue-900 to-yellow-900 border-yellow-400/30' : packType === 'ghibli' ? 'bg-gradient-to-b from-sky-600 via-green-700 to-green-950 border-sky-400/30 shadow-[inset_0_0_40px_rgba(52,211,153,0.2)]' : packType === 'dragonball' ? 'bg-gradient-to-b from-orange-600 via-red-700 to-red-950 border-orange-400/30 shadow-[inset_0_0_40px_rgba(239,68,68,0.2)]' : 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700/50'} relative overflow-hidden border-b shadow-inner`}>
        <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] ${packType === 'games' || packType === 'music' ? 'opacity-20 hue-rotate-180' : 'opacity-10'} mix-blend-overlay`}></div>
        {packType === 'games' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(56,189,248,0.4),_transparent)]"></div>}
        {packType === 'music' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(52,211,153,0.5),_transparent)]"></div>}
        {packType === 'anime' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(244,114,182,0.4),_transparent)]"></div>}
        {packType === 'pokemon' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(250,204,21,0.5),_transparent)]"></div>}
        {packType === 'boardgame' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(245,158,11,0.45),_transparent)]"></div>}
        {packType === 'giphy' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(34,211,238,0.5),_transparent)]"></div>}
        {packType === 'yugioh' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(245,158,11,0.5),_transparent)]"></div>}
        {packType === 'mtg' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(168,85,247,0.5),_transparent)]"></div>}
        {packType === 'disney' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(253,224,71,0.4),_transparent)]"></div>}
        {packType === 'digimon' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(249,115,22,0.4),_transparent)]"></div>}
        {packType === 'lorcana' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(250,204,21,0.6),_transparent)]"></div>}
        {packType === 'countries' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(16,185,129,0.5),_transparent)]"></div>}
        {packType === 'pokemontcg' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(59,130,246,0.5),_transparent)]"></div>}
        {packType === 'ghibli' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_white,_transparent_70%)] opacity-20"></div>}
        {packType === 'dragonball' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(251,191,36,0.6),_transparent)] opacity-40"></div>}
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex items-center justify-center px-4">
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
              <div className="flex flex-col items-center">
                <RefreshCcw className="w-8 h-8 text-white animate-spin mb-2" />
                <span className="text-white font-medium text-sm animate-pulse">Fetching Media...</span>
              </div>
            </div>
          )}
          {tearProgress < 10 && !isLoading && (
            <div className="bg-black/40 backdrop-blur text-white/90 text-xs py-1 px-3 rounded-full font-semibold animate-pulse shadow-lg border border-white/10">
              Swipe to Tear ✨
            </div>
          )}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] border-b-2 border-dashed ${packType === 'games' ? 'border-blue-400/40' : packType === 'music' ? 'border-green-400/40' : packType === 'anime' ? 'border-pink-400/40' : packType === 'pokemon' ? 'border-yellow-400/40' : packType === 'yugioh' ? 'border-amber-400/40' : packType === 'mtg' ? 'border-purple-400/40' : packType === 'disney' ? 'border-yellow-400/40' : packType === 'digimon' ? 'border-orange-400/40' : packType === 'lorcana' ? 'border-yellow-400/40' : packType === 'countries' ? 'border-emerald-400/40' : packType === 'pokemontcg' ? 'border-yellow-400/40' : packType === 'ghibli' ? 'border-sky-400/40' : packType === 'dragonball' ? 'border-yellow-400/40' : 'border-white/20'} truncate`}></div>
      </div>
    </div>
  );

  return (
    <motion.div
      className="absolute w-[368px] h-[461px] z-30 flex flex-col items-center"
      animate={{ y: [0, -5, 0], transition: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
    >
      <div className="relative w-full h-full flex flex-col group drop-shadow-2xl">
        {/* TOP TEARABLE PART */}
        <motion.div
          ref={topPartRef}
          onPointerDown={(e) => !isAutoMode && handlePointerDown(e)}
          onPointerMove={(e) => !isAutoMode && handlePointerMove(e)}
          onPointerUp={(e) => !isAutoMode && handlePointerUp(e)}
          onPointerCancel={(e) => !isAutoMode && handlePointerUp(e)}
          animate={controls}
          className={`relative h-1/4 w-full ${isAutoMode ? "pointer-events-none" : "cursor-pointer"} z-40 touch-none`}
          style={{
            transformOrigin: "100% 100%",
            transform: tearProgress > 0
              ? `rotate(${tearProgress * 0.05}deg) translateY(${-tearProgress * 0.05}px)`
              : 'none',
          }}
        >
          <div className="absolute inset-0 w-full h-full drop-shadow-2xl">
            {topFoilContent}
            {tearProgress > 0 && tearProgress < 100 && (
              <div
                className="absolute bottom-[-1px] left-0 h-[3px] bg-white/60 blur-[2px]"
                style={{ width: `${tearProgress}%` }}
              ></div>
            )}
          </div>
        </motion.div>

        {/* BOTTOM MAIN BODY */}
        <div className={`h-3/4 w-full ${packType === 'games' ? 'bg-gradient-to-b from-blue-900 via-indigo-950 to-black' : packType === 'anime' ? 'bg-gradient-to-b from-pink-900 via-rose-950 to-black' : packType === 'pokemon' ? 'bg-gradient-to-b from-yellow-900 via-red-950 to-black' : packType === 'boardgame' ? 'bg-gradient-to-b from-amber-900 via-orange-950 to-black' : packType === 'giphy' ? 'bg-gradient-to-b from-cyan-900 via-blue-950 to-black' : packType === 'yugioh' ? 'bg-gradient-to-b from-amber-800 via-orange-950 to-black' : packType === 'mtg' ? 'bg-gradient-to-b from-slate-900 via-purple-950 to-black' : packType === 'disney' ? 'bg-gradient-to-b from-blue-900 via-slate-900 to-black' : packType === 'digimon' ? 'bg-gradient-to-b from-orange-900 via-amber-950 to-black' : packType === 'lorcana' ? 'bg-gradient-to-b from-yellow-800 via-amber-950 to-black' : packType === 'countries' ? 'bg-gradient-to-b from-emerald-900 via-teal-950 to-black' : packType === 'pokemontcg' ? 'bg-gradient-to-b from-yellow-900 via-blue-950 to-black' : packType === 'ghibli' ? 'bg-gradient-to-b from-green-900 via-sky-950 to-black' : packType === 'dragonball' ? 'bg-gradient-to-b from-red-900 via-orange-950 to-black' : 'bg-gradient-to-b from-slate-800 to-black'} relative rounded-b-lg overflow-hidden shadow-2xl border-t ${packType === 'games' ? 'border-blue-400/50' : packType === 'anime' ? 'border-pink-400/50' : packType === 'pokemon' ? 'border-yellow-400/50' : packType === 'boardgame' ? 'border-amber-400/50' : packType === 'giphy' ? 'border-cyan-400/50' : packType === 'yugioh' ? 'border-amber-500/50' : packType === 'mtg' ? 'border-purple-500/30' : packType === 'disney' ? 'border-blue-500/40 shadow-[inset_0_20px_40px_rgba(59,130,246,0.1)]' : packType === 'digimon' ? 'border-orange-400/50' : packType === 'lorcana' ? 'border-yellow-400/50' : packType === 'countries' ? 'border-emerald-400/50' : packType === 'pokemontcg' ? 'border-blue-500/50' : packType === 'ghibli' ? 'border-sky-400/50' : packType === 'dragonball' ? 'border-orange-400/50' : 'border-slate-700'}`}>
          <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] ${packType === 'games' ? 'opacity-20 hue-rotate-180' : 'opacity-10'} mix-blend-overlay`}></div>
          {packType === 'games' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_rgba(56,189,248,0.2),_transparent)]"></div>}
          {packType === 'disney' && <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:40px_40px]"></div>}

          {/* Pack-specific side decorations */}
          {packType === "games" ? (
            <>
              <div className="absolute left-2 top-0 bottom-0 w-6 flex flex-col py-6 space-y-4 opacity-40 mix-blend-overlay justify-center">
                {Array.from({ length: 6 }).map((_, i) => <div key={`gl-${i}`} className="w-full h-2 bg-blue-300 rounded-full shadow-[0_0_8px_rgba(147,197,253,0.5)]"></div>)}
              </div>
              <div className="absolute right-2 top-0 bottom-0 w-6 flex flex-col py-6 space-y-4 opacity-40 mix-blend-overlay justify-center">
                {Array.from({ length: 6 }).map((_, i) => <div key={`gr-${i}`} className="w-full h-2 bg-blue-300 rounded-full shadow-[0_0_8px_rgba(147,197,253,0.5)]"></div>)}
              </div>
            </>
          ) : packType === "music" ? (
            <div className="absolute inset-0 flex items-center justify-around opacity-20 px-4 pointer-events-none mix-blend-overlay">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`bar-${i}`} className="w-2 bg-green-400 rounded-t-full shadow-[0_0_10px_rgba(74,222,128,0.8)]" style={{ height: `${20 + Math.random() * 60}%` }}></div>
              ))}
            </div>
          ) : packType === "anime" ? (
            <div className="absolute inset-0 flex items-center justify-around opacity-20 px-4 pointer-events-none mix-blend-overlay">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`petal-${i}`} className="w-4 h-4 bg-pink-300 rounded-full animate-pulse" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}></div>
              ))}
            </div>
          ) : packType === "boardgame" || packType === "yugioh" ? (
            <>
              <div className="absolute left-4 top-0 bottom-0 w-4 flex flex-col py-4 space-y-3 opacity-20 mix-blend-overlay">
                {Array.from({ length: 8 }).map((_, i) => <div key={`fl-${i}`} className={`w-full h-8 ${packType === "boardgame" ? "bg-amber-400" : "bg-white"} rounded-sm`}></div>)}
              </div>
              <div className="absolute right-4 top-0 bottom-0 w-4 flex flex-col py-4 space-y-3 opacity-20 mix-blend-overlay">
                {Array.from({ length: 8 }).map((_, i) => <div key={`fr-${i}`} className={`w-full h-8 ${packType === "boardgame" ? "bg-amber-400" : "bg-white"} rounded-sm`}></div>)}
              </div>
            </>
          ) : (
            <>
              <div className="absolute left-4 top-0 bottom-0 w-4 flex flex-col py-4 space-y-3 opacity-20 mix-blend-overlay">
                {Array.from({ length: 8 }).map((_, i) => <div key={`fl-${i}`} className="w-full h-8 bg-white rounded-sm"></div>)}
              </div>
              <div className="absolute right-4 top-0 bottom-0 w-4 flex flex-col py-4 space-y-3 opacity-20 mix-blend-overlay">
                {Array.from({ length: 8 }).map((_, i) => <div key={`fr-${i}`} className="w-full h-8 bg-white rounded-sm"></div>)}
              </div>
            </>
          )}

          {/* Center artwork */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            {packType === "games" ? (
              <div className="w-28 h-32 bg-slate-300 rounded-t-xl rounded-b-sm shadow-2xl relative flex flex-col overflow-hidden rotate-[3deg] border-2 border-slate-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                <div className="h-4 w-full flex justify-between px-3 pt-2 opacity-60">
                  {Array.from({ length: 5 }).map((_, i) => <div key={`ridge-${i}`} className="w-2.5 h-full bg-slate-500 rounded-sm"></div>)}
                </div>
                <div className="flex-1 m-2 mt-4 bg-gradient-to-br from-cyan-600 via-blue-500 to-emerald-500 rounded border border-white/40 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]">
                  <div className="absolute top-0 left-0 right-0 h-4 bg-white/10 skew-y-[-10deg] -translate-y-2"></div>
                  <span className="text-[9px] font-black text-white tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] mt-1">RAWG</span>
                  <div className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] mb-2 mt-1">👾</div>
                  <div className="absolute bottom-1 right-1 text-[7px] text-white/80 font-mono font-bold">V-SYNC</div>
                </div>
                <div className="h-2 border border-b-0 border-slate-500 w-1/2 mx-auto rounded-t-lg mb-0 bg-slate-100/50 shadow-inner"></div>
              </div>
            ) : packType === "music" ? (
              <div className="w-32 h-32 bg-slate-900 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden animate-[spin_5s_linear_infinite] border-4 border-slate-800">
                <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none"></div>
                <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none"></div>
                <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none"></div>
                <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none"></div>
                <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-emerald-500 to-green-700 border border-slate-900 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-[5px] font-black text-slate-900 mb-[1px]">HIT</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"></div>
                  <span className="text-[3px] font-black text-slate-900 mt-[1px]">ALBUM</span>
                </div>
              </div>
            ) : packType === "anime" ? (
              <div className="relative flex items-center justify-center">
                <div className="relative w-48 h-12 flex items-center justify-center rotate-[-15deg]">
                  {/* The Katana Blade */}
                  <div className="absolute left-12 w-48 h-2 bg-gradient-to-b from-slate-200 to-slate-400 rounded-tr-full rounded-br-full shadow-lg overflow-hidden">
                    <div className="absolute inset-0 bg-white/40 skew-x-[-45deg] translate-x-[-100%] animate-[shimmer_3s_infinite]"></div>
                  </div>
                  {/* The Guard (Tsuba) */}
                  <div className="absolute left-10 w-4 h-8 bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-full border border-yellow-800 shadow-md"></div>
                  {/* The Handle (Tsuka) */}
                  <div className="absolute left-[-4px] w-14 h-4 bg-gradient-to-b from-red-800 to-red-950 rounded-l-md border-y border-red-700 flex items-center justify-center">
                    <div className="w-full h-full flex gap-1 px-1">
                      {[1, 2, 3, 4].map(i => <div key={i} className="flex-1 border-x border-red-900/50 rotate-[20deg] bg-red-900/20"></div>)}
                    </div>
                  </div>
                </div>
                <div className="absolute w-32 h-32 flex items-center justify-center pointer-events-none">
                  <span className="text-6xl animate-pulse filter drop-shadow-[0_0_20px_rgba(244,114,182,1)] opacity-40">🌸</span>
                </div>
              </div>
            ) : packType === "pokemon" ? (
              <div className="relative flex items-center justify-center">
                {/* Poké Ball illustration */}
                <div className="w-32 h-32 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative overflow-hidden border-4 border-slate-800 animate-[spin_8s_linear_infinite]">
                  {/* Top half - red */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-red-500 to-red-700"></div>
                  {/* Bottom half - white */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-slate-100 to-slate-300"></div>
                  {/* Center band */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-4 bg-slate-900"></div>
                  {/* Center button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center z-10">
                    <div className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-inner"></div>
                  </div>
                </div>
                {/* Shimmer rings */}
                <div className="absolute w-36 h-36 rounded-full border border-yellow-400/20 animate-ping"></div>
                <div className="absolute w-44 h-44 rounded-full border border-yellow-300/10"></div>
              </div>
            ) : packType === "disney" ? (
              <div className="relative flex items-center justify-center">
                <div className="w-32 h-32 bg-sky-950 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative border-4 border-yellow-500/80 rotate-[-4deg] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#fde047_1px,_transparent_1px)] bg-[length:15px_15px] opacity-30"></div>
                  <div className="text-6xl drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] filter brightness-110">🏰</div>
                </div>
                <div className="absolute w-40 h-40 rounded-full border-2 border-yellow-400/20 animate-[spin_10s_linear_infinite] border-dashed"></div>
              </div>
            ) : packType === "boardgame" ? (
              <div className="relative flex items-center justify-center">
                {/* Dice illustration */}
                <div className="w-28 h-28 bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative border-4 border-amber-500/60 rotate-[12deg] flex items-center justify-center">
                  {/* Dice dots */}
                  <div className="absolute inset-3 grid grid-cols-3 grid-rows-3 gap-1">
                    {[true, false, false, false, true, false, false, false, true].map((filled, i) => (
                      <div key={i} className={`rounded-full ${filled ? 'bg-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]' : ''}`}></div>
                    ))}
                  </div>
                </div>
                <div className="absolute w-32 h-32 rounded-2xl border border-amber-400/20 animate-ping rotate-[12deg]"></div>
              </div>
            ) : packType === "giphy" ? (
              <div className="relative flex items-center justify-center">
                <div className="w-32 h-32 bg-slate-800 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative border-4 border-cyan-500/60 rotate-[-8deg] overflow-hidden flex flex-col">
                  <div className="bg-cyan-500/20 p-1 flex justify-between border-b border-cyan-500/30">
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-cyan-400/60"></div>)}
                    </div>
                    <div className="w-4 h-1 rounded-full bg-cyan-400/40"></div>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                    🖼️
                  </div>
                  <div className="bg-black/40 p-1 text-[8px] font-black text-cyan-300 tracking-widest text-center italic">
                    POW!
                  </div>
                </div>
                <div className="absolute w-36 h-36 border border-cyan-400/20 animate-pulse rotate-[-8deg]"></div>
              </div>
            ) : packType === "yugioh" ? (
              <div className="relative flex items-center justify-center">
                {/* Stylized Yugioh Card Back illustration */}
                <div className="w-24 h-32 bg-[#4a2e21] rounded-lg shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative border-4 border-[#c5a059] rotate-[-5deg] flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-1 border border-[#c5a059]/40 rounded-sm"></div>
                  <div className="w-16 h-16 rounded-full border-2 border-[#c5a059]/60 flex items-center justify-center relative bg-orange-900/20 shadow-inner">
                    <div className="absolute inset-1 rounded-full border border-dashed border-[#c5a059]/40 animate-[spin_10s_linear_infinite]"></div>
                    <span className="text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🃏</span>
                  </div>
                  <div className="mt-2 text-[6px] font-black text-[#c5a059] tracking-[0.2em] uppercase">Yu-Gi-Oh!</div>
                </div>
                {/* Secondary card peaking out */}
                <div className="absolute w-24 h-32 bg-[#4a2e21] rounded-lg border-4 border-[#c5a059]/60 rotate-[8deg] -z-10 translate-x-4 opacity-70"></div>

                {/* Shimmer effect */}
                <div className="absolute w-40 h-40 rounded-full bg-yellow-500/5 blur-3xl animate-pulse"></div>
              </div>
            ) : packType === "mtg" ? (
              <div className="relative flex items-center justify-center">
                <div className="absolute w-48 h-48 bg-purple-500/10 blur-[60px] animate-pulse"></div>
                {/* Minimalist Mana Circle */}
                <div className="relative w-24 h-24 flex items-center justify-center rounded-full border border-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                  {[0, 72, 144, 216, 288].map((deg, i) => {
                    const colors = ["bg-[#fdfde3]", "bg-[#33b8e4]", "bg-[#1d1e21]", "bg-[#e51d2e]", "bg-[#04613a]"];
                    const glows = [
                      "shadow-[0_0_8px_rgba(253,253,227,0.4)]",
                      "shadow-[0_0_8px_rgba(51,184,228,0.4)]",
                      "shadow-[0_0_8px_rgba(29,30,33,0.4)]",
                      "shadow-[0_0_8px_rgba(229,29,46,0.4)]",
                      "shadow-[0_0_8px_rgba(4,97,58,0.4)]"
                    ];
                    return (
                      <div
                        key={i}
                        className={`absolute w-3 h-3 rounded-full ${colors[i]} ${glows[i]}`}
                        style={{ transform: `rotate(${deg}deg) translateY(-28px)` }}
                      />
                    );
                  })}
                </div>
              </div>
            ) : packType === "digimon" ? (
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 bg-orange-200 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative border-4 border-orange-500 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 border-4 border-orange-400 rounded-full m-1"></div>
                  <div className="w-16 h-12 bg-emerald-900/80 rounded-md border-2 border-slate-700 shadow-inner flex items-center justify-center">
                    <span className="text-xl filter drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">🦖</span>
                  </div>
                  <div className="mt-1 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-inner"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-inner"></div>
                  </div>
                </div>
                <div className="absolute w-32 h-32 rounded-full border border-orange-400/20 animate-ping"></div>
              </div>
            ) : packType === "lorcana" ? (
              <div className="relative flex flex-col items-center justify-center">
                <div className="w-24 h-32 bg-gradient-to-b from-yellow-300 via-yellow-500 to-amber-600 rounded-lg shadow-[0_0_30px_rgba(250,204,21,0.6)] relative border-[3px] border-amber-200 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
                  <div className="absolute inset-1 border border-amber-300/60 rounded"></div>
                  <span className="text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10">✒️</span>
                  <div className="absolute bottom-2 text-[8px] font-black text-amber-950 tracking-[0.2em] uppercase opacity-60 z-10">INK</div>
                </div>
              </div>
            ) : packType === "countries" ? (
              <div className="relative flex flex-col items-center justify-center">
                <div className="w-24 h-32 bg-gradient-to-b from-emerald-500 to-teal-700 rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.5)] relative border-2 border-emerald-300 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                  <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] z-10">🌍</span>
                </div>
                <div className="absolute w-32 h-32 rounded-full border border-emerald-400/20 animate-[spin_4s_linear_infinite] border-t-emerald-400"></div>
              </div>
            ) : packType === "pokemontcg" ? (
              <div className="relative flex flex-col items-center justify-center">
                <div className="w-24 h-32 bg-gradient-to-b from-blue-500 to-yellow-600 rounded-lg shadow-[0_0_30px_rgba(59,130,246,0.5)] relative border-2 border-yellow-300 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
                  <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] z-10">⚡</span>
                </div>
              </div>
            ) : packType === "ghibli" ? (
              <div className="relative flex flex-col items-center justify-center">
                <div className="w-28 h-28 bg-white/10 rounded-full shadow-[0_0_30px_rgba(52,211,153,0.3)] relative border-2 border-sky-300 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-sky-400 to-green-300 mix-blend-overlay"></div>
                  <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(255,255,255,1)] z-10">🍃</span>
                </div>
                <div className="absolute w-32 h-32 rounded-full border border-sky-300/30 border-t-white animate-[spin_8s_linear_infinite]"></div>
              </div>
            ) : packType === "dragonball" ? (
              <div className="relative flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-orange-500 rounded-full shadow-[0_0_40px_rgba(249,115,22,0.6)] relative border-4 border-yellow-400 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
                  <span className="text-5xl filter drop-shadow-[0_0_10px_rgba(255,255,0,0.8)] z-10 text-red-600 font-bold">Z</span>
                </div>
              </div>
            ) : (
              <div className="w-32 h-28 bg-slate-900 rounded-md shadow-2xl relative flex flex-col overflow-hidden rotate-[-4deg] border border-slate-700 drop-shadow-xl">
                <div className="h-7 w-full relative overflow-hidden border-b-2 border-slate-800 z-10 shrink-0">
                  <div className="flex w-[150%] h-full -ml-6">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={`clap-${i}`} className={`w-8 h-full transform -skew-x-[35deg] ${i % 2 === 0 ? 'bg-slate-200' : 'bg-slate-950'}`}></div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col p-2 bg-slate-800 shadow-inner relative justify-center items-center">
                  <div className="absolute top-1 left-2 text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase opacity-70">Scene</div>
                  <div className="absolute top-1 right-2 text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase opacity-70">Take</div>
                  <div className="text-4xl mt-3 drop-shadow-lg filter grayscale brightness-125">🎥</div>
                </div>
              </div>
            )}
          </div>

          {/* Pack name label */}
          <div className="absolute bottom-8 left-0 right-0 text-center font-black text-xl text-slate-200 uppercase tracking-[0.2em] shadow-black drop-shadow-lg">
            {packType === "games" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.5)]">GAMING PACK</span>
            ) : packType === "music" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">VINYL PACK</span>
            ) : packType === "anime" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-200 to-fuchsia-300 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]">ANIME CHARACTERS PACK</span>
            ) : packType === "pokemon" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-300 to-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
                POKÉMON PACK
              </span>
            ) : packType === "boardgame" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-200 to-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">
                BOARD GAME PACK
              </span>
            ) : packType === "giphy" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                GIPHY PACK
              </span>
            ) : packType === "yugioh" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] uppercase tracking-widest">Duelist Pack</span>
            ) : packType === "mtg" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-fuchsia-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)] uppercase tracking-widest">MTG PACK</span>
            ) : packType === "disney" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-300 to-yellow-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">DISNEY PACK</span>
            ) : packType === "digimon" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-yellow-200 to-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">DIGIMON PACK</span>
            ) : packType === "lorcana" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">LORCANA PACK</span>
            ) : packType === "countries" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-green-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">WORLD PACK</span>
            ) : packType === "pokemontcg" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-yellow-200 to-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">PTCG PACK</span>
            ) : packType === "ghibli" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-sky-100 to-green-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] tracking-widest font-serif">GHIBLI PACK</span>
            ) : packType === "dragonball" ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-200 to-red-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] font-black tracking-widest italic">Z WARRIORS</span>
            ) : "Cinema Pack"}
          </div>

          {/* Bottom crimp strip */}
          <div className={`absolute bottom-0 left-0 right-0 h-4 ${packType === 'games' ? 'bg-gradient-to-t from-blue-700 to-blue-500' : packType === 'music' ? 'bg-gradient-to-t from-green-800 to-green-600' : packType === 'anime' ? 'bg-gradient-to-t from-pink-800 to-pink-600' : packType === 'pokemon' ? 'bg-gradient-to-t from-red-800 to-yellow-600' : packType === 'boardgame' ? 'bg-gradient-to-t from-amber-800 to-amber-600' : packType === 'giphy' ? 'bg-gradient-to-t from-cyan-800 to-cyan-600' : packType === 'yugioh' ? 'bg-gradient-to-t from-amber-800 to-amber-600' : packType === 'mtg' ? 'bg-gradient-to-t from-purple-950 to-purple-800' : packType === 'disney' ? 'bg-gradient-to-t from-indigo-900 to-blue-600' : packType === 'digimon' ? 'bg-gradient-to-t from-orange-800 to-orange-600' : packType === 'lorcana' ? 'bg-gradient-to-t from-yellow-700 to-yellow-500' : packType === 'countries' ? 'bg-gradient-to-t from-emerald-800 to-teal-600' : packType === 'pokemontcg' ? 'bg-gradient-to-t from-blue-800 to-yellow-600' : packType === 'ghibli' ? 'bg-gradient-to-t from-green-700 to-sky-600' : packType === 'dragonball' ? 'bg-gradient-to-t from-red-800 to-orange-600' : 'bg-gradient-to-t from-slate-600 to-slate-500'} rounded-b-lg overflow-hidden flex`}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={`crimp-b-${i}`} className={`flex-1 border-r ${packType === 'games' ? 'border-blue-400/30' : packType === 'music' ? 'border-green-400/30' : packType === 'anime' ? 'border-pink-400/30' : packType === 'pokemon' ? 'border-yellow-400/30' : packType === 'boardgame' ? 'border-amber-400/30' : packType === 'giphy' ? 'border-cyan-400/30' : packType === 'yugioh' ? 'border-amber-400/30' : packType === 'mtg' ? 'border-purple-500/20' : packType === 'disney' ? 'border-blue-400/30' : packType === 'digimon' ? 'border-orange-400/30' : packType === 'lorcana' ? 'border-yellow-400/30' : packType === 'countries' ? 'border-emerald-400/30' : packType === 'pokemontcg' ? 'border-yellow-400/30' : packType === 'ghibli' ? 'border-sky-300/30' : packType === 'dragonball' ? 'border-yellow-400/30' : 'border-slate-700/30'}`}></div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
