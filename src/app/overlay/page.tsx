"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useGameAudio, SoundType } from "../../lib/useGameAudio";
import { CardData, fetchRandomPack } from "../../lib/tmdb";
import { fetchRandomGamePack } from "../../lib/games";
import { fetchRandomMusicPack } from "../../lib/music";
import { fetchRandomAnimePack } from "../../lib/anime";
import { fetchRandomPokemonPack } from "../../lib/pokemon";
import { fetchRandomBoardGamePack } from "../../lib/boardgames";
import { fetchRandomGiphyPack } from "../../lib/giphy";
import { fetchRandomYugiohPack } from "../../lib/yugioh";
import { fetchRandomMtgPack } from "../../lib/mtg";
import { fetchRandomDisneyPack } from "../../lib/disney";
import { useTwitchChat } from "../../lib/useTwitchChat";
import { PackVisual, PackType } from "../../components/PackVisual";
import { CardReveal } from "../../components/CardReveal";
import { useCardEffects } from "../../components/CardEffects";

interface QueueItem {
  id: string;
  type: PackType;
  count: number;
  username?: string;
}



export default function OverlayPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentPack, setCurrentPack] = useState<QueueItem | null>(null);
  
  // Pack states
  const [packState, setPackState] = useState<"sealed" | "tearing" | "opened" | "revealing" | "done">("sealed");
  const [cards, setCards] = useState<CardData[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tearProgress, setTearProgress] = useState(0);
  
  const { isMuted, playSound } = useGameAudio();
  const controls = useAnimation();
  const isOpenedRef = useRef(false);
  const playedRevealSounds = useRef<Set<number>>(new Set());
  const currentPreviewAudio = useRef<HTMLAudioElement | null>(null);
  const [junkEffectCardIdx, setJunkEffectCardIdx] = useState<number | null>(null);

  // ── Sync Queue from localStorage ──────────────────────────────────────────
  const syncQueue = useCallback(() => {
    try {
      const saved = localStorage.getItem("gacha_overlay_queue");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setQueue(parsed);
      }
    } catch (e) { console.error("Queue sync error", e); }
  }, []);

  useEffect(() => {
    syncQueue();
    window.addEventListener("storage", syncQueue);
    return () => window.removeEventListener("storage", syncQueue);
  }, [syncQueue]);

  // Handle URL Params for single-trigger additions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type") as PackType;
    const count = parseInt(params.get("count") || "5", 10);
    const user = params.get("user") || undefined;
    
    if (type) {
      const newItem: QueueItem = { id: crypto.randomUUID(), type, count, username: user };
      const currentQueue = JSON.parse(localStorage.getItem("gacha_overlay_queue") || "[]");
      localStorage.setItem("gacha_overlay_queue", JSON.stringify([...currentQueue, newItem]));
      
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("type");
      url.searchParams.delete("count");
      url.searchParams.delete("user");
      window.history.replaceState({}, '', url);
      syncQueue();
    }
  }, [syncQueue]);



  // ── Pack revealing logic ──────────────────────────────────────────────────
  const handleOpen = useCallback(async () => {
    if (isOpenedRef.current || !currentPack) return;
    isOpenedRef.current = true;
    setIsLoading(true);

    const { type, count } = currentPack;
    const fetched = type === "games" ? await fetchRandomGamePack(count)
      : type === "music" ? await fetchRandomMusicPack(count)
      : type === "anime" ? await fetchRandomAnimePack(count)
      : type === "pokemon" ? await fetchRandomPokemonPack(count)
      : type === "boardgame" ? await fetchRandomBoardGamePack(count)
      : type === "giphy" ? await fetchRandomGiphyPack(count)
      : type === "yugioh" ? await fetchRandomYugiohPack(count)
      : type === "mtg" ? await fetchRandomMtgPack(count)
      : type === "disney" ? await fetchRandomDisneyPack(count)
      : await fetchRandomPack(count);

    setCards(fetched);
    setIsLoading(false);
    setPackState("opened");
    setTearProgress(100);
    controls.start({ y: -150, x: 100, opacity: 0, rotate: 25, transition: { duration: 0.6, ease: "easeOut" } });
    setTimeout(() => setPackState("revealing"), 800);
  }, [currentPack, controls]);

  const { status: twitchStatus, sendMessage: twitchSend } = useTwitchChat();

  // Use the CardEffects logic for the current card
  const activeCard = cards[activeCardIndex] ?? null;
  const { reset: resetEffects } = useCardEffects({
    card: activeCard,
    cardIndex: activeCardIndex,
    isFlipped: !!flippedCards[activeCardIndex],
    isActive: packState === "revealing",
    isMuted,
    twitchStatus,
    twitchSend,
    username: currentPack?.username,
    onPlaySound: (rarity) => {
      if (!playedRevealSounds.current.has(activeCardIndex)) {
        playedRevealSounds.current.add(activeCardIndex);
        playSound(rarity as SoundType);
      }
    },
    onJunkEffect: (idx) => setJunkEffectCardIdx(idx),
    onMusicPreview: (url) => {
        if(currentPreviewAudio.current) { currentPreviewAudio.current.pause(); }
        currentPreviewAudio.current = new Audio(url);
        currentPreviewAudio.current.volume = 0.5;
        currentPreviewAudio.current.play().catch(() => {});
    },
    onPokemonCry: (url) => {
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.play().catch(() => {});
    }
  });

  // ── Logic: Pick next from queue ───────────────────────────────────────────
  useEffect(() => {
    if (!currentPack && queue.length > 0) {
      const next = queue[0];
      setCurrentPack(next);
      setQueue(prev => prev.slice(1));
      localStorage.setItem("gacha_overlay_queue", JSON.stringify(queue.slice(1)));
      
      // Reset pack visuals
      isOpenedRef.current = false;
      setPackState("sealed");
      setTearProgress(0);
      setCards([]);
      setActiveCardIndex(0);
      setFlippedCards({});
      playedRevealSounds.current.clear();
      resetEffects();
      controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
    } else if (!currentPack && queue.length === 0 && packState === "done") {
      setPackState("sealed"); // prevent infinite loop
    }
  }, [currentPack, queue, packState, controls, resetEffects]);

  // Automated transitions
  useEffect(() => {
    if (packState === "sealed" && currentPack) {
      const t = setTimeout(handleOpen, 2000);
      return () => clearTimeout(t);
    }
    if (packState === "revealing") {
      if (!flippedCards[activeCardIndex]) {
        const t = setTimeout(() => setFlippedCards(p => ({ ...p, [activeCardIndex]: true })), 1500);
        return () => clearTimeout(t);
      }
      
      const duration = activeCard?.type === "music" ? 12000 : 7000;
      
      if (activeCardIndex < cards.length - 1) {
        const t = setTimeout(() => {
            if(currentPreviewAudio.current) { currentPreviewAudio.current.pause(); }
            setActiveCardIndex(prev => prev + 1);
        }, duration);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => {
            if(currentPreviewAudio.current) { currentPreviewAudio.current.pause(); }
            setPackState("done");
            setCurrentPack(null);
        }, duration);
        return () => clearTimeout(t);
      }
    }
  }, [packState, currentPack, activeCardIndex, flippedCards, cards, handleOpen, activeCard]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center overflow-hidden font-sans text-white">
      {/* Background glow for the stream overlay */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-purple-500/10 to-transparent pointer-events-none" />

      <main className="relative z-10 w-full max-w-md mx-auto p-6 h-[100dvh] flex flex-col items-center justify-center">
        
        {/* User Badge if present */}
        <AnimatePresence>
          {currentPack && currentPack.username && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-10 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-purple-500/30 flex items-center gap-2"
            >
              <div className="text-purple-400">✨</div>
              <div className="text-sm font-black uppercase tracking-widest">
                Opening for <span className="text-purple-300">{currentPack.username}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 w-full relative flex items-center justify-center select-none pt-16">
          <AnimatePresence>
            {packState === "revealing" && cards[activeCardIndex] && (
                <CardReveal
                  key={cards[activeCardIndex].id}
                  card={cards[activeCardIndex]}
                  idx={activeCardIndex}
                  packType={currentPack?.type || "movies"}
                  packState={packState}
                  isFlipped={flippedCards[activeCardIndex]}
                  isAutoMode={true}
                  showTrailerIdx={null}
                  isNew={false}
                  junkEffectCardIdx={junkEffectCardIdx}
                  zIndex={20}
                  onClick={() => {}}
                  onJunkDone={() => setJunkEffectCardIdx(null)}
                />
            )}
          </AnimatePresence>

          {(packState === "sealed" || packState === "opened" || packState === "tearing") && currentPack && (
            <PackVisual
              packType={currentPack.type}
              tearProgress={tearProgress}
              isLoading={isLoading}
              isAutoMode={true}
              controls={controls}
              onPointerDown={() => {}}
              onPointerMove={() => {}}
              onPointerUp={() => {}}
            />
          )}
        </div>
      </main>
    </div>
  );
}
