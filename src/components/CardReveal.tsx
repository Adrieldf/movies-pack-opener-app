"use client";

import { motion } from "framer-motion";
import { Sparkles, Film, Tv, Gamepad2, Headphones, Users, Music, Image } from "lucide-react";
import { CardData } from "../lib/tmdb";
import { getRarityColors, formatListeners, POKEMON_TYPE_COLORS } from "../lib/cardUtils";
import { ScrollableTitle } from "./ScrollableTitle";
import { JunkEffect } from "./JunkEffect";
import { PackType } from "./PackVisual";


type PackState = "sealed" | "tearing" | "opened" | "revealing" | "done";

interface CardRevealProps {
  card: CardData;
  idx: number;
  packType: PackType;
  packState: PackState;
  isFlipped: boolean;
  isAutoMode: boolean;
  showTrailerIdx: number | null;
  isNew: boolean;
  junkEffectCardIdx: number | null;
  zIndex: number;
  onClick: () => void;
  onJunkDone: () => void;
}

export const CardReveal = ({
  card,
  idx,
  packType,
  packState,
  isFlipped,
  isAutoMode,
  showTrailerIdx,
  isNew,
  junkEffectCardIdx,
  zIndex,
  onClick,
  onJunkDone,
}: CardRevealProps) => {
  let youtubeId: string | null = null;
  if (card.trailer) {
    const parts = card.trailer.split("v=");
    if (parts.length > 1) {
      youtubeId = parts[1].split("&")[0];
    }
  }

  const colors = getRarityColors(card.rarity);

  return (
    <motion.div
      key={card.id}
      initial={{ y: 50, scale: 0.8, opacity: 0 }}
      animate={{
        y: packState === "done" ? idx * 10 - 20 : 0,
        x: packState === "done" ? (idx - 2) * 20 : 0,
        scale: packState === "done" ? 0.9 : 1,
        opacity: 1,
        rotate: packState === "done" ? (idx - 2) * 5 : 0,
      }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
      onClick={onClick}
      className={`absolute ${isAutoMode ? "pointer-events-none" : "cursor-pointer"} perspective-1000 w-[368px] ${(packType === 'yugioh' || packType === 'mtg') ? 'h-[536px]' : 'h-[461px]'}`}
      style={{ zIndex }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        initial={{ rotateY: 180 }}
        animate={{ rotateY: isFlipped ? 0 : 180 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ── Card Back ── */}
        <div
          className="absolute inset-0 w-full h-full rounded-xl border-4 flex flex-col items-center justify-center backface-hidden overflow-hidden border-slate-500 shadow-[0_0_20px_rgba(100,116,139,0.5)]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* The Actual Card Back Image (TCG ONLY) */}
          {(packType === "yugioh" || packType === "mtg") ? (
            <div 
              className="absolute inset-0 bg-cover bg-center w-full h-full" 
              style={{ 
                backgroundImage: `url('${packType === "yugioh" ? "yugioh-back.png" : "mtg-back.png"}')`,
                backfaceVisibility: "hidden" 
              }} 
            />
          ) : (
            <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center p-2 overflow-hidden bg-slate-950`}>
              {/* Theme-specific Background & Patterns */}
              {packType === "movies" && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/40 to-slate-950" />
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                  <div className="absolute left-1 top-0 bottom-0 w-3 flex flex-col py-1 space-y-1.5 opacity-40">
                    {Array.from({ length: 24 }).map((_, i) => <div key={`l-${i}`} className="w-full h-2 bg-black rounded-sm shadow-inner"></div>)}
                  </div>
                  <div className="absolute right-1 top-0 bottom-0 w-3 flex flex-col py-1 space-y-1.5 opacity-40">
                    {Array.from({ length: 24 }).map((_, i) => <div key={`r-${i}`} className="w-full h-2 bg-black rounded-sm shadow-inner"></div>)}
                  </div>
                </>
              )}

              {packType === "games" && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-950" />
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] scale-150" />
                  <div className="absolute top-4 left-4 w-12 h-12 border-2 border-blue-400/20 rounded-full" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-2 border-indigo-400/20 rotate-45" />
                </>
              )}

              {packType === "music" && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-slate-950 to-black" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="absolute rounded-full border border-emerald-500" style={{ width: `${(i+1)*20}%`, height: `${(i+1)*20}%` }} />
                    ))}
                  </div>
                </>
              )}

              {packType === "anime" && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-rose-950 via-slate-950 to-pink-900/30" />
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/binding-dark.png')]" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-[60px]" />
                </>
              )}

              {packType === "pokemon" && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-red-900 via-slate-950 to-slate-900" />
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-black/60" />
                </>
              )}

              {packType === "boardgame" && (
                <>
                  <div className="absolute inset-0 bg-[#3d2b1f]" />
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
                  <div className="absolute top-8 left-8 bottom-8 right-8 border-2 border-amber-900/30 rounded-lg" />
                </>
              )}

              {packType === "giphy" && (
                <>
                   <div className="absolute inset-0 bg-gradient-to-bl from-cyan-900 via-blue-950 to-black" />
                   <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/shattered.png')]" />
                   <div className="absolute inset-0 flex flex-wrap gap-1 opacity-5">
                      {Array.from({ length: 100 }).map((_, i) => <div key={i} className="w-4 h-4 bg-white"></div>)}
                   </div>
                </>
              )}

              {packType === "disney" && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-sky-950 to-indigo-900" />
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,_#fde047_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-yellow-500/20 blur-sm"></div>
                </>
              )}

              {/* Central Icon Container */}
              <div className={`relative w-32 h-32 flex items-center justify-center p-2 mb-6 ${packType === 'pokemon' ? '' : 'drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]'}`}>
                {packType !== 'pokemon' && <div className={`absolute inset-0 rounded-full border-2 border-slate-500/20 backdrop-blur-sm bg-black/20`} />}
                <div className="absolute inset-2 rounded-full border border-dashed border-slate-400/40 animate-[spin_30s_linear_infinite]"></div>
                
                <div className={`text-5xl filter brightness-125 ${packType === 'pokemon' ? '' : 'drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'}`}>
                  {packType === "games" ? "🎮" : packType === "music" ? "🎧" : packType === "anime" ? "🌸" : packType === "pokemon" ? "⚡" : packType === "boardgame" ? "🎲" : packType === "giphy" ? "🖼️" : packType === "disney" ? "🏰" : "🎬"}
                </div>
              </div>

              {/* Label */}
              <div className="relative z-10 text-center">
                <div className="text-slate-300 font-extrabold text-2xl tracking-[0.25em] font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
                   <span className="text-white/60 font-black tracking-[0.2em]">
                    {packType === "games" ? "GAMING" : packType === "music" ? "VINYL" : packType === "anime" ? "ANIME" : packType === "pokemon" ? "POKÉMON" : packType === "boardgame" ? "BOARD" : packType === "giphy" ? "GIF" : packType === "disney" ? "DISNEY" : "CINEMA"}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-3 mt-1.5 opacity-60">
                   <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-slate-400" />
                   <span className="text-[10px] font-black tracking-[0.4em] text-slate-300 uppercase">COLLECTION</span>
                   <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-slate-400" />
                </div>
              </div>
            </div>
          )}

          {packState === "revealing" && !isFlipped && (
            <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-black tracking-[0.2em] text-slate-400/80 animate-pulse uppercase">
              {isAutoMode ? "Auto-Revealing..." : "Tap to Flip"}
            </div>
          )}
        </div>

        {/* ── Card Front ── */}
        <div
          className={`absolute inset-0 w-full h-full bg-gradient-to-br ${colors.bg} rounded-xl p-1 shadow-2xl backface-hidden`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className={`w-full h-full border-2 ${colors.border} ${colors.animate} rounded-lg flex flex-col bg-black/40 backdrop-blur-sm relative overflow-hidden`}>
            {/* Background poster */}
            {card.poster && (
              <motion.img
                referrerPolicy="no-referrer"
                src={card.poster}
                className={`absolute inset-0 w-full h-full object-cover ${(card.type === 'giphy' || card.type === 'yugioh' || card.type === 'mtg') ? 'opacity-100 mix-blend-normal' : 'opacity-80 mix-blend-overlay'} transition-opacity duration-1000`}
                style={{ opacity: showTrailerIdx === idx && youtubeId ? 0 : ((card.type === 'giphy' || card.type === 'yugioh' || card.type === 'mtg') ? 1 : 0.8) }}
              />
            )}

            {/* YouTube trailer overlay */}
            {showTrailerIdx === idx && youtubeId && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-overlay">
                <motion.iframe
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 1 }}
                  className="w-[300%] h-full -ml-[100%] scale-[1.3] pointer-events-none"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&showinfo=0`}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                />
              </div>
            )}

            {/* Gradient overlays */}
            {card.type !== 'yugioh' && card.type !== 'mtg' && (
              <>
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/40 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 via-black/30 to-transparent" />
              </>
            )}

            {/* Top: Rarity & Rating */}
            <div className="relative z-10 flex justify-between items-start w-full p-3">
              {/* Left: Rarity + platforms */}
              <div className="flex flex-col gap-1.5 items-start">
                {card.type !== "yugioh" && card.type !== "mtg" && (
                  <div className={`${colors.tagBg} backdrop-blur-md rounded px-2.5 py-1 flex items-center gap-1.5 shadow-lg border border-white/10`}>
                    <Sparkles className={`w-3.5 h-3.5 ${colors.icon}`} />
                    <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${colors.tagText}`}>{card.rarity}</span>
                  </div>
                )}
                {(card.type === "game" || card.type === "music" || card.type === "pokemon") && card.platforms && card.platforms.length > 0 && (
                  <div className="flex flex-col gap-1 items-start pl-1">
                    {card.platforms.map((p, pi) => {
                      const typeKey = p.toLowerCase();
                      const typeClass = card.type === "pokemon" ? (POKEMON_TYPE_COLORS[typeKey] || "bg-slate-700 border-slate-500 text-white") : card.type === "yugioh" ? "bg-amber-900/60 border-amber-500/40 text-amber-100 shadow-[0_0_8px_rgba(245,158,11,0.3)]" : (card.type === "music" ? "bg-green-900/50 border-green-400/40 text-green-100 shadow-[0_0_8px_rgba(74,222,128,0.2)]" : "bg-blue-900/50 border-cyan-400/40 text-cyan-100 shadow-[0_0_8px_rgba(34,211,238,0.2)]");
                      return (
                        <div key={pi} className={`${typeClass} backdrop-blur-md border text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded`}>
                          {p}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Rating + type tag */}
              <div className="flex flex-col items-end gap-1">
                {card.type !== "yugioh" && card.type !== "mtg" && (
                  <div className="bg-black/50 backdrop-blur rounded px-2 py-1">
                    <span className="text-yellow-400 font-bold text-sm">⭐ {(card.rating ?? 0).toFixed(1)}</span>
                  </div>
                )}
                {card.type !== "yugioh" && card.type !== "mtg" && (
                  <div className="bg-black/50 backdrop-blur rounded px-2 py-1 flex items-center gap-1">
                    {card.type === "movie" ? <Film className="w-3 h-3 text-slate-300" /> : card.type === "game" ? <Gamepad2 className="w-3 h-3 text-slate-300" /> : card.type === "music" ? <Headphones className="w-3 h-3 text-slate-300" /> : card.type === "anime" ? <Sparkles className="w-3 h-3 text-orange-400" /> : card.type === "pokemon" ? <Sparkles className="w-3 h-3 text-yellow-400" /> : card.type === "boardgame" ? <Sparkles className="w-3 h-3 text-amber-400" /> : card.type === "giphy" ? <Image className="w-3 h-3 text-cyan-400" /> : <Tv className="w-3 h-3 text-slate-300" />}
                    <span className="text-[10px] font-bold uppercase text-slate-300">{card.type}</span>
                  </div>
                )}
                {card.type === "boardgame" && card.rank && card.rank > 0 && (
                  <div className="bg-amber-950/40 backdrop-blur border border-amber-500/20 rounded px-2 py-0.5 mt-0.5 flex items-center gap-1 self-end">
                    <span className="text-[9px] font-black text-amber-300 tracking-wider">RANK #{card.rank}</span>
                  </div>
                )}
                {card.type === "music" && card.listeners !== undefined && (
                  <div className="bg-green-950/40 backdrop-blur border border-green-500/20 rounded px-2 py-0.5 mt-0.5 flex items-center gap-1 self-end">
                    <Users className="w-2.5 h-2.5 text-green-400" />
                    <span className="text-[9px] font-black text-green-300 tracking-wider">{formatListeners(card.listeners)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Title & Links */}
            <div className="relative z-10 mt-auto p-4 w-full flex flex-col items-center">
              {card.type !== "yugioh" && card.type !== "mtg" && <ScrollableTitle title={card.name} baseClass="text-lg font-black text-white uppercase tracking-tight drop-shadow-md leading-tight" />}
              {(card.type === "music" || (card.type !== "yugioh" && card.type !== "pokemon" && card.type !== "giphy" && card.description)) && card.description && (
                <div className="text-xs sm:text-sm font-bold text-white/70 drop-shadow-md text-center max-w-[90%] truncate mt-1">
                  {card.description}
                </div>
              )}
              {card.year && card.type !== "yugioh" && card.type !== "mtg" && card.type !== "pokemon" && card.type !== "giphy" && (
                <div className="text-xs font-bold text-white/60 mb-2 drop-shadow-md text-center">
                   {card.year}
                </div>
              )}
              {!isAutoMode && (
                <div className="flex gap-2 w-full justify-center mt-2">
                  {card.trailer && (
                    <a
                      href={card.trailer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${card.type === "music" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white text-xs font-bold py-1.5 px-3 rounded shadow-md transition-colors flex items-center gap-1`}
                      onClick={(e) => {
                        if (card.type === "music") {
                          e.preventDefault();
                          e.stopPropagation();
                          const audio = new Audio(card.trailer);
                          audio.volume = 0.5;
                          audio.play().catch(() => {});
                        } else {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {card.type === "music" ? <><Music className="w-3 h-3" /> Preview</> : "Trailer"}
                    </a>
                  )}
                  {card.imdb_link && card.type !== "yugioh" && card.type !== "mtg" && (
                    <a
                      href={card.imdb_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#f5c518] hover:bg-[#d6ab15] text-black text-xs font-bold py-1.5 px-3 rounded shadow-md transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {card.type === "game" ? "RAWG" : card.type === "music" ? "Apple" : card.type === "giphy" ? "Giphy" : card.type === "anime" ? "MAL" : card.type === "pokemon" ? "Dex" : card.type === "boardgame" ? "BGG" : "Info"}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Foil overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 mix-blend-overlay rounded-xl pointer-events-none"></div>

            {/* NEW! wax seal */}
            {isNew && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: -15 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
                className="absolute -top-2 -left-2 z-30 w-9 h-9 rounded-full bg-red-600 border-[2px] border-red-300/70 flex items-center justify-center p-1"
                style={{ boxShadow: "0 0 0 1px rgba(255,80,80,0.25), 0 3px 10px rgba(180,0,0,0.6)" }}
              >
                <span className="text-white text-[8px] font-black uppercase tracking-tighter text-center leading-[0.85]">NEW!</span>
              </motion.div>
            )}
          </div>

          {/* Junk smoke + flies effect */}
          {card.rarity === "Junk" && junkEffectCardIdx === idx && isFlipped && (
            <JunkEffect onDone={onJunkDone} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
