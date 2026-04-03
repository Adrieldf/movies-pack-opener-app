import { CardData, Rarity } from "./tmdb";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

const getRarityByFavorites = (favs: number): Rarity => {
  if (favs > 50000) return "Legendary";
  if (favs > 15000) return "Epic";
  if (favs > 5000) return "Rare";
  if (favs > 1000) return "Uncommon";
  if (favs < 100) return "Junk";
  return "Common";
};

export const fetchRandomAnimePack = async (count: number = 5): Promise<CardData[]> => {
  try {
    // We fetch from multiple different popularities to get a diverse pool
    // Page 1-3 = God Tier (Legendary/Epic)
    // Page 10-25 = Mid Tier (Epic/Rare)
    // Page 40-100 = Lower Tier (Rare/Uncommon/Common)
    const pages = [
      Math.floor(Math.random() * 3) + 1,
      Math.floor(Math.random() * 15) + 10,
      Math.floor(Math.random() * 60) + 40
    ];

    const poolPromises = pages.map(p => 
      fetch(`${JIKAN_BASE_URL}/top/characters?page=${p}`).then(r => r.ok ? r.json() : { data: [] })
    );
    
    const results = await Promise.all(poolPromises);
    const pool = results.flatMap(r => r.data || []);

    if (pool.length === 0) return [];

    // Shuffle and pick
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selectedItems = pool.slice(0, Math.min(count, pool.length));

    return selectedItems.map((char: any): CardData => {
      const favorites = char.favorites || 0;
      const rating = Math.min(10, Math.max(1, (Math.log10(favorites + 1) / 5) * 10));

      return {
        id: `anime-${char.mal_id}`,
        rarity: getRarityByFavorites(favorites),
        name: char.name,
        description: "", // Description removed per request
        poster: char.images?.jpg?.image_url || "",
        rating: Number(rating.toFixed(1)),
        type: "anime",
        imdb_link: char.url,
      };
    });
  } catch (e) {
    console.error(e);
    return [];
  }
};
