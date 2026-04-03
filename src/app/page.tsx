"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCcw, ChevronRight, LayoutGrid, X, Film, Tv, Volume2, Gamepad2, Laptop, Smartphone, Monitor, Disc, Music, Headphones, Users } from "lucide-react";
import confetti from "canvas-confetti";
import { useTwitchChat, TwitchConfig } from "../lib/useTwitchChat";
import { useGameAudio, SoundType, SOUND_LABELS, SOUND_ACCENT, DEFAULT_SOUND_URLS } from "../lib/useGameAudio";

type PackState = "sealed" | "tearing" | "opened" | "revealing" | "done";
type Rarity = "Junk" | "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
type SortOption = "name_asc" | "name_desc" | "rarity_high" | "rarity_low" | "year_new" | "year_old" | "rating_high" | "rating_low";
type TypeFilter = "all" | "movie" | "tv" | "game" | "music";

import { CardData, fetchRandomPack } from "../lib/tmdb";
import { fetchRandomGamePack } from "../lib/games";
import { fetchRandomMusicPack } from "../lib/music";

import { ScrollableTitle } from "../components/ScrollableTitle";
import { JunkEffect } from "../components/JunkEffect";
import { SoundRow } from "../components/SoundRow";
import { PackSelector } from "../components/PackSelector";

export const formatListeners = (num?: number) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

