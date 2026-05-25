"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCcw, ChevronRight, LayoutGrid, X, Volume2, Home as HomeIcon } from "lucide-react";
import { useTwitchChat, TwitchConfig } from "../lib/useTwitchChat";
import { useGameAudio, SoundType } from "../lib/useGameAudio";
import { CardData, fetchRandomPack } from "../lib/tmdb";
import { fetchRandomGamePack } from "../lib/games";
import { fetchRandomMusicPack } from "../lib/music";
import { fetchRandomAnimePack } from "../lib/anime";
import { fetchRandomPokemonPack } from "../lib/pokemon";
import { fetchRandomBoardGamePack } from "../lib/boardgames";
import { fetchRandomGiphyPack } from "../lib/giphy";
import { fetchRandomYugiohPack } from "../lib/yugioh";
import { fetchRandomMtgPack } from "../lib/mtg";
import { fetchRandomDisneyPack } from "../lib/disney";
import { fetchRandomDigimonPack } from "../lib/digimon";
import { fetchRandomLorcanaPack } from "../lib/lorcana";
import { fetchRandomCountriesPack } from "../lib/countries";
import { fetchRandomPokemonTcgPack } from "../lib/pokemontcg";
import { fetchRandomGhibliPack } from "../lib/ghibli";
import { fetchRandomDragonBallPack } from "../lib/dragonball";
import { fetchRandomEroPack } from "../lib/ero";
import { sanitizeCards, Rarity } from "../lib/cardUtils";

import { PackSelector, PackType } from "../components/PackSelector";
import { PackVisual } from "../components/PackVisual";
import { CardReveal } from "../components/CardReveal";
import { CardGrid } from "../components/CardGrid";
import { useCardEffects } from "../components/CardEffects";
import { SoundModal } from "../components/modals/SoundModal";
import { TwitchModal } from "../components/modals/TwitchModal";
import { ClearModal } from "../components/modals/ClearModal";
import { SortOption, TypeFilter } from "../lib/cardUtils";

type PackState = "sealed" | "tearing" | "opened" | "revealing" | "done";

