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
    // 1. Fetch random pages of top anime to get a variety of series
    const animePages = [
      Math.floor(Math.random() * 5) + 1,   // Top tier
      Math.floor(Math.random() * 15) + 6,  // Mid tier
    ];

    const animePoolPromises = animePages.map(p => 
      fetch(`${JIKAN_BASE_URL}/top/anime?page=${p}`).then(r => r.ok ? r.json() : { data: [] })
    );
    
    const animeResults = await Promise.all(animePoolPromises);
    const animePool = animeResults.flatMap(r => r.data || []);

    if (animePool.length === 0) return [];

    // Shuffle anime pool
    for (let i = animePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [animePool[i], animePool[j]] = [animePool[j], animePool[i]];
    }

    // 2. Pick unique anime and fetch their characters
    const selectedAnime = animePool.slice(0, Math.min(count * 2, animePool.length));
    const characterCards: CardData[] = [];

    // Jikan has a rate limit (3 req/sec), so we fetch with small delays
    for (const anime of selectedAnime) {
      if (characterCards.length >= count) break;

      try {
        // Fetch characters for this specific anime
        const charRes = await fetch(`${JIKAN_BASE_URL}/anime/${anime.mal_id}/characters`);
        if (!charRes.ok) continue;

        const charData = await charRes.json();
        const characters = charData.data || [];
        
        // Prefer "Main" characters first, then "Supporting"
        const mainChars = characters.filter((c: any) => c.role === "Main");
        const pool = mainChars.length > 0 ? mainChars : characters;
        
        if (pool.length > 0) {
          const charEntry = pool[Math.floor(Math.random() * pool.length)];
          const char = charEntry.character;
          
          // Use anime popularity/rating to influence card rating
          const animeScore = anime.score || 7.0;
          const favorites = anime.favorites || 0;
          const rarity = getRarityByFavorites(favorites);

          characterCards.push({
            id: `anime-char-${char.mal_id}`,
            rarity: rarity,
            name: char.name,
            description: `${charEntry.role} character in ${anime.title}`, // Role + Anime Name
            poster: char.images?.jpg?.image_url || anime.images?.jpg?.image_url || "",
            rating: Number(animeScore.toFixed(1)),
            type: "anime",
            imdb_link: char.url,
          });

          // Small sleep to respect rate limit (3 requests per second)
          if (characterCards.length < count) {
            await new Promise(resolve => setTimeout(resolve, 350));
          }
        }
      } catch (e) {
        console.error(`Failed to fetch characters for anime ${anime.mal_id}`, e);
      }
    }

    return characterCards;
  } catch (e) {
    console.error("Anime fetch failed:", e);
    return [];
  }
};
