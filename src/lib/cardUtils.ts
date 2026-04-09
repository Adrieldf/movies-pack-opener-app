import { CardData } from "./tmdb";

export type Rarity = "Junk" | "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type SortOption = "name_asc" | "name_desc" | "rarity_high" | "rarity_low" | "year_new" | "year_old" | "rating_high" | "rating_low";
export type TypeFilter = "all" | "movie" | "tv" | "game" | "music" | "anime" | "pokemon" | "boardgame" | "giphy" | "yugioh" | "mtg";

export const POKEMON_TYPE_COLORS: Record<string, string> = {
  fire: "bg-red-600/80 border-red-400 text-white shadow-[0_0_8px_rgba(220,38,38,0.4)]",
  water: "bg-blue-600/80 border-blue-400 text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]",
  grass: "bg-green-600/80 border-green-400 text-white shadow-[0_0_8px_rgba(22,163,74,0.4)]",
  electric: "bg-yellow-400/80 border-yellow-300 text-black shadow-[0_0_8px_rgba(250,204,21,0.4)]",
  psychic: "bg-pink-500/80 border-pink-300 text-white shadow-[0_0_8px_rgba(236,72,153,0.4)]",
  ice: "bg-cyan-300/80 border-cyan-100 text-black shadow-[0_0_8px_rgba(103,232,249,0.4)]",
  dragon: "bg-indigo-600/80 border-indigo-400 text-white shadow-[0_0_8px_rgba(79,70,229,0.4)]",
  dark: "bg-slate-900/80 border-slate-600 text-white shadow-[0_0_8px_rgba(15,23,42,0.4)]",
  fairy: "bg-rose-300/80 border-rose-100 text-black shadow-[0_0_8px_rgba(253,164,175,0.4)]",
  normal: "bg-slate-400/80 border-slate-200 text-white shadow-[0_0_8px_rgba(148,163,184,0.4)]",
  fighting: "bg-orange-700/80 border-orange-500 text-white shadow-[0_0_8px_rgba(194,65,12,0.4)]",
  flying: "bg-sky-300/80 border-sky-100 text-black shadow-[0_0_8px_rgba(125,211,252,0.4)]",
  poison: "bg-purple-600/80 border-purple-400 text-white shadow-[0_0_8px_rgba(147,51,234,0.4)]",
  ground: "bg-amber-600/80 border-amber-400 text-white shadow-[0_0_8px_rgba(217,119,6,0.4)]",
  rock: "bg-stone-600/80 border-stone-400 text-white shadow-[0_0_8px_rgba(87,83,78,0.4)]",
  bug: "bg-lime-500/80 border-lime-300 text-white shadow-[0_0_8px_rgba(132,204,22,0.4)]",
  ghost: "bg-violet-700/80 border-violet-500 text-white shadow-[0_0_8px_rgba(109,40,217,0.4)]",
  steel: "bg-zinc-400/80 border-zinc-200 text-black shadow-[0_0_8px_rgba(161,161,170,0.4)]",
};

export const rarityOrder: Record<Rarity, number> = {
  Junk: -1,
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
};

export const getRarityColors = (rarity: Rarity) => {
  const colors: Record<Rarity, { 
    bg: string; 
    text: string; 
    icon: string; 
    border: string;
    tagBg: string;
    tagText: string;
    animate: string;
  }> = {
    Junk: { 
      bg: "from-[#4a5c2f] via-[#6b7c3a] to-[#3d4f25]", 
      text: "text-lime-100", 
      icon: "text-lime-300", 
      border: "border-lime-900/50",
      tagBg: "bg-lime-900/80",
      tagText: "text-lime-200",
      animate: "animate-pulse-junk"
    },
    Common: { 
      bg: "from-slate-300 via-gray-200 to-slate-400", 
      text: "text-slate-800", 
      icon: "text-slate-100", 
      border: "border-slate-100/50",
      tagBg: "bg-slate-700/80",
      tagText: "text-white",
      animate: "animate-pulse-common"
    },
    Uncommon: { 
      bg: "from-green-300 via-emerald-200 to-green-400", 
      text: "text-green-900", 
      icon: "text-green-100", 
      border: "border-green-100/50",
      tagBg: "bg-green-700/80",
      tagText: "text-green-50",
      animate: "animate-pulse-uncommon"
    },
    Rare: { 
      bg: "from-blue-300 via-cyan-200 to-blue-400", 
      text: "text-blue-900", 
      icon: "text-blue-100", 
      border: "border-blue-100/50",
      tagBg: "bg-blue-700/80",
      tagText: "text-blue-50",
      animate: "animate-pulse-rare"
    },
    Epic: { 
      bg: "from-purple-300 via-fuchsia-200 to-purple-400", 
      text: "text-purple-900", 
      icon: "text-purple-100", 
      border: "border-purple-100/50",
      tagBg: "bg-purple-700/80",
      tagText: "text-purple-50",
      animate: "animate-pulse-epic"
    },
    Legendary: { 
      bg: "from-yellow-300 via-amber-200 to-orange-400", 
      text: "text-amber-900", 
      icon: "text-yellow-100", 
      border: "border-yellow-100/50",
      tagBg: "bg-amber-600/90",
      tagText: "text-white",
      animate: "animate-pulse-legendary"
    },
  };
  return colors[rarity] ?? colors.Common;
};

export const formatListeners = (num?: number): string => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

export const sanitizeCards = (cards: CardData[]): CardData[] =>
  cards.map(card => ({
    ...card,
    rating: card.rating ?? 0,
    name: card.name ?? "Unknown",
    rarity: card.rarity ?? "Common",
  }));

export const getGroupedCollection = (cardList: CardData[]): { card: CardData; count: number }[] => {
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

export const getSortedCards = (cardList: CardData[], sortBy: SortOption): CardData[] =>
  [...cardList].sort((a, b) => {
    switch (sortBy) {
      case "name_asc":    return a.name.localeCompare(b.name);
      case "name_desc":   return b.name.localeCompare(a.name);
      case "rarity_high": return rarityOrder[b.rarity] - rarityOrder[a.rarity] || a.name.localeCompare(b.name);
      case "rarity_low":  return rarityOrder[a.rarity] - rarityOrder[b.rarity] || a.name.localeCompare(b.name);
      case "year_new":    return (b.year || 0) - (a.year || 0) || a.name.localeCompare(b.name);
      case "year_old":    return (a.year || 9999) - (b.year || 9999) || a.name.localeCompare(b.name);
      case "rating_high": return b.rating - a.rating || a.name.localeCompare(b.name);
      case "rating_low":  return a.rating - b.rating || a.name.localeCompare(b.name);
      default:            return 0;
    }
  });

export const getFilteredCollection = (cardList: CardData[], typeFilter: TypeFilter): CardData[] => {
  if (typeFilter === "all") return cardList;
  return cardList.filter(card => card.type === typeFilter);
};
