"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Film, Tv, Gamepad2, Headphones, Music, Image, ChevronDown, LayoutGrid, Globe } from "lucide-react";
import { CardData } from "../lib/tmdb";
import {
  getRarityColors,
  formatListeners,
  getGroupedCollection,
  getSortedCards,
  getFilteredCollection,
  SortOption,
  TypeFilter,
  POKEMON_TYPE_COLORS,
} from "../lib/cardUtils";
import { ScrollableTitle } from "./ScrollableTitle";
import { useState } from "react";

const Dropdown = ({ 
  label, 
  value, 
  onChange, 
  options, 
  className = "" 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string; icon?: React.ReactNode }[];
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className={`flex-1 flex flex-col p-4 justify-center relative ${className}`}>
      <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1">{label}</span>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl px-4 py-2.5 hover:bg-white/10 transition-all text-left"
        >
          <div className="flex items-center gap-2">
            {selected.icon}
            <span className="truncate">{selected.label}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 z-[100] bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 backdrop-blur-3xl"
              >
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors hover:bg-white/5 ${value === opt.value ? "text-purple-400 bg-purple-500/5" : "text-white/70 hover:text-white"}`}
                  >
                    <div className="shrink-0">{opt.icon}</div>
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface CardGridProps {
  isOpen: boolean;
  isCollectionView: boolean;
  collection: CardData[];
  cards: CardData[];
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
  gridSize: "sm" | "md" | "lg";
  setGridSize: (v: "sm" | "md" | "lg") => void;
  typeFilter: TypeFilter;
  setTypeFilter: (v: TypeFilter) => void;
  newCardIds: Set<string>;
  onClose: () => void;
  onClearCollection: () => void;
}

export const CardGrid = ({
  isOpen,
  isCollectionView,
  collection,
  cards,
  sortBy,
  setSortBy,
  gridSize,
  setGridSize,
  typeFilter,
  setTypeFilter,
  newCardIds,
  onClose,
  onClearCollection,
}: CardGridProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col items-center p-6 sm:p-12 overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50 group flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold p-2 sm:p-3 rounded-full shadow-lg transition-all"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
          </button>

          <div className="w-full max-w-5xl flex flex-col items-center pb-24 mt-8 sm:mt-0">
            <h2 className="text-3xl font-bold mt-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 sm:mb-8">
              {isCollectionView ? "My Collection" : "Pack Review"}
            </h2>

            {isCollectionView && (
              <div className="w-full space-y-4 mb-8 max-w-5xl">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left Cluster: Stats, Sort, Filter */}
                  <div className="flex-[2] flex flex-col md:flex-row bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl z-[60]">
                    <div className="flex flex-row md:flex-col items-center md:items-start px-6 py-4 border-b md:border-b-0 md:border-r border-white/10 shrink-0 gap-4 md:gap-0 bg-white/5 md:rounded-l-2xl rounded-t-2xl md:rounded-tr-none">
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] md:mb-1">Total Cards</span>
                      <span className="text-3xl font-black text-white leading-none">{collection.length}</span>
                    </div>
                    
                    {/* Custom Sort Dropdown */}
                    <Dropdown
                      label="Sort By"
                      value={sortBy}
                      onChange={(v) => setSortBy(v as SortOption)}
                      options={[
                        { value: "rarity_high", label: "Highest Rarity" },
                        { value: "rarity_low", label: "Lowest Rarity" },
                        { value: "rating_high", label: "Highest Rating" },
                        { value: "rating_low", label: "Lowest Rating" },
                        { value: "name_asc", label: "Name (A-Z)" },
                        { value: "name_desc", label: "Name (Z-A)" },
                        { value: "year_new", label: "Newest Release" },
                        { value: "year_old", label: "Oldest Release" },
                      ]}
                      className="border-b md:border-b-0 md:border-r border-white/10"
                    />

                    {/* Custom Type Filter Dropdown */}
                    <Dropdown
                      label="Type"
                      value={typeFilter}
                      onChange={(v) => setTypeFilter(v as TypeFilter)}
                      options={[
                        { value: "all", label: "All Types", icon: <LayoutGrid className="w-4 h-4" /> },
                        { value: "movie", label: "Movies", icon: <Film className="w-4 h-4" /> },
                        { value: "tv", label: "TV Shows", icon: <Tv className="w-4 h-4" /> },
                        { value: "game", label: "Games", icon: <Gamepad2 className="w-4 h-4" /> },
                        { value: "music", label: "Music", icon: <Headphones className="w-4 h-4" /> },
                        { value: "anime", label: "Anime", icon: <Sparkles className="w-4 h-4 text-pink-400" /> },
                        { value: "pokemon", label: "Pokémon", icon: <Sparkles className="w-4 h-4 text-yellow-400" /> },
                        { value: "yugioh", label: "Yu-Gi-Oh!", icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
                        { value: "giphy", label: "GIFs", icon: <Image className="w-4 h-4 text-cyan-400" /> },
                        { value: "digimon", label: "Digimon", icon: <Sparkles className="w-4 h-4 text-orange-400" /> },
                      ]}
                    />
                  </div>

                  {/* Right Cluster: Grid & Actions */}
                  <div className="flex-1 flex flex-row bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl z-50">
                    <div className="flex-1 flex flex-col p-4 items-center justify-center border-r border-white/10 min-w-[100px]">
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Grid</span>
                      <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
                        {["sm", "md", "lg"].map((s) => (
                          <button 
                            key={s}
                            onClick={() => setGridSize(s as any)} 
                            className={`w-8 h-8 flex items-center justify-center text-xs font-black rounded-lg transition-all ${gridSize === s ? "bg-white/20 text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"}`}
                          >
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col p-4 items-center justify-center min-w-[100px]">
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-center w-full">Actions</span>
                      <button
                        onClick={onClearCollection}
                        disabled={collection.length === 0}
                        className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-20 disabled:grayscale border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-widest py-2 px-3 rounded-xl shadow-lg transition-all w-full"
                      >
                        <X className="w-3.5 h-3.5" /> Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isCollectionView && <div className="mb-8"></div>}

            {/* Empty State */}
            {isCollectionView && collection.length === 0 && (
              <div className="text-center text-white/50 mt-12 flex flex-col items-center">
                <div className="w-24 h-32 border-2 border-dashed border-white/20 rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-4xl text-white/20">?</span>
                </div>
                <p>Your collection is empty.</p>
                <p className="text-sm">Open some packs to find cards!</p>
              </div>
            )}

            {/* Grid */}
            <div className={`grid gap-3 sm:gap-6 justify-items-center w-full max-w-7xl mx-auto ${
              gridSize === "sm" ? "grid-cols-2 min-[640px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" :
              gridSize === "md" ? "grid-cols-1 min-[580px]:grid-cols-2 min-[850px]:grid-cols-3" :
              "grid-cols-1 min-[768px]:grid-cols-2"
            }`}>
              {(isCollectionView
                ? getGroupedCollection(getSortedCards(getFilteredCollection(collection, typeFilter), sortBy))
                : getSortedCards(cards, sortBy).map(c => ({ card: c, count: 1 }))
              ).map((item, idx) => {
                const { card, count } = item;
                const isTcg = card.type === "yugioh" || card.type === "mtg" || card.type === "lorcana" || card.type === "pokemontcg";
                const baseWidth = 368;
                const baseHeight = card.type === "country" ? 260 : isTcg ? 536 : 461;
                
                const dims = gridSize === "sm"
                  ? { container: "w-full max-w-[184px]", height: Math.round(184 * baseHeight / baseWidth), content: `w-[368px] h-[${baseHeight}px]`, scale: 184 / baseWidth }
                  : gridSize === "md"
                    ? { container: "w-full max-w-[276px]", height: Math.round(276 * baseHeight / baseWidth), content: `w-[368px] h-[${baseHeight}px]`, scale: 276 / baseWidth }
                    : { container: "w-full max-w-[368px]", height: baseHeight, content: `w-[368px] h-[${baseHeight}px]`, scale: 1 };
                const colors = getRarityColors(card.rarity);

                return (
                  <motion.div
                    key={`grid-${card.id}-${idx}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (idx % 10) * 0.05 }}
                    className={`relative ${dims.container} cursor-pointer group transition-transform hover:scale-105`}
                    style={{ height: dims.height }}
                    onClick={() => {
                      if (card.imdb_link) window.open(card.imdb_link, "_blank");
                      else if (card.trailer) window.open(card.trailer, "_blank");
                    }}
                  >
                    {isCollectionView && count > 1 && (
                      <div className="absolute -top-2 -right-2 z-30 bg-purple-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-lg border border-white/20">
                        x{count}
                      </div>
                    )}
                    <div
                      className={`${dims.content} origin-top-left`}
                      style={{ transform: dims.scale !== 1 ? `scale(${dims.scale})` : "none" }}
                    >
                      <div className={`w-full h-full bg-gradient-to-br ${colors.bg} rounded-xl p-0.5 sm:p-1 shadow-2xl relative`}>
                        <div className={`w-full h-full border sm:border-2 ${colors.border} ${colors.animate} rounded-lg flex flex-col bg-black/20 backdrop-blur-sm relative overflow-hidden group`}>
                          {card.poster && (
                            <img
                              referrerPolicy="no-referrer"
                              src={card.poster}
                              alt={card.name}
                              className={`absolute inset-0 w-full h-full opacity-90 group-hover:opacity-100 mix-blend-normal transition-opacity duration-300 ${card.type === 'dragonball' ? 'object-cover object-[50%_10%]' : 'object-cover'}`}
                            />
                          )}

                          {card.type !== 'yugioh' && card.type !== 'lorcana' && card.type !== 'pokemontcg' && (
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/20 to-transparent" />
                          )}
                          <div className="relative z-10 flex justify-between items-start w-full p-2 sm:p-3">
                            <div className="flex flex-col gap-1 items-start">
                              {card.type !== "yugioh" && card.type !== "lorcana" && card.type !== "pokemontcg" && (
                                <div className={`${colors.tagBg} backdrop-blur-md rounded px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-1 sm:gap-1.5 shadow-lg border border-white/10`}>
                                  <Sparkles className={`w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ${colors.icon}`} />
                                  <span className={`text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-wider ${colors.tagText}`}>{card.rarity}</span>
                                </div>
                              )}
                              {(card.type === "game" || card.type === "music" || card.type === "giphy" || card.type === "pokemon") && card.platforms && card.platforms.length > 0 && (
                                <div className="flex flex-col gap-1 items-start pl-0.5">
                                  {card.platforms.map((p, pi) => {
                                    const typeKey = p.toLowerCase();
                                    const typeClass = card.type === "pokemon" ? (POKEMON_TYPE_COLORS?.[typeKey] || "bg-slate-700 border-slate-500 text-white") : (card.type === "music" ? "bg-green-900/50 border-green-400/30 text-green-50" : card.type === "giphy" ? "bg-cyan-900/50 border-cyan-400/30 text-cyan-50" : card.type === "ghibli" ? "bg-sky-900/50 border-green-400/30 text-green-50" : card.type === "dragonball" ? "bg-orange-900/50 border-orange-400/30 text-orange-50 shadow-[0_0_8px_rgba(249,115,22,0.3)]" : "bg-blue-900/50 border-cyan-400/30 text-cyan-50");
                                    return (
                                      <div key={pi} className={`${typeClass} backdrop-blur-md border text-[7px] sm:text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded shadow-sm`}>
                                        {p}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                            {card.type !== "yugioh" && card.type !== "lorcana" && card.type !== "pokemontcg" && (
                              <div className="bg-black/50 backdrop-blur rounded px-1.5 py-0.5 flex items-center gap-1 border border-white/10">
                                {card.type === "movie" ? <Film className="w-2.5 h-2.5 text-slate-400" /> : card.type === "game" ? <Gamepad2 className="w-2.5 h-2.5 text-slate-400" /> : card.type === "music" ? <Headphones className="w-2.5 h-2.5 text-slate-400" /> : card.type === "anime" ? <Sparkles className="w-2.5 h-2.5 text-orange-400" /> : card.type === "pokemon" ? <Sparkles className="w-2.5 h-2.5 text-yellow-400" /> : card.type === "boardgame" ? <Sparkles className="w-2.5 h-2.5 text-amber-400" /> : card.type === "giphy" ? <Image className="w-2.5 h-2.5 text-cyan-400" /> : card.type === "digimon" ? <Sparkles className="w-2.5 h-2.5 text-orange-400" /> : card.type === "country" ? <Globe className="w-2.5 h-2.5 text-emerald-400" /> : card.type === "ghibli" ? <Sparkles className="w-2.5 h-2.5 text-sky-400" /> : card.type === "dragonball" ? <Sparkles className="w-2.5 h-2.5 text-red-400" /> : <Tv className="w-2.5 h-2.5 text-slate-400" />}
                                <span className="text-[8px] font-black uppercase text-slate-400">{card.type}</span>
                              </div>
                            )}
                              {card.type === "boardgame" && card.rank && card.rank > 0 && (
                                <div className="bg-amber-950/40 backdrop-blur border border-amber-500/20 rounded px-1.5 py-0.5 mt-0.5 flex items-center gap-1 self-end">
                                  <span className="text-[7px] font-black text-amber-300 tracking-wider">RANK #{card.rank}</span>
                                </div>
                              )}
                              {!isCollectionView && newCardIds.has(card.id) && (
                                <div className="bg-red-600 text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">New!</div>
                              )}
                            </div>
                            {card.type !== 'yugioh' && card.type !== 'digimon' && card.type !== 'lorcana' && card.type !== 'pokemontcg' && card.type !== 'ghibli' && card.type !== 'dragonball' && (
                              <div className="bg-black/50 backdrop-blur rounded px-1.5 py-0.5 sm:px-2 sm:py-1">
                                <span className="text-yellow-400 font-bold text-[10px] sm:text-xs lg:text-sm">⭐ {(card.rating ?? 0).toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          <div className="relative z-10 mt-auto p-2 sm:p-4 w-full flex flex-col items-center bg-gradient-to-t from-black/30 via-black/10 to-transparent">
                            {card.type !== "yugioh" && card.type !== "mtg" && card.type !== "lorcana" && card.type !== "pokemontcg" && (
                              <>
                                <ScrollableTitle title={card.name} baseClass="text-xs sm:text-sm lg:text-lg font-black text-white uppercase tracking-tight drop-shadow-md leading-tight" />
                                {(card.type === "music" || card.type === "digimon" || (card.type !== "pokemon" && card.type !== "giphy" && card.description)) && card.description && (
                                  <div className="text-[10px] sm:text-xs font-bold text-white/70 drop-shadow-md text-center max-w-[90%] truncate mt-0.5 sm:mt-1">{card.description}</div>
                                )}
                                {card.year && card.type !== "pokemon" && card.type !== "giphy" && <span className="text-[10px] sm:text-xs text-white/70 font-bold mb-1">{card.year}</span>}
                              </>
                            )}
                            <div className="flex gap-1.5 sm:gap-2 w-full justify-center mt-1 sm:mt-2">
                              {card.trailer && (
                                <a
                                  href={card.trailer}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`${card.type === "music" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white text-[8px] sm:text-[10px] lg:text-xs font-bold py-1 px-1.5 sm:px-2 flex items-center gap-1 rounded shadow`}
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
                              {card.imdb_link && (
                                <a
                                  href={card.imdb_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-[#f5c518] hover:bg-[#d6ab15] text-black text-[8px] sm:text-[10px] lg:text-xs font-bold py-1 px-1.5 sm:px-2 rounded shadow"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {card.type === "game" ? "RAWG" : card.type === "music" ? "Apple" : card.type === "giphy" ? "Giphy" : card.type === "anime" ? "MAL" : card.type === "pokemon" ? "Dex" : card.type === "boardgame" ? "BGG" : card.type === "digimon" ? "Wiki" : "Info"}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 mix-blend-overlay rounded-xl pointer-events-none"></div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
