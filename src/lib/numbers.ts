import { CardData, Rarity } from "./tmdb";

const DICEBEAR_BASE = "https://api.dicebear.com/9.x";

// A mix of DiceBear's character-style collections; one is picked at random per card.
const DICEBEAR_STYLES = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "avataaars-neutral",
  "big-ears",
  "big-ears-neutral",
  "big-smile",
  "bottts",
  "bottts-neutral",
  "croodles",
  "croodles-neutral",
  "fun-emoji",
  "lorelei",
  "lorelei-neutral",
  "micah",
  "miniavs",
  "notionists",
  "notionists-neutral",
  "open-peeps",
  "personas",
  "pixel-art",
  "pixel-art-neutral",
];

const LEGENDARY_NUMBERS = new Set([69, 67, 666, 777, 999]);

const rarityOrder: Record<Rarity, number> = {
  Junk: -1, Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4,
};

const getRarityForNumber = (n: number): Rarity => {
  if (LEGENDARY_NUMBERS.has(n)) return "Legendary";
  if (n >= 0 && n <= 9) return "Rare";
  if (n % 10 === 0 || n % 10 === 5) return "Uncommon";
  return "Common";
};

// Only 1000 possible values (0-999), so cap and pick without repeats
const pickUniqueNumbers = (count: number): number[] => {
  const numbers = new Set<number>();
  const max = Math.min(count, 1000);
  while (numbers.size < max) {
    numbers.add(Math.floor(Math.random() * 1000));
  }
  return Array.from(numbers);
};

const getAvatarUrl = (n: number): string => {
  const style = DICEBEAR_STYLES[Math.floor(Math.random() * DICEBEAR_STYLES.length)];
  return `${DICEBEAR_BASE}/${style}/svg?seed=${n}`;
};

export const fetchRandomNumbersPack = async (count: number = 5): Promise<CardData[]> => {
  try {
    const numbers = pickUniqueNumbers(count);

    const cards: CardData[] = numbers.map((n): CardData => {
      const rarity = getRarityForNumber(n);
      return {
        id: `number-${n}`,
        rarity,
        name: `${n}`,
        description: "",
        poster: getAvatarUrl(n),
        rating: 0,
        type: "numbers",
      };
    });

    return cards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
  } catch (e) {
    console.error("Numbers fetch failed:", e);
    return [];
  }
};
