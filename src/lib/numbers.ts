import { CardData, Rarity } from "./tmdb";

const GIPHY_BASE = "https://api.giphy.com/v1/gifs";
const PUBLIC_BETA_KEY = "dc6zaTOxFJmzC";

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

// Giphy titles rarely spell out an arbitrary number, but the slug
// (e.g. "trealtorr-america-250-250th-anniversary-...") very often does.
// Match on word boundaries so "3" doesn't false-positive inside "373".
const gifMatchesNumber = (gif: any, n: number): boolean => {
  const boundary = new RegExp(`(^|[^0-9])${n}([^0-9]|$)`);
  return boundary.test(`${gif.title || ""} ${gif.slug || ""}`);
};

// Try a couple of query phrasings and prefer whichever result actually
// contains the drawn number (via title/slug), instead of blindly taking
// the first hit for a generic "number N" search.
const findBestGif = async (n: number, apiKey: string): Promise<any | null> => {
  const queries = [String(n), `number ${n}`];
  let fallback: any = null;

  for (const q of queries) {
    try {
      const query = encodeURIComponent(q);
      const res = await fetch(`${GIPHY_BASE}/search?api_key=${apiKey}&q=${query}&limit=15&rating=pg-13`);
      if (!res.ok) continue;
      const data = await res.json();
      const results = data.data || [];
      if (!fallback && results[0]) fallback = results[0];

      const exactMatch = results.find((g: any) => gifMatchesNumber(g, n));
      if (exactMatch) return exactMatch;
    } catch {
      // try the next query phrasing
    }
  }

  return fallback;
};

export const fetchRandomNumbersPack = async (count: number = 5): Promise<CardData[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || PUBLIC_BETA_KEY;
    const numbers = pickUniqueNumbers(count);

    // Resolve each number's best-matching Giphy result in parallel, falling
    // back to a blank-poster card on a per-number failure so the pack always
    // comes back with exactly `count` cards instead of falling short.
    const cards: CardData[] = await Promise.all(
      numbers.map(async (n): Promise<CardData> => {
        const rarity = getRarityForNumber(n);
        try {
          const gif = await findBestGif(n, apiKey);

          return {
            id: `number-${n}`,
            rarity,
            name: `${n}`,
            description: gif?.title || "",
            poster: gif?.images?.fixed_height?.url || gif?.images?.original?.url || "",
            rating: 0,
            type: "numbers",
            imdb_link: gif?.url,
          };
        } catch (e) {
          console.error(`Failed to fetch gif for number ${n}`, e);
          return {
            id: `number-${n}`,
            rarity,
            name: `${n}`,
            description: "",
            poster: "",
            rating: 0,
            type: "numbers",
          };
        }
      })
    );

    return cards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
  } catch (e) {
    console.error("Numbers fetch failed:", e);
    return [];
  }
};
