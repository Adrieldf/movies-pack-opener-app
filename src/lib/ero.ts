import { CardData, Rarity } from "./tmdb";
import { rarityOrder } from "./cardUtils";

const WAIFU_BASE = "https://api.waifu.im";

const getRarityByFavorites = (favs: number): Rarity => {
  if (favs >= 300) return "Legendary";
  if (favs >= 150) return "Epic";
  if (favs >= 50) return "Rare";
  if (favs >= 20) return "Uncommon";
  if (favs >= 5) return "Common";
  return "Junk";
};

export const fetchRandomEroPack = async (count: number = 5): Promise<CardData[]> => {
  try {
    // Request a larger page size to have a good pool for randomized selection
    const res = await fetch(`${WAIFU_BASE}/images?IsNsfw=True&PageSize=30`);
    if (!res.ok) {
      console.error(`Waifu.im API Error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    // Handle either "images" or "items" array in response structure for compatibility
    const pool = data.images || data.items || [];
    if (pool.length === 0) {
      console.warn("Waifu.im API returned an empty pool of images.");
      return [];
    }

    // Deduplicate pool by image ID
    const uniqueMap = new Map<string, any>();
    pool.forEach((item: any) => {
      if (item && item.signature) {
        uniqueMap.set(item.signature, item);
      } else if (item && item.id) {
        uniqueMap.set(String(item.id), item);
      } else if (item && item.url) {
        uniqueMap.set(item.url, item);
      }
    });
    const uniquePool = Array.from(uniqueMap.values());

    // Fisher-Yates Shuffle
    for (let i = uniquePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniquePool[i], uniquePool[j]] = [uniquePool[j], uniquePool[i]];
    }

    // Select target count
    const selected = uniquePool.slice(0, Math.min(count, uniquePool.length));

    const cards: CardData[] = selected.map((item: any): CardData => {
      const favorites = item.favorites ?? 0;
      const rarity = getRarityByFavorites(favorites);
      
      // Calculate rating based on popularity: starts at 7.0 and goes up to 10.0
      const rating = Math.min(10.0, parseFloat((7.0 + favorites / 150 + Math.random() * 1.5).toFixed(1)));

      const artistName = item.artists && item.artists[0]?.name ? item.artists[0].name : "Unknown Artist";
      const primaryTag = item.tags && item.tags[0]?.name ? item.tags[0].name : "waifu";
      const capitalizedTag = primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1);
      
      const name = `${capitalizedTag} by ${artistName}`;
      
      // Extract all tags for a detailed, premium description
      const tagsString = item.tags && item.tags.length > 0
        ? item.tags.map((t: any) => `#${t.name}`).join(" • ")
        : "#nsfw • #waifu";
      
      const description = `${tagsString}${item.width && item.height ? ` • ${item.width}x${item.height}` : ""}`;

      return {
        id: `ero-${item.signature || item.id || Math.random().toString(36).substr(2, 9)}`,
        rarity,
        name,
        description,
        poster: item.url,
        rating,
        imdb_link: item.source || undefined,
        type: "ero" as any,
        // Save dominant color if available, or fall back to fuchsia color style
        platforms: item.dominant_color ? [item.dominant_color] : ["#ff007f"],
      };
    });

    // Sort weakest to strongest card to build opening anticipation and tension
    return cards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
  } catch (e) {
    console.error("Failed to fetch Ero pack:", e);
    return [];
  }
};
