import { useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { CardData } from "../lib/tmdb";
import { Rarity, formatPackName } from "../lib/cardUtils";

type TwitchStatus = "disconnected" | "connecting" | "connected" | "error";

interface CardEffectsProps {
  card: CardData | null;
  cardIndex: number;
  isFlipped: boolean;
  isActive: boolean;
  isMuted: boolean;
  twitchStatus: TwitchStatus;
  twitchSend: (msg: string) => void;
  onPlaySound: (rarity: Rarity | "tear" | "flip" | "swoosh" | "sparkle" | "foil" | "godpack") => void;
  onJunkEffect: (idx: number) => void;
  onMusicPreview: (url: string) => void;
  onPokemonCry?: (url: string) => void;
  username?: string;
  isGodPack?: boolean;
}

const formatListeners = (num?: number): string => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

/**
 * Side-effect component: fires confetti, junk effect, sound, and Twitch chat
 * when a card is flipped for the first time.
 */
export const useCardEffects = ({
  card,
  cardIndex,
  isFlipped,
  isActive,
  isMuted,
  twitchStatus,
  twitchSend,
  onPlaySound,
  onJunkEffect,
  onMusicPreview,
  onPokemonCry,
  username,
  isGodPack,
}: CardEffectsProps) => {
  const firedRef = useRef<Set<number>>(new Set());
  const twitchFiredRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!card || !isFlipped || !isActive) return;
    if (firedRef.current.has(cardIndex)) return;
    firedRef.current.add(cardIndex);

    // Play godpack fanfare on first card of a godpack, or foil chime, or rarity sound
    if (isGodPack && cardIndex === 0) {
      onPlaySound("godpack");
      setTimeout(() => onPlaySound("foil"), 400);
      if (card.rarity === "Legendary" || card.rarity === "Epic") {
        setTimeout(() => onPlaySound(card.rarity), 800);
      }
    } else if (card.isFoil) {
      onPlaySound("foil");
      // Delayed secondary rarity cue if high rarity
      if (card.rarity === "Legendary" || card.rarity === "Epic") {
        setTimeout(() => onPlaySound(card.rarity), 250);
      }
    } else {
      onPlaySound(card.rarity);
    }

    // Auto-play music preview
    if (card.type === "music" && card.trailer && !isMuted) {
      onMusicPreview(card.trailer);
    }
    
    // Play Pokemon cry
    if (card.type === "pokemon" && card.cryUrl && !isMuted && onPokemonCry) {
      onPokemonCry(card.cryUrl);
    }

    // Visual effects (confetti / junk)
    if (isGodPack && cardIndex === 0) {
      // Epic burst for opening a Godpack!
      confetti({
        particleCount: 250,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#FFD700", "#FFA500", "#FF69B4", "#00FFFF", "#9370DB", "#FFFFFF"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 180,
          spread: 120,
          origin: { y: 0.55 },
          colors: ["#FFD700", "#F59E0B", "#EC4899", "#3B82F6"],
        });
      }, 300);
    } else if (card.isFoil) {
      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#EC4899", "#A855F7", "#3B82F6", "#FACC15", "#34D399", "#FFFFFF"],
      });
    }

    if (card.rarity === "Legendary") {
      confetti({ particleCount: 250, spread: 70, angle: 60, origin: { x: 0.2, y: 0.6 }, colors: ["#FBBF24", "#F59E0B", "#D97706", "#FFFBEB"] });
      setTimeout(() => {
        confetti({ particleCount: 250, spread: 70, angle: 120, origin: { x: 0.8, y: 0.6 }, colors: ["#FBBF24", "#F59E0B", "#D97706", "#FFFBEB"] });
      }, 200);
    } else if (card.rarity === "Epic") {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ["#C084FC", "#E879F9", "#A855F7", "#F3E8FF"] });
    } else if (card.rarity === "Junk") {
      onJunkEffect(cardIndex);
    }

    // Twitch chat
    if (twitchStatus === "connected" && card.type !== "ero" && !twitchFiredRef.current.has(cardIndex)) {
      twitchFiredRef.current.add(cardIndex);

      if (isGodPack && cardIndex === 0) {
        const godMsg = `✨👑🔥 [GODPACK DETECTED] 🔥👑✨ Every single card in this pack is HOLOGRAPHIC FOIL!`;
        twitchSend(godMsg);
      }

      const rarityEmoji: Record<Rarity, string> = {
        Junk: "🗑️", Common: "⚪", Uncommon: "🟢", Rare: "🔵", Epic: "🟣", Legendary: "🌟",
      };
      const foilTag = (isGodPack && card.isFoil) ? "✨👑 [GOD PACK FOIL] 👑✨ " : card.isFoil ? "✨ [FOIL] ✨ " : "";
      const isConsolation = card.id === "rick-roll-fallback" || card.name === "Consolation Prize" || !!card.isConsolation;
      const typeLabel = 
        isConsolation ? "🎁 Consolation" :
        card.type === "movie" ? "🎬 Movie" : 
        card.type === "game" ? "🎮 Game" : 
        card.type === "music" ? "🎵 Music" : 
        card.type === "anime" ? "🌸 Anime" : 
        card.type === "pokemon" ? "⚡ Pokémon" :
        card.type === "boardgame" ? "🎲 Board" :
        card.type === "giphy" ? "🖼️ GIF" :
        card.type === "yugioh" ? "🃏 Duelist" :
        card.type === "mtg" ? "🔮 MTG" :
        card.type === "disney" ? "🏰 Disney" :
        card.type === "digimon" ? "🦖 Digimon" :
        card.type === "lorcana" ? "✒️ Lorcana" :
        card.type === "country" ? "🌍 World" :
        card.type === "pokemontcg" ? "⚡ PTCG" :
        card.type === "ghibli" ? "🍃 Ghibli" :
        card.type === "dragonball" ? "🐉 Dragon Ball" :
        card.type === "numbers" ? "🔢 Number" :
        "📺 TV Series";
        
      const stars = "⭐".repeat(Math.round(card.rating / 2));
      let extraInfo = "";
      if (isConsolation) {
        const packTitle = card.originalPack ? `${formatPackName(card.originalPack)} Pack` : "Pack";
        extraInfo = card.originalPack
          ? ` (Intended: ${packTitle} - Ran into a problem)`
          : ` (Ran into a problem opening pack)`;
      } else if (card.type === "movie" || card.type === "tv" || card.type === "ghibli") {
        if (card.year) extraInfo = ` (${card.year})`;
      } else if (card.type === "game") {
        const platforms = card.platforms?.slice(0, 3).join(", ");
        if (platforms) extraInfo = ` [${platforms}${card.platforms!.length > 3 ? "..." : ""}]`;
      } else if (card.type === "music") {
        const artist = card.description?.split(" • ")[0] || "";
        const artistPart = artist ? `by ${artist}` : "";
        const listens = card.listeners ? ` | 🎧 ${formatListeners(card.listeners)} listens` : "";
        extraInfo = ` ${artistPart}${listens}`;
      } else if (card.type === "anime") {
        const desc = card.description || "";
        const year = card.year ? ` (${card.year})` : "";
        extraInfo = desc ? ` [${desc}]${year}` : year;
      } else if (card.type === "pokemon") {
        extraInfo = ` #${String(card.year).padStart(4, "0")}`;
      } else if (card.type === "disney") {
        const source = card.description || "";
        extraInfo = source ? ` [From: ${source}]` : "";
      } else if (["yugioh", "mtg", "lorcana", "pokemontcg"].includes(card.type)) {
        if (card.year) extraInfo = ` (Set ${card.year})`;
      } else if (card.type === "boardgame") {
        if (card.rank) extraInfo = ` (Rank #${card.rank})`;
      } else if (card.type === "dragonball") {
        const kiInfo = card.platforms?.find(p => p.startsWith("KI:"));
        if (kiInfo) extraInfo = ` [${kiInfo}]`;
      } else if (card.type === "numbers") {
        if (card.description) extraInfo = ` [${card.description}]`;
      }
      
      const userPrefix = username ? `${username} found a ` : "";
      const showRating = !["yugioh", "mtg", "digimon", "lorcana", "pokemontcg", "ghibli", "dragonball", "country", "numbers"].includes(card.type);
      const ratingPart = showRating && card.rating > 0 ? ` | ⭐ ${card.rating.toFixed(1)}/10 ${stars}` : "";
      
      const msg = `${userPrefix}${typeLabel} | ${foilTag}${rarityEmoji[card.rarity]} [${card.rarity.toUpperCase()}] ${card.name}${extraInfo}${ratingPart}`;
      
      // Send message after 1s delay as requested
      setTimeout(() => {
        twitchSend(msg);
      }, 1000);
    }
  }, [isFlipped, isActive, cardIndex, card, username, twitchStatus, twitchSend, isGodPack]);

  // Reset tracking when the hook is used for a new session (e.g. pack reset)
  const reset = useCallback(() => {
    firedRef.current.clear();
    twitchFiredRef.current.clear();
  }, []);

  return { reset };
};
