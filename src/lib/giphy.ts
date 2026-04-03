import { CardData, Rarity } from "./tmdb";

const GIPHY_BASE = "https://api.giphy.com/v1/gifs";
const PUBLIC_BETA_KEY = "dc6zaTOxFJmzC";

const rarityOrder: Record<Rarity, number> = {
  Junk: -1, Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4,
};

/** GIF rarity based on random chance or metadata */
const getRandomRarity = (idx: number): Rarity => {
  const rand = Math.random() * 100;
  if (rand >= 98) return "Legendary";
  if (rand >= 90) return "Epic";
  if (rand >= 70) return "Rare";
  if (rand >= 40) return "Uncommon";
  if (rand <= 10) return "Junk";
  return "Common";
};

export const fetchRandomGiphyPack = async (count: number = 5): Promise<CardData[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || PUBLIC_BETA_KEY;
    const offset = Math.floor(Math.random() * 200); // Randomize start point
    
    const res = await fetch(`${GIPHY_BASE}/trending?api_key=${apiKey}&limit=${count * 3}&offset=${offset}&rating=pg-13`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Giphy API Error: ${res.status}. Your API key might be banned or invalid. msg: ${errorText}`);
      return []; // Return empty instead of throwing to prevent UI crash
    }
    
    const data = await res.json();
    const pool = data.data || [];
    
    // Choose `count` unique items from pool
    const selected = pool
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, pool.length));

    const cards: CardData[] = selected.map((gif: any): CardData => {
      const rarity = getRandomRarity(0);
      const rating = parseFloat((Math.random() * 5 + 5).toFixed(1)); // 5-10 rating for GIFs

      // Pick fixed_height gif if possible for performance
      const poster: string = gif.images?.fixed_height?.url || gif.images?.original?.url || "";

      return {
        id: `giphy-${gif.id}`,
        rarity,
        name: gif.title || "Untitled GIF",
        description: `@${gif.username || "Giphy"} • ${gif.rating.toUpperCase()} • ${gif.trending_datetime !== "0000-00-00 00:00:00" ? "🔥 Trending" : "✨ New"}`,
        poster,
        rating,
        imdb_link: gif.url,
        type: "giphy" as any,
        platforms: gif.username ? [`#${gif.username}`] : ["#giphy"],
        year: parseInt(gif.import_datetime?.split("-")[0] || "2024"),
      };
    });

    return cards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
  } catch (e) {
    console.error("Giphy fetch failed:", e);
    return [];
  }
};