export default function Home() {
  // ── Pack state ────────────────────────────────────────────────────────────
  const [packState, setPackState] = useState<PackState>("sealed");
  const [packType, setPackType] = useState<PackType | null>(null);
  const [tearProgress, setTearProgress] = useState(0);
  const [isTearing, setIsTearing] = useState(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [junkEffectCardIdx, setJunkEffectCardIdx] = useState<number | null>(null);
  const [showTrailerIdx, setShowTrailerIdx] = useState<number | null>(null);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());

  // ── Collection state ──────────────────────────────────────────────────────
  const [collection, setCollection] = useState<CardData[]>([]);
  const [collectionCount, setCollectionCount] = useState(0);
  const [isGridView, setIsGridView] = useState(false);
  const [isCollectionView, setIsCollectionView] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("rarity_high");
  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">("md");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [showClearModal, setShowClearModal] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [packSize, setPackSize] = useState(5);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [showTwitchModal, setShowTwitchModal] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<SoundType | null>(null);

  // ── Audio ─────────────────────────────────────────────────────────────────
  const { isMuted, setIsMuted, playSound, customSounds, setCustomSound, resetSound, previewSound } = useGameAudio();
  const currentPreviewAudio = useRef<HTMLAudioElement | null>(null);

  // ── Twitch ────────────────────────────────────────────────────────────────
  const { status: twitchStatus, config: twitchConfig, connect: twitchConnect, disconnect: twitchDisconnect, sendMessage: twitchSend } = useTwitchChat();
  const [twitchForm, setTwitchForm] = useState<TwitchConfig>({ channel: "", username: "", token: "" });

  // ── Refs ──────────────────────────────────────────────────────────────────
  const isOpenedRef = useRef(false);
  const playedRevealSounds = useRef<Set<number>>(new Set());
  const controls = useAnimation();

  // ── Sync Twitch form when modal opens ────────────────────────────────────
  useEffect(() => {
    if (showTwitchModal) setTwitchForm(twitchConfig);
  }, [showTwitchModal, twitchConfig]);

  // ── URL params for auto mode ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto") === "true") setIsAutoMode(true);
    const countParam = params.get("count");
    if (countParam) {
      const n = parseInt(countParam, 10);
      if (!isNaN(n)) setPackSize(Math.max(1, Math.min(100, n)));
    }
    const pType = params.get("pack");
    const validTypes: PackType[] = ["movies", "games", "music", "anime", "pokemon", "giphy", "yugioh", "mtg", "boardgame", "disney", "digimon", "lorcana", "countries", "pokemontcg", "ghibli", "dragonball"];
    if (pType === "random") {
      const chosen = validTypes[Math.floor(Math.random() * validTypes.length)];
      setPackType(chosen);
    } else if (pType === "ero") {
      setPackType("ero");
    } else if (pType && (validTypes.includes(pType as PackType) || pType === "musics")) {
      setPackType((pType === "musics" ? "music" : pType) as PackType);
    }
  }, []);

  // ── Load collection count lazily ──────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gacha_collection");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCollectionCount(parsed.length);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Card effects hook ─────────────────────────────────────────────────────
  const activeCard = cards[activeCardIndex] ?? null;
  const { reset: resetEffects } = useCardEffects({
    card: activeCard,
    cardIndex: activeCardIndex,
    isFlipped: !!flippedCards[activeCardIndex],
    isActive: packState === "revealing",
    isMuted,
    twitchStatus,
    twitchSend,
    onPlaySound: (rarity) => {
      if (!playedRevealSounds.current.has(activeCardIndex)) {
        playedRevealSounds.current.add(activeCardIndex);
        playSound(rarity as SoundType);
      }
    },
    onJunkEffect: (idx) => setJunkEffectCardIdx(idx),
    onMusicPreview: (url) => {
      fadeOutPreviewAudio();
      currentPreviewAudio.current = new Audio(url);
      currentPreviewAudio.current.volume = 0.5;
      currentPreviewAudio.current.play().catch(() => {});
    },
    onPokemonCry: (url) => {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fadeOutPreviewAudio = useCallback(() => {
    if (!currentPreviewAudio.current) return;
    const audio = currentPreviewAudio.current;
    currentPreviewAudio.current = null;
    let step = 0;
    const fade = setInterval(() => {
      step++;
      if (step >= 10 || audio.volume <= 0) {
        clearInterval(fade);
        audio.pause();
        audio.volume = 0;
      } else {
        try { audio.volume = Math.max(0, audio.volume - 0.05); } catch { /* ignore */ }
      }
    }, 100);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCustomSound(uploadTarget, ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [uploadTarget, setCustomSound]);

  // ── Trailer auto-show ─────────────────────────────────────────────────────
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isAutoMode && packState === "revealing" && flippedCards[activeCardIndex]) {
      timeout = setTimeout(() => setShowTrailerIdx(activeCardIndex), 3000);
    } else {
      setShowTrailerIdx(null);
    }
    return () => clearTimeout(timeout);
  }, [packState, flippedCards, activeCardIndex, isAutoMode]);

  // ── Pack open ────────────────────────────────────────────────────────────
  const handleOpen = useCallback(async () => {
    if (isOpenedRef.current) return;
    isOpenedRef.current = true;
    setIsLoading(true);

    const fetchedCards = packType === "games"
      ? await fetchRandomGamePack(packSize)
      : packType === "music"
        ? await fetchRandomMusicPack(packSize)
        : packType === "anime"
          ? await fetchRandomAnimePack(packSize)
          : packType === "pokemon"
            ? await fetchRandomPokemonPack(packSize)
            : packType === "boardgame"
              ? await fetchRandomBoardGamePack(packSize)
              : packType === "giphy"
                ? await fetchRandomGiphyPack(packSize)
                    : packType === "yugioh"
                      ? await fetchRandomYugiohPack(packSize)
                      : packType === "mtg"
                        ? await fetchRandomMtgPack(packSize)
                        : packType === "disney"
                          ? await fetchRandomDisneyPack(packSize)
                          : packType === "digimon"
                            ? await fetchRandomDigimonPack(packSize)
                            : packType === "lorcana"
                              ? await fetchRandomLorcanaPack(packSize)
                              : packType === "countries"
                                ? await fetchRandomCountriesPack(packSize)
                                : packType === "pokemontcg"
                                  ? await fetchRandomPokemonTcgPack(packSize)
                                  : packType === "ghibli"
                                    ? await fetchRandomGhibliPack(packSize)
                                      : packType === "dragonball"
                                        ? await fetchRandomDragonBallPack(packSize)
                                        : packType === "ero"
                                          ? await fetchRandomEroPack(packSize)
                                          : await fetchRandomPack(packSize);

    // Determine new cards
    let existingIdsArr: string[] = [];
    try {
      const saved = localStorage.getItem("gacha_collection");
      if (saved) existingIdsArr = (JSON.parse(saved) as CardData[]).map(c => c.id);
    } catch { /* ignore */ }
    const existingIds = new Set(existingIdsArr);
    const newlyFoundIds = new Set<string>();
    fetchedCards.forEach((c: CardData) => { if (!existingIds.has(c.id)) newlyFoundIds.add(c.id); });
    setNewCardIds(newlyFoundIds);

    setCards(fetchedCards);
    setIsLoading(false);

    // Persist to localStorage
    const saved = localStorage.getItem("gacha_collection");
    let existing: CardData[] = [];
    try { if (saved) existing = sanitizeCards(JSON.parse(saved)); } catch { /* ignore */ }
    const newCollection = [...existing, ...fetchedCards];
    localStorage.setItem("gacha_collection", JSON.stringify(newCollection));
    setCollectionCount(newCollection.length);

    setPackState("opened");
    setTearProgress(100);
    controls.start({ y: -150, x: 100, opacity: 0, rotate: 25, transition: { duration: 0.6, ease: "easeOut" } });
    setTimeout(() => setPackState("revealing"), 800);
  }, [controls, packSize, packType]);

  // ── Tear gesture ──────────────────────────────────────────────────────────
  const updateTear = (clientX: number, rect: DOMRect) => {
    if (isOpenedRef.current) return;
    const x = clientX - rect.left;
    const progress = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setTearProgress(prev => {
      const next = Math.max(prev, progress);
      if (next >= 85) { setTimeout(handleOpen, 0); return 100; }
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent, rect: DOMRect) => {
    if (packState !== "sealed" && packState !== "tearing") return;
    setIsTearing(true);
    setPackState("tearing");
    playSound("tear");
    updateTear(e.clientX, rect);
  };

  const handlePointerMove = (e: React.PointerEvent, rect: DOMRect) => {
    if (!isTearing) return;
    updateTear(e.clientX, rect);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isTearing) return;
    setIsTearing(false);
    if (tearProgress > 85) {
      handleOpen();
    } else {
      setTearProgress(0);
      setPackState("sealed");
    }
  };

  // ── Card interactions ─────────────────────────────────────────────────────
  const handleFlip = (idx: number) => setFlippedCards(prev => ({ ...prev, [idx]: true }));

  const handleNextCard = () => {
    fadeOutPreviewAudio();
    if (activeCardIndex < cards.length - 1) {
      setActiveCardIndex(prev => prev + 1);
    } else {
      setPackState("done");
    }
  };

  const handleSkipAll = () => {
    fadeOutPreviewAudio();
    const allFlipped: Record<number, boolean> = {};
    cards.forEach((_, idx) => { allFlipped[idx] = true; });
    setFlippedCards(allFlipped);
    setPackState("done");
    setActiveCardIndex(cards.length - 1);
  };

  // ── Auto mode ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAutoMode) return;
    if (packState === "sealed") {
      const t = setTimeout(handleOpen, 2500);
      return () => clearTimeout(t);
    }
    if (packState === "revealing") {
      if (!flippedCards[activeCardIndex]) {
        const t = setTimeout(() => handleFlip(activeCardIndex), 1000);
        return () => clearTimeout(t);
      }
      if (activeCardIndex === cards.length - 1) return; // last card stays
      const duration = cards[activeCardIndex]?.type === "music" ? 9000 : 6000;
      const fadeT = setTimeout(fadeOutPreviewAudio, duration - 1000);
      const t = setTimeout(handleNextCard, duration);
      return () => { clearTimeout(fadeT); clearTimeout(t); };
    }
  }, [isAutoMode, packState, activeCardIndex, flippedCards, cards]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  function resetPack() {
    isOpenedRef.current = false;
    setPackState("sealed");
    setTearProgress(0);
    setCards([]);
    setActiveCardIndex(0);
    setFlippedCards({});
    setIsGridView(false);
    setShowTrailerIdx(null);
    setNewCardIds(new Set());
    setJunkEffectCardIdx(null);
    playedRevealSounds.current.clear();
    resetEffects();
    fadeOutPreviewAudio();
    controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
  }

  // ── Collection management ─────────────────────────────────────────────────
  const openCollection = () => {
    try {
      const saved = localStorage.getItem("gacha_collection");
      setCollection(saved ? sanitizeCards(JSON.parse(saved)) : []);
    } catch { setCollection([]); }
    setIsCollectionView(true);
  };

  const confirmClearCollection = () => {
    localStorage.removeItem("gacha_collection");
    setCollection([]);
    setCollectionCount(0);
    setShowClearModal(false);
  };

  // ── Pack selector ─────────────────────────────────────────────────────────
  if (packType === null) {
    return (
      <PackSelector onSelect={(t) => {
        let finalType = t;
        if (t === "random") {
          const validTypes: PackType[] = ["movies", "games", "music", "anime", "pokemon", "giphy", "yugioh", "mtg", "boardgame", "disney", "digimon"];
          finalType = validTypes[Math.floor(Math.random() * validTypes.length)];
        }
        setPackType(finalType);
        const url = new URL(window.location.href);
        url.searchParams.set("pack", t === "music" ? "musics" : t);
        window.history.pushState({}, '', url);
      }} />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(120,0,255,0.1),_rgba(0,0,0,1))] pointer-events-none" />

      <main className="relative z-10 w-full max-w-md mx-auto p-6 h-[100dvh] flex flex-col items-center justify-center">

        {/* Branding (Hidden when pack is selected) */}
        {!packType && (
          <div className="absolute top-6 left-6 z-50 pointer-events-none">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(168,85,247,0.3)] whitespace-nowrap">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase">Pack</span> Opener
            </h1>
          </div>
        )}

        {/* ── Top Right: Control Bar ── */}
        <div className="absolute top-0 left-0 right-0 py-6 px-4 sm:px-8 z-50 pointer-events-none flex justify-end">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-1.5 rounded-[2rem] shadow-2xl pointer-events-auto">
            {/* Home / Back Action */}
            <button
              onClick={() => {
                resetPack();
                setPackType(null);
                const url = new URL(window.location.href);
                url.searchParams.delete("pack");
                window.history.pushState({}, '', url);
              }}
              title="Back to Home"
              className="bg-white/5 hover:bg-white/15 text-white/80 hover:text-white p-2 sm:p-2.5 rounded-2xl transition-all border border-white/5 hover:border-white/20 shadow-inner group"
            >
              <HomeIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

            {isAutoMode && (
              <div className="hidden min-[450px]:flex bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-xl text-[10px] font-black text-red-400 tracking-widest animate-pulse uppercase">
                Auto
              </div>
            )}

            <div className="flex items-center gap-1">
              <button
                id="sound-settings-btn"
                onClick={() => setShowSoundModal(true)}
                className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white p-2 rounded-xl transition-all"
                title="Sounds"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                id="twitch-settings-btn"
                onClick={() => setShowTwitchModal(true)}
                className={`relative bg-white/5 hover:bg-white/10 text-white/80 hover:text-white p-2 rounded-xl transition-all border ${
                  twitchStatus === "connected" ? "border-purple-500/50 bg-purple-500/10" :
                  twitchStatus === "connecting" ? "border-yellow-500/50 animate-pulse" :
                  "border-transparent"
                }`}
                title="Twitch"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                </svg>
                <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-2 ring-neutral-900 ${
                  twitchStatus === "connected" ? "bg-purple-400 shadow-[0_0_8px_#a855f7]" :
                  twitchStatus === "connecting" ? "bg-yellow-400" :
                  twitchStatus === "error" ? "bg-red-500" :
                  "bg-white/20"
                }`} />
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white p-2 rounded-xl transition-all"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1"></div>

            <button
              onClick={openCollection}
              className="group flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 text-white font-black py-2 px-3.5 sm:px-5 rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-95"
            >
              <LayoutGrid className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col items-start leading-[0.8] sm:leading-none">
                <span className="text-[9px] sm:text-[11px] tracking-widest uppercase opacity-90">Collection</span>
                <span className="text-[10px] sm:hidden font-light opacity-60 mt-1">{collectionCount}</span>
              </div>
              <span className="hidden sm:inline bg-black/30 px-2 py-0.5 rounded-lg text-[10px] font-black border border-white/5">{collectionCount}</span>
            </button>
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 w-full relative flex items-center justify-center select-none pt-16">

          {/* Cards */}
          <AnimatePresence>
            {(packState === "revealing" || packState === "done") && cards.map((card, idx) => {
              if (packState === "revealing" && idx !== activeCardIndex) return null;
              if (isAutoMode && packState === "done") return null;
              const isFlipped = flippedCards[idx] || packState === "done";
              const zIndex = packState === "done" ? cards.length - idx : 20;

              return (
                <CardReveal
                  key={card.id}
                  card={card}
                  idx={idx}
                  packType={packType}
                  packState={packState}
                  isFlipped={isFlipped}
                  isAutoMode={isAutoMode}
                  showTrailerIdx={showTrailerIdx}
                  isNew={newCardIds.has(card.id)}
                  junkEffectCardIdx={junkEffectCardIdx}
                  zIndex={zIndex}
                  onClick={() => {
                    if (isAutoMode) return;
                    if (packState === "revealing") {
                      if (!isFlipped) handleFlip(idx);
                      else if (idx === activeCardIndex) handleNextCard();
                    }
                  }}
                  onJunkDone={() => setJunkEffectCardIdx(null)}
                />
              );
            })}
          </AnimatePresence>

          {/* Pack visual */}
          {packState !== "done" && packState !== "revealing" && (
            <PackVisual
              packType={packType}
              tearProgress={tearProgress}
              isLoading={isLoading}
              isAutoMode={isAutoMode}
              controls={controls}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          )}
        </div>

        {/* ── Controls ── */}
        <div className="min-h-[120px] flex items-center justify-center w-full z-40 mt-8">
          <AnimatePresence mode="wait">
            {packState === "revealing" && flippedCards[activeCardIndex] && (
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  key="next-btn"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={handleNextCard}
                  className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all"
                >
                  {activeCardIndex < cards.length - 1 ? "Next Card" : "Finish"}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  whileHover={{ opacity: 1 }}
                  onClick={handleSkipAll}
                  className="text-white/40 hover:text-white/90 text-[10px] font-black uppercase tracking-[0.3em] transition-all h-8"
                >
                  Skip to End
                </motion.button>
              </div>
            )}

            {packState === "done" && (
              <motion.div
                key="done-controls"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <button
                  onClick={resetPack}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-3 rounded-full shadow-lg transition-all group"
                  title="Close Pack"
                >
                  <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={() => {
                      resetPack();
                      setPackType(null);
                      const url = new URL(window.location.href);
                      url.searchParams.delete("pack");
                      window.history.pushState({}, '', url);
                    }}
                    className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:text-white font-medium py-3 px-6 rounded-full shadow-lg transition-all"
                  >
                    <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    Change Pack
                  </button>
                  <button
                    onClick={() => setIsGridView(true)}
                    className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-all"
                  >
                    <LayoutGrid className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    View Details
                  </button>
                  <button
                    onClick={resetPack}
                    className="group flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-pink-500/25 transition-all transform hover:scale-105 active:scale-95"
                  >
                    <RefreshCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
                    Open Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── TMDB Attribution ── */}
      {packType === "movies" && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity z-40 pointer-events-auto">
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
            alt="TMDB Logo"
            className="h-3 sm:h-4 w-auto drop-shadow-md"
          />
          <span className="text-[8px] sm:text-[10px] text-white/70 max-w-[120px] sm:max-w-[150px] leading-tight font-medium text-right drop-shadow-md">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </span>
        </div>
      )}

      {/* ── Grid / Collection overlay ── */}
      <CardGrid
        isOpen={isGridView || isCollectionView}
        isCollectionView={isCollectionView}
        collection={collection}
        cards={cards}
        sortBy={sortBy}
        setSortBy={setSortBy}
        gridSize={gridSize}
        setGridSize={setGridSize}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        newCardIds={newCardIds}
        onClose={() => { setIsGridView(false); setIsCollectionView(false); }}
        onClearCollection={() => setShowClearModal(true)}
      />

      {/* ── Modals ── */}
      <SoundModal
        isOpen={showSoundModal}
        onClose={() => setShowSoundModal(false)}
        customSounds={customSounds}
        onPreview={previewSound}
        onReset={resetSound}
        onUpload={(type) => setUploadTarget(type)}
        onFileChange={handleFileUpload}
      />

      <TwitchModal
        isOpen={showTwitchModal}
        onClose={() => setShowTwitchModal(false)}
        status={twitchStatus}
        config={twitchConfig}
        form={twitchForm}
        setForm={setTwitchForm}
        onConnect={() => {
          if (!twitchForm.channel || !twitchForm.username || !twitchForm.token) return;
          twitchConnect(twitchForm);
        }}
        onDisconnect={twitchDisconnect}
      />

      <ClearModal
        isOpen={showClearModal}
        collectionCount={collection.length}
        onConfirm={confirmClearCollection}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
}
