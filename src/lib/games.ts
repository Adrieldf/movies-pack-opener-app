import { CardData, Rarity } from "./tmdb";

const RAWG_BASE_URL = "https://api.rawg.io/api";

const getRarityByRating = (rating10: number): Rarity => {
  if (rating10 >= 9.0) return "Legendary";
  if (rating10 >= 8.2) return "Epic";
  if (rating10 >= 7.2) return "Rare";
  if (rating10 >= 6.0) return "Uncommon";
  if (rating10 <= 1.0) return "Junk";
  return "Common";
};

export const fetchRandomGamePack = async (count: number = 5): Promise<CardData[]> => {
  const apiKey = process.env.NEXT_PUBLIC_RAWG_API_KEY;
  if (!apiKey) {
    console.warn("RAWG API Key missing. Please set NEXT_PUBLIC_RAWG_API_KEY in .env.local");
    return [];
  }

  try {
    const pages = Math.max(1, Math.ceil(count / 10));
    const usedPages = new Set<number>();
    
    while (usedPages.size < pages) {
      const randomPage = Math.floor(Math.random() * 200) + 1;
      usedPages.add(randomPage);
    }

    const responses = await Promise.all(
      Array.from(usedPages).map(page =>
        fetch(`${RAWG_BASE_URL}/games?key=${apiKey}&page=${page}&page_size=20&ordering=-added`) // Changed ordering to get more variety than just constant top-rated
          .then(res => res.ok ? res.json() : { results: [] })
      )
    );

    const allGames = responses.flatMap(data => data.results || []);
    if (allGames.length === 0) return [];

    const uniqueMap = new Map();
    allGames.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    
    const uniquePool = Array.from(uniqueMap.values());

    for (let i = uniquePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniquePool[i], uniquePool[j]] = [uniquePool[j], uniquePool[i]];
    }

    const selectedItems = uniquePool.slice(0, Math.min(count, uniquePool.length));

    const gameCards: CardData[] = selectedItems.map((item: any): CardData => {
      let year: number | undefined;
      if (item.released) {
        year = parseInt(item.released.split('-')[0], 10);
      }

      // RAWG Metacritic is 0-100, item.rating is 0-5. 
      // We prefer Metacritic for "rarity" resolution if available.
      let rating10 = 0;
      if (item.metacritic) {
        rating10 = item.metacritic / 10;
      } else if (item.rating) {
        rating10 = item.rating * 2;
      }

      let trailerUrl = "";
      if (item.clip && item.clip.clip) {
        trailerUrl = item.clip.clip;
      }

      const platformNames = item.parent_platforms?.map((p: any) => p.platform.name) || 
                             item.platforms?.map((p: any) => p.platform.name) || [];

      return {
        id: `game-${item.id}`,
        rarity: getRarityByRating(rating10),
        name: item.name,
        description: item.genres?.map((g: any) => g.name).join(", ") || "A great video game.",
        poster: item.background_image || "",
        rating: rating10,
        trailer: trailerUrl,
        imdb_link: `https://rawg.io/games/${item.slug}`,
        year: year,
        type: "game" as any,
        platforms: platformNames.slice(0, 10) // Include up to 10 platforms
      };
    });

    const rarityOrder: Record<Rarity, number> = {
      Junk: -1,
      Common: 0,
      Uncommon: 1,
      Rare: 2,
      Epic: 3,
      Legendary: 4,
    };

    return gameCards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  } catch (error) {
    console.error("Error fetching RAWG data:", error);
    return [];
  }
};