export default function Home() {
  const [packState, setPackState] = useState<PackState>("sealed");
  const [packType, setPackType] = useState<"movies" | "games" | "music" | null>(null);
  const [tearProgress, setTearProgress] = useState(0);
  const [isTearing, setIsTearing] = useState(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [isGridView, setIsGridView] = useState(false);
  const [collection, setCollection] = useState<CardData[]>([]);
  const [isCollectionView, setIsCollectionView] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("rarity_high");
  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">("md");
  const [showTrailerIdx, setShowTrailerIdx] = useState<number | null>(null);
  const { isMuted, setIsMuted, playSound, customSounds, setCustomSound, resetSound, previewSound } = useGameAudio();
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<SoundType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [packSize, setPackSize] = useState(5);
  const [showClearModal, setShowClearModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [junkEffectCardIdx, setJunkEffectCardIdx] = useState<number | null>(null);
  const [collectionCount, setCollectionCount] = useState(0);

  // ── Twitch ────────────────────────────────────────────────────────────────
  const { status: twitchStatus, config: twitchConfig, connect: twitchConnect, disconnect: twitchDisconnect, sendMessage: twitchSend } = useTwitchChat();
  const [showTwitchModal, setShowTwitchModal] = useState(false);
  const [twitchForm, setTwitchForm] = useState<TwitchConfig>({ channel: "", username: "", token: "" });
  const twitchNotified = useRef<Set<number>>(new Set());
  const currentPreviewAudio = useRef<HTMLAudioElement | null>(null);

  // Populate form from persisted config when modal opens
  useEffect(() => {
    if (showTwitchModal) setTwitchForm(twitchConfig);
  }, [showTwitchModal, twitchConfig]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("auto") === "true") {
        setIsAutoMode(true);
      }
      const countParam = params.get("count");
      if (countParam) {
        const parsedCount = parseInt(countParam, 10);
        if (!isNaN(parsedCount)) {
          setPackSize(Math.max(1, Math.min(100, parsedCount)));
        }
      }
      const pType = params.get("pack");
      if (pType === "movies" || pType === "games" || pType === "musics") {
        setPackType((pType === "musics" ? "music" : pType) as "movies" | "games" | "music");
      }
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCustomSound(uploadTarget, dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [uploadTarget, setCustomSound]);

  const fadeOutPreviewAudio = useCallback(() => {
    if (!currentPreviewAudio.current) return;
    const audio = currentPreviewAudio.current;
    currentPreviewAudio.current = null;
    let fadeStep = 0;
    const fade = setInterval(() => {
      fadeStep++;
      if (fadeStep >= 10 || audio.volume <= 0) {
        clearInterval(fade);
        audio.pause();
        audio.volume = 0;
      } else {
        try {
          audio.volume = Math.max(0, audio.volume - 0.05);
        } catch { /* ignore edge case where audio is already disposed */ }
      }
    }, 100);
  }, []);

  // Effect to sync reveal sounds AND Twitch chat messages with flip state
  useEffect(() => {
    if (packState !== "revealing") return;

    if (flippedCards[activeCardIndex] && !playedRevealSounds.current.has(activeCardIndex)) {
      const card = cards[activeCardIndex];
      if (card) {
        playedRevealSounds.current.add(activeCardIndex);
        playSound(card.rarity);

        // Auto-play music preview
        if (card.type === "music" && card.trailer && !isMuted) {
          fadeOutPreviewAudio();
          currentPreviewAudio.current = new Audio(card.trailer);
          currentPreviewAudio.current.volume = 0.5;
          currentPreviewAudio.current.play().catch(() => {});
        }

        if (card.rarity === "Legendary") {
          // Double burst from both sides
          confetti({
            particleCount: 250,
            spread: 70,
            angle: 60,
            origin: { x: 0.2, y: 0.6 },
            colors: ["#FBBF24", "#F59E0B", "#D97706", "#FFFBEB"],
          });
          setTimeout(() => {
            confetti({
              particleCount: 250,
              spread: 70,
              angle: 120,
              origin: { x: 0.8, y: 0.6 },
              colors: ["#FBBF24", "#F59E0B", "#D97706", "#FFFBEB"],
            });
          }, 200);
        } else if (card.rarity === "Epic") {
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.6 },
            colors: ["#C084FC", "#E879F9", "#A855F7", "#F3E8FF"],
          });
        } else if (card.rarity === "Junk") {
          setJunkEffectCardIdx(activeCardIndex);
        }

        // ── Send to Twitch chat ──────────────────────────────────────
        if (twitchStatus === "connected" && !twitchNotified.current.has(activeCardIndex)) {
          twitchNotified.current.add(activeCardIndex);
          const rarityEmoji: Record<Rarity, string> = {
            Junk: "🗑️", Common: "⚪", Uncommon: "🟢", Rare: "🔵", Epic: "🟣", Legendary: "🌟",
          };
          const typeLabel = card.type === "movie" ? "🎬 Movie" : card.type === "game" ? "🎮 Game" : card.type === "music" ? "🎵 Music" : "📺 TV Series";
          const stars = "⭐".repeat(Math.round(card.rating / 2)); // scale 0-10 → 0-5 stars
          let extraInfo = "";
          if (card.type === "movie" || card.type === "tv") {
            if (card.year) extraInfo = ` (${card.year})`;
          } else if (card.type === "game") {
            const platforms = card.platforms?.slice(0, 3).join(", ");
            if (platforms) extraInfo = ` [${platforms}${card.platforms!.length > 3 ? "..." : ""}]`;
          } else if (card.type === "music") {
            const artist = card.description?.split(" • ")[0] || "";
            const artistPart = artist ? `by ${artist}` : "";
            const listens = card.listeners ? ` | 🎧 ${formatListeners(card.listeners)} listens` : "";
            extraInfo = ` ${artistPart}${listens}`;
          }

          const msg = `${typeLabel} | ${rarityEmoji[card.rarity]} [${card.rarity.toUpperCase()}] ${card.name}${extraInfo} | ⭐ ${card.rating.toFixed(1)}/10 ${stars}`;
          twitchSend(msg);
        }
      }
    }
  }, [flippedCards, activeCardIndex, packState, cards, playSound, twitchStatus, twitchSend]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isAutoMode && packState === "revealing" && flippedCards[activeCardIndex]) {
      timeout = setTimeout(() => {
        setShowTrailerIdx(activeCardIndex);
      }, 3000);
    } else {
      setShowTrailerIdx(null);
    }
    return () => clearTimeout(timeout);
  }, [packState, flippedCards, activeCardIndex, isAutoMode]);

  const sanitizeCards = (cards: CardData[]): CardData[] =>
    cards.map((card) => ({
      ...card,
      rating: card.rating ?? 0,
      name: card.name ?? "Unknown",
      rarity: card.rarity ?? "Common",
    }));

  // Load only the count from localStorage at startup — full data loads lazily on demand
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gacha_collection");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCollectionCount(parsed.length);
      }
    } catch (e) {
      console.error("Failed to read collection count", e);
    }
  }, []);

  const topPartRef = useRef<HTMLDivElement>(null);
  const isOpenedRef = useRef(false);
  const playedRevealSounds = useRef<Set<number>>(new Set());
  const controls = useAnimation();

  const handleOpen = useCallback(async () => {
    if (isOpenedRef.current) return;
    isOpenedRef.current = true;
    setIsLoading(true);
    const fetchedCards = packType === "games" 
      ? await fetchRandomGamePack(packSize) 
      : packType === "music" 
        ? await fetchRandomMusicPack(packSize) 
        : await fetchRandomPack(packSize);

    // Check which IDs are new — read directly from localStorage (collection state is lazy)
    let existingIdsArr: string[] = [];
    try {
      const saved = localStorage.getItem("gacha_collection");
      if (saved) existingIdsArr = (JSON.parse(saved) as CardData[]).map(c => c.id);
    } catch { /* ignore */ }
    const existingIds = new Set(existingIdsArr);
    const newlyFoundIds = new Set<string>();
    fetchedCards.forEach((c: CardData) => {
      if (!existingIds.has(c.id)) {
        newlyFoundIds.add(c.id);
      }
    });
    setNewCardIds(newlyFoundIds);

    setCards(fetchedCards);
    setIsLoading(false);

    // Save to localStorage and update count — don't load full array into state
    const saved = localStorage.getItem("gacha_collection");
    let existing: CardData[] = [];
    try {
      if (saved) existing = sanitizeCards(JSON.parse(saved));
    } catch { /* ignore */ }
    const newCollection = [...existing, ...fetchedCards];
    localStorage.setItem("gacha_collection", JSON.stringify(newCollection));
    setCollectionCount(newCollection.length);

    setPackState("opened");
    setTearProgress(100);

    controls.start({
      y: -150,
      x: 100,
      opacity: 0,
      rotate: 25,
      transition: { duration: 0.6, ease: "easeOut" },
    });

    setTimeout(() => {
      setPackState("revealing");
    }, 800);
  }, [controls, collection, packSize, packType]);

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
    playSound("tear");
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
      setTearProgress(0);
      setPackState("sealed");
    }
  };

  const handleFlip = (idx: number) => {
    setFlippedCards(prev => ({ ...prev, [idx]: true }));
  };

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
    cards.forEach((_, idx) => {
      allFlipped[idx] = true;
    });
    setFlippedCards(allFlipped);
    setPackState("done");
    setActiveCardIndex(cards.length - 1);
  };

  useEffect(() => {
    if (!isAutoMode) return;

    if (packState === "sealed") {
      const timer = setTimeout(() => {
        handleOpen();
      }, 2500);
      return () => clearTimeout(timer);
    }

    if (packState === "revealing") {
      const isFlipped = flippedCards[activeCardIndex];
      if (!isFlipped) {
        const timer = setTimeout(() => {
          handleFlip(activeCardIndex);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        if (activeCardIndex === cards.length - 1) {
          // Keep the last card visible indefinitely in auto mode
          return;
        }
        const duration = cards[activeCardIndex]?.type === "music" ? 10000 : 6000;
        const fadeTimer = setTimeout(() => {
          fadeOutPreviewAudio();
        }, duration - 1000);
        const timer = setTimeout(() => {
          handleNextCard();
        }, duration);
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(timer);
        };
      }
    }
  }, [isAutoMode, packState, activeCardIndex, flippedCards, handleOpen, handleFlip, handleNextCard, fadeOutPreviewAudio, cards]);

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
    playedRevealSounds.current.clear();
    twitchNotified.current.clear();
    fadeOutPreviewAudio();
    controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
  };

  const clearCollection = () => {
    setShowClearModal(true);
  };

  const confirmClearCollection = () => {
    localStorage.removeItem("gacha_collection");
    setCollection([]);
    setCollectionCount(0);
    setShowClearModal(false);
  };

  const topFoilContent = (
    <div className="w-full h-full flex flex-col pointer-events-none">
      <div className={`w-full h-4 ${packType === 'games' ? 'bg-gradient-to-b from-blue-400 to-blue-600' : packType === 'music' ? 'bg-gradient-to-b from-emerald-400 to-green-600' : 'bg-gradient-to-b from-slate-500 to-slate-600'} rounded-t-lg overflow-hidden flex shrink-0`}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`crimp-${i}`} className={`flex-1 border-r ${packType === 'games' ? 'border-blue-300/30' : packType === 'music' ? 'border-green-300/30' : 'border-slate-700/30'}`}></div>
        ))}
      </div>
      <div className={`w-full flex-1 ${packType === 'games' ? 'bg-gradient-to-b from-blue-700 via-indigo-900 to-blue-900 border-blue-400/30' : packType === 'music' ? 'bg-gradient-to-b from-green-600 via-emerald-800 to-green-950 border-green-400/30' : 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700/50'} relative overflow-hidden border-b shadow-inner`}>
        <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] ${packType === 'games' || packType === 'music' ? 'opacity-20 hue-rotate-180' : 'opacity-10'} mix-blend-overlay`}></div>
        {packType === 'games' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(56,189,248,0.4),_transparent)]"></div>}
        {packType === 'music' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(52,211,153,0.5),_transparent)]"></div>}
        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex items-center justify-center px-4">
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
              <div className="flex flex-col items-center">
                <RefreshCcw className="w-8 h-8 text-white animate-spin mb-2" />
                <span className="text-white font-medium text-sm animate-pulse">Fetching Media...</span>
              </div>
            </div>
          )}
          {(packState === "sealed" || packState === "tearing") && tearProgress < 10 && !isLoading && (
            <div className="bg-black/40 backdrop-blur text-white/90 text-xs py-1 px-3 rounded-full font-semibold animate-pulse shadow-lg border border-white/10">
              Swipe to Tear ✨
            </div>
          )}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] border-b-2 border-dashed ${packType === 'games' ? 'border-blue-400/40' : packType === 'music' ? 'border-green-400/40' : 'border-white/20'} truncate`}></div>
      </div>
    </div>
  );

  const getRarityColors = (rarity: Rarity) => {
    const colors: Record<Rarity, { bg: string; text: string; icon: string; border: string }> = {
      Junk: { bg: "from-[#4a5c2f] via-[#6b7c3a] to-[#3d4f25]", text: "text-lime-100", icon: "text-lime-300", border: "border-lime-900/50" },
      Common: { bg: "from-slate-300 via-gray-200 to-slate-400", text: "text-slate-800", icon: "text-slate-100", border: "border-slate-100/50" },
      Uncommon: { bg: "from-green-300 via-emerald-200 to-green-400", text: "text-green-900", icon: "text-green-100", border: "border-green-100/50" },
      Rare: { bg: "from-blue-300 via-cyan-200 to-blue-400", text: "text-blue-900", icon: "text-blue-100", border: "border-blue-100/50" },
      Epic: { bg: "from-purple-300 via-fuchsia-200 to-purple-400", text: "text-purple-900", icon: "text-purple-100", border: "border-purple-100/50" },
      Legendary: { bg: "from-yellow-300 via-amber-200 to-orange-400", text: "text-amber-900", icon: "text-yellow-100", border: "border-yellow-100/50" },
    };
    return colors[rarity] || colors.Common;
  };

  const rarityOrder: Record<Rarity, number> = {
    Junk: -1,
    Common: 0,
    Uncommon: 1,
    Rare: 2,
    Epic: 3,
    Legendary: 4,
  };

  const getGroupedCollection = (cardList: CardData[]) => {
    const groups: Map<string, { card: CardData; count: number }> = new Map();
    cardList.forEach(card => {
      if (groups.has(card.id)) {
        groups.get(card.id)!.count++;
      } else {
        groups.set(card.id, { card, count: 1 });
      }
    });
    return Array.from(groups.values());
  };

  const getSortedCards = (cardList: CardData[]) => {
    return [...cardList].sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "rarity_high":
          return rarityOrder[b.rarity] - rarityOrder[a.rarity] || a.name.localeCompare(b.name);
        case "rarity_low":
          return rarityOrder[a.rarity] - rarityOrder[b.rarity] || a.name.localeCompare(b.name);
        case "year_new":
          return (b.year || 0) - (a.year || 0) || a.name.localeCompare(b.name);
        case "year_old":
          return (a.year || 9999) - (b.year || 9999) || a.name.localeCompare(b.name);
        case "rating_high":
          return b.rating - a.rating || a.name.localeCompare(b.name);
        case "rating_low":
          return a.rating - b.rating || a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  const getFilteredCollection = (cardList: CardData[]) => {
    if (typeFilter === "all") return cardList;
    return cardList.filter(card => card.type === typeFilter);
  };

  if (packType === null) {
    return (
      <PackSelector onSelect={(t) => {
        setPackType(t);
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
        <div className="absolute top-6 w-full px-6 flex justify-between items-center z-50 pointer-events-none left-0 right-0 max-w-md">
          {/* Hidden file input for custom sound uploads */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 pointer-events-auto">
            Pack Opener
          </h1>
          <div className="flex items-center gap-2 pointer-events-auto">
            {isAutoMode && (
              <div className="bg-red-600/20 border border-red-500/50 px-2 py-1 rounded text-[10px] font-black text-red-400 tracking-tighter animate-pulse uppercase">
                Auto Mode
              </div>
            )}

            {/* Sound Settings button */}
            <button
              id="sound-settings-btn"
              onClick={() => setShowSoundModal(true)}
              title="Sound Settings"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-2 rounded-full shadow-lg transition-all group"
            >
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Twitch connect button */}
            <button
              id="twitch-settings-btn"
              onClick={() => setShowTwitchModal(true)}
              title={twitchStatus === "connected" ? `Connected to #${twitchConfig.channel}` : "Connect to Twitch"}
              className={`relative bg-white/10 hover:bg-white/20 backdrop-blur-md border text-white p-2 rounded-full shadow-lg transition-all group ${
                twitchStatus === "connected" ? "border-purple-500/70" :
                twitchStatus === "connecting" ? "border-yellow-500/70" :
                twitchStatus === "error" ? "border-red-500/70" :
                "border-white/20"
              }`}
            >
              {/* Twitch logo SVG */}
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              {/* Status dot */}
              <span className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full border border-neutral-900 ${
                twitchStatus === "connected" ? "bg-purple-400" :
                twitchStatus === "connecting" ? "bg-yellow-400 animate-pulse" :
                twitchStatus === "error" ? "bg-red-500" :
                "bg-white/20"
              }`} />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white p-2 rounded-full shadow-lg transition-all group"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              )}
            </button>
            <button
              onClick={() => {
                // Lazy-load collection from localStorage only when opened
                try {
                  const saved = localStorage.getItem("gacha_collection");
                  if (saved) setCollection(sanitizeCards(JSON.parse(saved)));
                  else setCollection([]);
                } catch { setCollection([]); }
                setIsCollectionView(true);
              }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold py-2 px-3 sm:px-4 rounded-full shadow-lg transition-all text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Collection</span>
              <span className="bg-pink-600/80 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">{collectionCount}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 w-full relative flex items-center justify-center select-none pt-16">

          {/* CARDS DISPLAY */}
          <AnimatePresence>
            {(packState === "revealing" || packState === "done") && cards.map((card, idx) => {
              if (packState === "revealing" && idx !== activeCardIndex) return null;
              if (isAutoMode && packState === "done") return null;

              const isFlipped = flippedCards[idx] || packState === "done";
              const zIndex = packState === "done" ? cards.length - idx : 20;

              let youtubeId = null;
              if (card.trailer) {
                const parts = card.trailer.split("v=");
                if (parts.length > 1) {
                  youtubeId = parts[1].split("&")[0];
                }
              }

              return (
                <motion.div
                  key={card.id}
                  initial={{ y: 50, scale: 0.8, opacity: 0 }}
                  animate={{
                    y: packState === "done" ? idx * 10 - 20 : 0,
                    x: packState === "done" ? (idx - 2) * 20 : 0,
                    scale: packState === "done" ? 0.9 : 1,
                    opacity: 1,
                    rotate: packState === "done" ? (idx - 2) * 5 : 0
                  }}
                  exit={{ y: -50, opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                  onClick={() => {
                    if (isAutoMode) return;
                    if (packState === "revealing") {
                      if (!isFlipped) {
                        handleFlip(idx);
                      } else if (idx === activeCardIndex) {
                        handleNextCard();
                      }
                    }
                  }}
                  className={`absolute ${isAutoMode ? "pointer-events-none" : "cursor-pointer"} perspective-1000 w-[368px] h-[461px]`}
                  style={{ zIndex }}
                >
                  <motion.div
                    className="w-full h-full relative preserve-3d"
                    initial={{ rotateY: 180 }}
                    animate={{ rotateY: isFlipped ? 0 : 180 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Card Back */}
                    <div
                      className="absolute inset-0 w-full h-full bg-slate-900 rounded-xl border-4 border-slate-500 shadow-[0_0_20px_rgba(100,116,139,0.5)] flex flex-col items-center justify-center backface-hidden overflow-hidden"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      {/* Film strip borders */}
                      <div className="absolute left-1 top-0 bottom-0 w-3 flex flex-col py-1 space-y-1.5 opacity-30">
                        {Array.from({ length: 24 }).map((_, i) => <div key={`l-${i}`} className="w-full h-2 bg-black rounded-sm"></div>)}
                      </div>
                      <div className="absolute right-1 top-0 bottom-0 w-3 flex flex-col py-1 space-y-1.5 opacity-30">
                        {Array.from({ length: 24 }).map((_, i) => <div key={`r-${i}`} className="w-full h-2 bg-black rounded-sm"></div>)}
                      </div>

                      <div className="w-24 h-24 rounded-full border-2 border-slate-500/30 flex items-center justify-center p-2 mb-4 relative drop-shadow-xl">
                        <div className="absolute inset-2 rounded-full border border-dashed border-slate-400/60 animate-[spin_20s_linear_infinite]"></div>
                        <div className="text-4xl filter grayscale brightness-150">{packType === "games" ? "🎮" : packType === "music" ? "🎧" : "🎬"}</div>
                      </div>

                      <div className="text-slate-300 font-black text-xl tracking-[0.2em] font-serif text-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                        {packType === "games" ? <>GAMING<br />COLLECTION</> : packType === "music" ? <>VINYL<br />COLLECTION</> : <>CINEMA<br />COLLECTION</>}
                      </div>

                      {packState === "revealing" && !isFlipped && (
                        <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-black tracking-[0.2em] text-slate-400/80 animate-pulse uppercase">
                          {isAutoMode ? "Auto-Revealing..." : "Tap to Flip"}
                        </div>
                      )}
                    </div>

                    {/* Card Front */}
                    <div
                      className={`absolute inset-0 w-full h-full bg-gradient-to-br ${getRarityColors(card.rarity).bg} rounded-xl p-1 shadow-2xl backface-hidden`}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className={`w-full h-full border-2 ${getRarityColors(card.rarity).border} rounded-lg flex flex-col bg-black/40 backdrop-blur-sm relative overflow-hidden`}>
                        {/* Background Poster Cover */}
                        {card.poster && (
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-overlay transition-opacity duration-1000"
                            style={{ backgroundImage: `url(${card.poster})`, opacity: showTrailerIdx === idx && youtubeId ? 0 : 0.8 }}
                          />
                        )}

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

                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/80 via-black/30 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />


                        {/* Top Area: Rarity & Rating */}
                        <div className="relative z-10 flex justify-between items-start w-full p-3">
                          {/* Left: Rarity */}
                          <div className="flex flex-col gap-1.5 items-start">
                             <div className="bg-black/50 backdrop-blur rounded px-2 py-1 flex items-center gap-1">
                               <Sparkles className={`w-4 h-4 ${getRarityColors(card.rarity).icon}`} />
                               <span className={`text-xs font-bold uppercase tracking-wider ${getRarityColors(card.rarity).text}`}>{card.rarity}</span>
                             </div>

                             {/* Vertical Game/Music Platforms */}
                             {(card.type === "game" || card.type === "music") && card.platforms && card.platforms.length > 0 && (
                               <div className="flex flex-col gap-1 items-start pl-1">
                                 {card.platforms.map((p, pi) => (
                                   <div key={pi} className={`${card.type === "music" ? "bg-green-900/50 border-green-400/40 text-green-100 shadow-[0_0_8px_rgba(74,222,128,0.2)]" : "bg-blue-900/50 border-cyan-400/40 text-cyan-100 shadow-[0_0_8px_rgba(34,211,238,0.2)]"} backdrop-blur-md border text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded`}>
                                     {p}
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                          {/* Right: Rating + type tag below */}
                          <div className="flex flex-col items-end gap-1">
                            <div className="bg-black/50 backdrop-blur rounded px-2 py-1">
                              <span className="text-yellow-400 font-bold text-sm">⭐ {(card.rating ?? 0).toFixed(1)}</span>
                            </div>
                            <div className="bg-black/50 backdrop-blur rounded px-2 py-1 flex items-center gap-1">
                              {card.type === "movie" ? <Film className="w-3 h-3 text-slate-300" /> : card.type === "game" ? <Gamepad2 className="w-3 h-3 text-slate-300" /> : card.type === "music" ? <Headphones className="w-3 h-3 text-slate-300" /> : <Tv className="w-3 h-3 text-slate-300" />}
                              <span className="text-[10px] font-bold uppercase text-slate-300">{card.type}</span>
                            </div>
                            {card.type === "music" && card.listeners !== undefined && (
                              <div className="bg-green-950/40 backdrop-blur border border-green-500/20 rounded px-2 py-0.5 mt-0.5 flex items-center gap-1 self-end">
                                <Users className="w-2.5 h-2.5 text-green-400" />
                                <span className="text-[9px] font-black text-green-300 tracking-wider">
                                  {formatListeners(card.listeners)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Bottom Area: Title & Links */}
                        <div className="relative z-10 mt-auto p-4 w-full flex flex-col items-center">
                          <ScrollableTitle title={card.name} baseClass="text-lg font-black text-white uppercase tracking-tight drop-shadow-md leading-tight" />
                          {card.type === "music" && card.description && (
                            <div className="text-xs sm:text-sm font-bold text-white/70 drop-shadow-md text-center max-w-[90%] truncate mt-1">
                              {card.description}
                            </div>
                          )}
                          <div className="flex gap-2 w-full justify-center mt-2">
                            {card.trailer && (
                              <a href={card.trailer} target="_blank" rel="noopener noreferrer" className={`${card.type === "music" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white text-xs font-bold py-1.5 px-3 rounded shadow-md transition-colors flex items-center gap-1`} onClick={(e) => {
                                if(card.type === "music") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const audio = new Audio(card.trailer);
                                  audio.volume = 0.5;
                                  audio.play().catch(() => {});
                                } else {
                                  e.stopPropagation();
                                }
                              }}>
                                {card.type === "music" ? <><Music className="w-3 h-3" /> Preview</> : "Trailer"}
                              </a>
                            )}
                            {card.imdb_link && (
                              <a href={card.imdb_link} target="_blank" rel="noopener noreferrer" className="bg-[#f5c518] hover:bg-[#d6ab15] text-black text-xs font-bold py-1.5 px-3 rounded shadow-md transition-colors" onClick={(e) => e.stopPropagation()}>
                                {card.type === "game" ? "RAWG" : card.type === "music" ? "Apple" : "IMDb"}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 mix-blend-overlay rounded-xl pointer-events-none"></div>

                      {/* NEW! Wax-seal stamp – positioned slightly inward */}
                      {newCardIds.has(card.id) && (
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: -15 }}
                          transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
                          className="absolute -top-2 -left-2 z-30 w-9 h-9 rounded-full bg-red-600 border-[2px] border-red-300/70 flex items-center justify-center p-1"
                          style={{ boxShadow: "0 0 0 1px rgba(255,80,80,0.25), 0 3px 10px rgba(180,0,0,0.6)" }}
                        >
                          <span className="text-white text-[8px] font-black uppercase tracking-tighter text-center leading-[0.85]">
                            NEW!
                          </span>
                        </motion.div>
                      )}

                    </div>

                    {/* Junk smoke + flies effect */}
                    {card.rarity === "Junk" && junkEffectCardIdx === idx && isFlipped && (
                      <JunkEffect onDone={() => setJunkEffectCardIdx(null)} />
                    )}

                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* THE PACK */}
          {packState !== "done" && packState !== "revealing" && (
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
                <div className={`h-3/4 w-full ${packType === 'games' ? 'bg-gradient-to-b from-blue-900 via-indigo-950 to-black' : 'bg-gradient-to-b from-slate-800 to-black'} relative rounded-b-lg overflow-hidden shadow-2xl border-t ${packType === 'games' ? 'border-blue-400/50' : 'border-slate-700'}`}>
                  <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] ${packType === 'games' ? 'opacity-20 hue-rotate-180' : 'opacity-10'} mix-blend-overlay`}></div>
                  {packType === 'games' && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_rgba(56,189,248,0.2),_transparent)]"></div>}

                  {/* Pack specific background edges */}
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
                    <>
                      {/* Audio frequency bars background */}
                      <div className="absolute inset-0 flex items-center justify-around opacity-20 px-4 pointer-events-none mix-blend-overlay">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={`bar-${i}`} className="w-2 bg-green-400 rounded-t-full shadow-[0_0_10px_rgba(74,222,128,0.8)]" style={{ height: `${20 + Math.random() * 60}%` }}></div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Film reel details */}
                      <div className="absolute left-4 top-0 bottom-0 w-4 flex flex-col py-4 space-y-3 opacity-20 mix-blend-overlay">
                        {Array.from({ length: 8 }).map((_, i) => <div key={`fl-${i}`} className="w-full h-8 bg-white rounded-sm"></div>)}
                      </div>
                      <div className="absolute right-4 top-0 bottom-0 w-4 flex flex-col py-4 space-y-3 opacity-20 mix-blend-overlay">
                        {Array.from({ length: 8 }).map((_, i) => <div key={`fr-${i}`} className="w-full h-8 bg-white rounded-sm"></div>)}
                      </div>
                    </>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    {packType === "games" ? (
                      <div className="w-28 h-32 bg-slate-300 rounded-t-xl rounded-b-sm shadow-2xl relative flex flex-col overflow-hidden rotate-[3deg] border-2 border-slate-400 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                        {/* Cartridge Ridges top */}
                        <div className="h-4 w-full flex justify-between px-3 pt-2 opacity-60">
                            {Array.from({ length: 5 }).map((_, i) => <div key={`ridge-${i}`} className="w-2.5 h-full bg-slate-500 rounded-sm"></div>)}
                        </div>
                        
                        {/* Label sticker - Vibrant Gaming Color */}
                        <div className="flex-1 m-2 mt-4 bg-gradient-to-br from-cyan-600 via-blue-500 to-emerald-500 rounded border border-white/40 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)]">
                            <div className="absolute top-0 left-0 right-0 h-4 bg-white/10 skew-y-[-10deg] -translate-y-2"></div>
                            <span className="text-[9px] font-black text-white tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] mt-1">RAWG</span>
                            <div className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] mb-2 mt-1">👾</div>
                            <div className="absolute bottom-1 right-1 text-[7px] text-white/80 font-mono font-bold">V-SYNC</div>
                        </div>

                        {/* Bottom Indent */}
                        <div className="h-2 border border-b-0 border-slate-500 w-1/2 mx-auto rounded-t-lg mb-0 bg-slate-100/50 shadow-inner"></div>
                      </div>
                    ) : packType === "music" ? (
                      <div className="w-32 h-32 bg-slate-900 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden animate-[spin_5s_linear_infinite] border-4 border-slate-800">
                        {/* Vinyl Grooves */}
                        <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none"></div>
                        <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none"></div>
                        <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none"></div>
                        <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none"></div>
                        {/* Center Label */}
                        <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-emerald-500 to-green-700 border border-slate-900 flex flex-col items-center justify-center shadow-inner">
                          <span className="text-[5px] font-black text-slate-900 mb-[1px]">HIT</span>
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"></div>
                          <span className="text-[3px] font-black text-slate-900 mt-[1px]">ALBUM</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-32 h-28 bg-slate-900 rounded-md shadow-2xl relative flex flex-col overflow-hidden rotate-[-4deg] border border-slate-700 drop-shadow-xl">
                        {/* Clapper stick */}
                        <div className="h-7 w-full relative overflow-hidden border-b-2 border-slate-800 z-10 shrink-0">
                          <div className="flex w-[150%] h-full -ml-6">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={`clap-${i}`} className={`w-8 h-full transform -skew-x-[35deg] ${i % 2 === 0 ? 'bg-slate-200' : 'bg-slate-950'}`}></div>
                            ))}
                          </div>
                        </div>

                        {/* Clapper body */}
                        <div className="flex-1 flex flex-col p-2 bg-slate-800 shadow-inner relative justify-center items-center">
                          <div className="absolute top-1 left-2 text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase opacity-70">Scene</div>
                          <div className="absolute top-1 right-2 text-[10px] text-slate-400 font-mono font-bold tracking-widest uppercase opacity-70">Take</div>

                          {/* Center Icon */}
                          <div className="text-4xl mt-3 drop-shadow-lg filter grayscale brightness-125">🎥</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-8 left-0 right-0 text-center font-black text-xl text-slate-200 uppercase tracking-[0.2em] shadow-black drop-shadow-lg">
                    {packType === "games" ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.5)]">
                        GAMING PACK
                      </span>
                    ) : packType === "music" ? (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                        VINYL PACK
                      </span>
                    ) : "Cinema Pack"}
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-4 ${packType === 'games' ? 'bg-gradient-to-t from-blue-700 to-blue-500' : packType === 'music' ? 'bg-gradient-to-t from-green-800 to-green-600' : 'bg-gradient-to-t from-slate-600 to-slate-500'} rounded-b-lg overflow-hidden flex`}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={`crimp-b-${i}`} className={`flex-1 border-r ${packType === 'games' ? 'border-blue-400/30' : packType === 'music' ? 'border-green-400/30' : 'border-slate-700/30'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* CONTROLS */}
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

      {/* GRID OVERLAY */}
      <AnimatePresence>
        {(isGridView || isCollectionView) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col items-center p-6 sm:p-12 overflow-y-auto"
          >
            <button
              onClick={() => {
                setIsGridView(false);
                setIsCollectionView(false);
              }}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50 group flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold p-2 sm:p-3 rounded-full shadow-lg transition-all"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div className="w-full max-w-5xl flex flex-col items-center pb-24 mt-8 sm:mt-0">
              <h2 className="text-3xl font-bold mt-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 sm:mb-8">
                {isCollectionView ? "My Collection" : "Pack Review"}
              </h2>

              {isCollectionView && (
                <div className="flex flex-col w-full max-w-2xl gap-4 mb-8">
                  {/* Row 1: Stats & Sorting */}
                  <div className="flex flex-col sm:flex-row items-center justify-between w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:px-6 gap-4 shadow-xl">
                    <div className="flex flex-col items-center sm:items-start w-full sm:w-auto shrink-0">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Total Cards</span>
                      <span className="text-2xl font-black text-white">{collection.length}</span>
                    </div>

                    <div className="h-px sm:h-12 w-full sm:w-px bg-white/10"></div>

                    <div className="flex flex-col items-center sm:items-start w-full sm:w-auto relative flex-1">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Sort By</span>
                      <div className="relative w-full">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="appearance-none w-full bg-black/40 border border-white/20 text-white font-medium text-sm rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all cursor-pointer hover:bg-black/60 shadow-inner"
                        >
                          <option value="rarity_high">Highest Rarity</option>
                          <option value="rarity_low">Lowest Rarity</option>
                          <option value="rating_high">Highest Rating</option>
                          <option value="rating_low">Lowest Rating</option>
                          <option value="name_asc">Name (A-Z)</option>
                          <option value="name_desc">Name (Z-A)</option>
                          <option value="year_new">Newest Release</option>
                          <option value="year_old">Oldest Release</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Filtering & Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:px-6 gap-4 shadow-xl">
                    <div className="flex flex-col items-center sm:items-start w-full sm:w-auto shrink-0">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Filter Type</span>
                      <div className="flex bg-black/40 border border-white/20 rounded-lg p-1 flex-wrap gap-1">
                        <button onClick={() => setTypeFilter("all")} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded ${typeFilter === "all" ? "bg-white/20 text-white" : "text-white/50 hover:text-white transition-colors"}`}>All</button>
                        <button onClick={() => setTypeFilter("movie")} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded flex items-center gap-1 ${typeFilter === "movie" ? "bg-white/20 text-white" : "text-white/50 hover:text-white transition-colors"}`}><Film className="w-3 h-3" /> Movies</button>
                        <button onClick={() => setTypeFilter("tv")} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded flex items-center gap-1 ${typeFilter === "tv" ? "bg-white/20 text-white" : "text-white/50 hover:text-white transition-colors"}`}><Tv className="w-3 h-3" /> TV</button>
                        <button onClick={() => setTypeFilter("game")} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded flex items-center gap-1 ${typeFilter === "game" ? "bg-white/20 text-white" : "text-white/50 hover:text-white transition-colors"}`}><Gamepad2 className="w-3 h-3" /> Games</button>
                        <button onClick={() => setTypeFilter("music")} className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded flex items-center gap-1 ${typeFilter === "music" ? "bg-white/20 text-white" : "text-white/50 hover:text-white transition-colors"}`}><Headphones className="w-3 h-3" /> Music</button>
                      </div>
                    </div>

                    <div className="h-px sm:h-12 w-full sm:w-px bg-white/10 shrink-0"></div>

                    <div className="flex flex-col items-center sm:items-start w-full sm:w-auto shrink-0">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Grid Size</span>
                      <div className="flex bg-black/40 border border-white/20 rounded-lg p-1">
                        <button onClick={() => setGridSize("sm")} className={`px-3 py-1 text-xs font-bold rounded ${gridSize === "sm" ? "bg-white/20 text-white" : "text-white/50 hover:text-white transition-colors"}`}>S</button>
                        <button onClick={() => setGridSize("md")} className={`px-3 py-1 text-xs font-bold rounded ${gridSize === "md" ? "bg-white/20 text-white" : "text-white/50 hover:text-white transition-colors"}`}>M</button>
                        <button onClick={() => setGridSize("lg")} className={`px-3 py-1 text-xs font-bold rounded ${gridSize === "lg" ? "bg-white/20 text-white" : "text-white/50 hover:text-white transition-colors"}`}>L</button>
                      </div>
                    </div>

                    <div className="h-px sm:h-12 w-full sm:w-px bg-white/10 shrink-0"></div>

                    <div className="flex flex-col items-center sm:items-start w-full sm:w-auto shrink-0">
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Actions</span>
                      <button
                        onClick={clearCollection}
                        disabled={collection.length === 0}
                        className="flex items-center gap-1.5 bg-red-900/40 hover:bg-red-700/60 disabled:opacity-30 disabled:cursor-not-allowed border border-red-500/40 hover:border-red-400/60 text-red-300 hover:text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow transition-all"
                        title="Clear entire collection"
                      >
                        <X className="w-3 h-3" />
                        Clear All
                      </button>
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

              <div className={`grid gap-2 sm:gap-4 justify-items-center w-full max-w-7xl mx-auto ${gridSize === "sm" ? "grid-cols-2 min-[500px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" :
                gridSize === "md" ? "grid-cols-2 min-[500px]:grid-cols-3" :
                  "grid-cols-1 min-[500px]:grid-cols-2"
                }`}>
                {(isCollectionView
                  ? getGroupedCollection(getSortedCards(getFilteredCollection(collection)))
                  : getSortedCards(cards).map(c => ({ card: c, count: 1 }))
                ).map((item, idx) => {
                  const { card, count } = item;
                  const dims = gridSize === "sm"
                    ? { container: "w-[184px] h-[230px]", content: "w-[368px] h-[461px]", scale: 184 / 368 }
                    : gridSize === "md"
                      ? { container: "w-[276px] h-[345px]", content: "w-[368px] h-[461px]", scale: 276 / 368 }
                      : { container: "w-[200px] h-[250px] sm:w-[280px] sm:h-[350px] lg:w-[368px] lg:h-[461px]", content: "w-full h-full", scale: 1 };

                  return (
                    <motion.div
                      key={`grid-${card.id}-${idx}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (idx % 10) * 0.05 }} // modulo for large collections
                      className={`relative ${dims.container} cursor-pointer group transition-transform hover:scale-105`}
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
                        <div className={`w-full h-full bg-gradient-to-br ${getRarityColors(card.rarity).bg} rounded-xl p-0.5 sm:p-1 shadow-2xl relative`}>
                          <div className={`w-full h-full border sm:border-2 ${getRarityColors(card.rarity).border} rounded-lg flex flex-col bg-black/50 backdrop-blur-sm relative overflow-hidden group`}>
                            {/* Background Poster Cover */}
                            {card.poster && (
                              <div
                                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-100 mix-blend-luminosity transition-opacity duration-300"
                                style={{ backgroundImage: `url(${card.poster})` }}
                              />
                            )}

                            <div className="relative z-10 flex justify-between items-start w-full p-2 sm:p-3 bg-gradient-to-b from-black/80 to-transparent">
                              <div className="flex flex-col gap-1 items-start">
                                <div className="bg-black/50 backdrop-blur rounded px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-0.5 sm:gap-1">
                                  <Sparkles className={`w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 ${getRarityColors(card.rarity).icon}`} />
                                  <span className={`text-[8px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-wider ${getRarityColors(card.rarity).text}`}>{card.rarity}</span>
                                </div>
                                {/* Vertical platforms in grid */}
                                {(card.type === "game" || card.type === "music") && card.platforms && card.platforms.length > 0 && (
                                  <div className="flex flex-col gap-1 items-start pl-0.5">
                                    {card.platforms.map((p, pi) => (
                                      <div key={pi} className={`${card.type === "music" ? "bg-green-900/50 border-green-400/30 text-green-50" : "bg-blue-900/50 border-cyan-400/30 text-cyan-50"} backdrop-blur-md border text-[7px] sm:text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded shadow-sm`}>
                                        {p}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <div className="bg-black/50 backdrop-blur rounded px-1.5 py-0.5 flex items-center gap-1 border border-white/10">
                                  {card.type === "movie" ? <Film className="w-2.5 h-2.5 text-slate-400" /> : card.type === "game" ? <Gamepad2 className="w-2.5 h-2.5 text-slate-400" /> : card.type === "music" ? <Headphones className="w-2.5 h-2.5 text-slate-400" /> : <Tv className="w-2.5 h-2.5 text-slate-400" />}
                                  <span className="text-[8px] font-black uppercase text-slate-400">{card.type}</span>
                                </div>
                                {!isCollectionView && newCardIds.has(card.id) && (
                                  <div className="bg-red-600 text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">
                                    New!
                                  </div>
                                )}
                              </div>
                              <div className="bg-black/50 backdrop-blur rounded px-1.5 py-0.5 sm:px-2 sm:py-1">
                                <span className="text-yellow-400 font-bold text-[10px] sm:text-xs lg:text-sm">⭐ {(card.rating ?? 0).toFixed(1)}</span>
                              </div>
                            </div>
                            <div className="relative z-10 mt-auto p-2 sm:p-4 w-full flex flex-col items-center bg-gradient-to-t from-black/90 via-black/70 to-transparent">
                              <ScrollableTitle title={card.name} baseClass="text-xs sm:text-sm lg:text-lg font-black text-white uppercase tracking-tight drop-shadow-md leading-tight" />
                              {card.type === "music" && card.description && (
                                <div className="text-[10px] sm:text-xs font-bold text-white/70 drop-shadow-md text-center max-w-[90%] truncate mt-0.5 sm:mt-1">
                                  {card.description}
                                </div>
                              )}
                              {card.year && (
                                <span className="text-[10px] sm:text-xs text-white/70 font-bold mb-1">{card.year}</span>
                              )}
                              <div className="flex gap-1.5 sm:gap-2 w-full justify-center mt-1 sm:mt-2">
                                {card.trailer && (
                                  <a href={card.trailer} target="_blank" rel="noopener noreferrer" className={`${card.type === "music" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white text-[8px] sm:text-[10px] lg:text-xs font-bold py-1 px-1.5 sm:px-2 flex items-center gap-1 rounded shadow`} onClick={(e) => {
                                    if(card.type === "music") {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const audio = new Audio(card.trailer);
                                      audio.volume = 0.5;
                                      audio.play().catch(() => {});
                                    } else {
                                      e.stopPropagation();
                                    }
                                  }}>
                                    {card.type === "music" ? <><Music className="w-3 h-3" /> Preview</> : "Trailer"}
                                  </a>
                                )}
                                {card.imdb_link && (
                                  <a href={card.imdb_link} target="_blank" rel="noopener noreferrer" className="bg-[#f5c518] hover:bg-[#d6ab15] text-black text-[8px] sm:text-[10px] lg:text-xs font-bold py-1 px-1.5 sm:px-2 rounded shadow" onClick={(e) => e.stopPropagation()}>
                                    {card.type === "game" ? "RAWG" : card.type === "music" ? "Apple" : "IMDb"}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 mix-blend-overlay rounded-xl pointer-events-none"></div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLEAR COLLECTION CONFIRMATION MODAL */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div
            key="clear-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowClearModal(false)}
          >
            <motion.div
              key="clear-modal-box"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-red-900/40 border border-red-500/40 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              {/* Text */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Clear Collection?</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Are you sure you want to delete all <span className="text-white font-semibold">{collection.length} card{collection.length !== 1 ? 's' : ''}</span> from your collection? This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2.5 px-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearCollection}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-red-900/30 transition-all"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TMDB ATTRIBUTION */}
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

      {/* ── SOUND SETTINGS MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showSoundModal && (
          <motion.div
            key="sound-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
            onClick={() => setShowSoundModal(false)}
          >
            <motion.div
              key="sound-modal-box"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-7 w-full max-w-sm flex flex-col gap-4 max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Volume2 className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Sound Settings</h3>
                  <p className="text-white/40 text-xs">Upload custom SFX per rarity</p>
                </div>
                <button onClick={() => setShowSoundModal(false)} className="ml-auto text-white/40 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Pack Actions group */}
              <div>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Pack Actions</p>
                <div className="flex flex-col divide-y divide-white/5 rounded-xl overflow-hidden border border-white/10">
                  {(["tear", "flip", "swoosh", "sparkle"] as SoundType[]).map((type) => (
                    <SoundRow
                      key={type}
                      type={type}
                      isCustom={!!customSounds[type]}
                      onPreview={() => previewSound(type)}
                      onUpload={() => { setUploadTarget(type); fileInputRef.current?.click(); }}
                      onReset={() => resetSound(type)}
                    />
                  ))}
                </div>
              </div>

              {/* Rarity Reveals group */}
              <div>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Rarity Reveals</p>
                <div className="flex flex-col divide-y divide-white/5 rounded-xl overflow-hidden border border-white/10">
                  {(["Junk", "Common", "Uncommon", "Rare", "Epic", "Legendary"] as SoundType[]).map((type) => (
                    <SoundRow
                      key={type}
                      type={type}
                      isCustom={!!customSounds[type]}
                      onPreview={() => previewSound(type)}
                      onUpload={() => { setUploadTarget(type); fileInputRef.current?.click(); }}
                      onReset={() => resetSound(type)}
                    />
                  ))}
                </div>
              </div>

              <p className="text-white/20 text-[10px] text-center">
                MP3 · WAV · OGG · M4A supported. Custom sounds are saved locally in your browser.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TWITCH SETTINGS MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {showTwitchModal && (
          <motion.div
            key="twitch-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ backgroundColor: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
            onClick={() => setShowTwitchModal(false)}
          >
            <motion.div
              key="twitch-modal-box"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
              className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Twitch Integration</h3>
                  <p className="text-white/50 text-xs">Post card reveals to your chat</p>
                </div>
                <button
                  onClick={() => setShowTwitchModal(false)}
                  className="ml-auto text-white/40 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status badge */}
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border ${
                twitchStatus === "connected" ? "bg-purple-900/30 border-purple-500/40 text-purple-300" :
                twitchStatus === "connecting" ? "bg-yellow-900/30 border-yellow-500/40 text-yellow-300" :
                twitchStatus === "error" ? "bg-red-900/30 border-red-500/40 text-red-300" :
                "bg-white/5 border-white/10 text-white/40"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  twitchStatus === "connected" ? "bg-purple-400" :
                  twitchStatus === "connecting" ? "bg-yellow-400 animate-pulse" :
                  twitchStatus === "error" ? "bg-red-400" :
                  "bg-white/20"
                }`} />
                {twitchStatus === "connected" && `Connected to #${twitchConfig.channel}`}
                {twitchStatus === "connecting" && "Connecting…"}
                {twitchStatus === "error" && "Auth failed — check your token"}
                {twitchStatus === "disconnected" && "Not connected"}
              </div>

              {/* Form */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Channel Name</label>
                  <input
                    id="twitch-channel"
                    type="text"
                    placeholder="your_channel"
                    value={twitchForm.channel}
                    onChange={e => setTwitchForm(f => ({ ...f, channel: e.target.value }))}
                    className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Twitch Username</label>
                  <input
                    id="twitch-username"
                    type="text"
                    placeholder="your_username"
                    value={twitchForm.username}
                    onChange={e => setTwitchForm(f => ({ ...f, username: e.target.value }))}
                    className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                    OAuth Token
                    <a
                      href="https://twitchapps.com/tmi/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 font-bold normal-case tracking-normal text-[11px] transition-colors"
                    >
                      Get token ↗
                    </a>
                  </label>
                  <input
                    id="twitch-token"
                    type="password"
                    placeholder="oauth:xxxxxxxxxxxxxx"
                    value={twitchForm.token}
                    onChange={e => {
                      // Strip "oauth:" prefix if pasted with it
                      const val = e.target.value.replace(/^oauth:/i, "");
                      setTwitchForm(f => ({ ...f, token: val }));
                    }}
                    className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all font-mono"
                  />
                  <p className="text-white/30 text-[10px] leading-relaxed">
                    Stored only in your browser&apos;s localStorage. Never sent anywhere except directly to Twitch.
                  </p>
                </div>
              </div>

              {/* Message preview */}
              <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                <p className="text-white/30 text-[10px] uppercase font-semibold mb-1">Preview message</p>
                <p className="text-white/70 text-xs font-mono break-all">
                  🌟 [LEGENDARY] Inception | 🎬 Movie | ⭐ 8.8/10 ⭐⭐⭐⭐⭐
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {twitchStatus === "connected" ? (
                  <button
                    id="twitch-disconnect-btn"
                    onClick={() => { twitchDisconnect(); setShowTwitchModal(false); }}
                    className="flex-1 bg-red-900/40 hover:bg-red-700/50 border border-red-500/40 text-red-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    id="twitch-connect-btn"
                    onClick={() => {
                      if (!twitchForm.channel || !twitchForm.username || !twitchForm.token) return;
                      twitchConnect(twitchForm);
                    }}
                    disabled={!twitchForm.channel || !twitchForm.username || !twitchForm.token || twitchStatus === "connecting"}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-purple-900/30 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {twitchStatus === "connecting" ? (
                      <><RefreshCcw className="w-4 h-4 animate-spin" /> Connecting…</>
                    ) : "Connect"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
