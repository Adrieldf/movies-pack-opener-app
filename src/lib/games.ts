import { CardData, Rarity } from "./tmdb";

const getRarityByRating = (rating10: number): Rarity => {
  if (rating10 >= 9.0) return "Legendary";
  if (rating10 >= 8.2) return "Epic";
  if (rating10 >= 7.2) return "Rare";
  if (rating10 >= 6.0) return "Uncommon";
  if (rating10 <= 2.5) return "Junk";
  return "Common";
};

const rarityOrder: Record<Rarity, number> = {
  Junk: -1,
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
};

export const fetchRandomGamePack = async (count: number = 5): Promise<CardData[]> => {
  const fetchedCards: CardData[] = [];

  // Attempt 1: Fetch from FreeToGame API
  try {
    const res = await fetch("https://www.freetogame.com/api/games", {
      headers: { "User-Agent": "MoviesPackOpenerApp/1.0" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));

        selected.forEach((item: any) => {
          const year = item.release_date ? parseInt(item.release_date.split("-")[0], 10) : undefined;
          const rating10 = parseFloat((6.5 + Math.random() * 2.3).toFixed(1));

          fetchedCards.push({
            id: `f2g-${item.id}`,
            rarity: getRarityByRating(rating10),
            name: item.title,
            description: item.short_description || item.genre || "Free-to-Play Video Game",
            poster: item.thumbnail || "",
            rating: rating10,
            imdb_link: item.freetogame_profile_url || item.game_url || `https://www.freetogame.com/${item.title}`,
            year: isNaN(year!) ? undefined : year,
            type: "game",
            platforms: item.platform ? item.platform.split(",").map((p: string) => p.trim()) : ["PC"],
          });
        });
      }
    }
  } catch (err) {
    console.warn("FreeToGame API fetch failed:", err);
  }

  // Attempt 2: If we still need more cards, fill from CheapShark API
  if (fetchedCards.length < count) {
    try {
      const res = await fetch("https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=60", {
        headers: { "User-Agent": "MoviesPackOpenerApp/1.0" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          for (const item of shuffled) {
            if (fetchedCards.length >= count * 2) break;
            const metacritic = item.metacriticScore ? parseInt(item.metacriticScore, 10) : 0;
            const rating10 = metacritic > 0 ? metacritic / 10 : parseFloat((item.dealRating || 7.0).toString());
            const year = item.releaseDate ? new Date(item.releaseDate * 1000).getFullYear() : undefined;
            const steamId = item.steamAppID && item.steamAppID !== "0" && item.steamAppID !== null ? item.steamAppID : null;
            let poster = item.thumb ? item.thumb.replace(/^http:/, "https:") : "";
            if (steamId) {
              poster = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamId}/library_600x900_2x.jpg`;
            }

            fetchedCards.push({
              id: `cs-${item.gameID || item.dealID}`,
              rarity: getRarityByRating(rating10),
              name: item.title,
              description: `Metacritic: ${metacritic > 0 ? metacritic : 'N/A'} • Steam Rating: ${item.steamRatingText || 'Positive'}`,
              poster: poster,
              rating: parseFloat(rating10.toFixed(1)),
              imdb_link: steamId ? `https://store.steampowered.com/app/${steamId}/` : item.dealID ? `https://www.cheapshark.com/redirect?dealID=${item.dealID}` : "https://store.steampowered.com/",
              year: year,
              type: "game",
              platforms: ["PC"],
            });
          }
        }
      }
    } catch (err) {
      console.warn("CheapShark API fetch failed:", err);
    }
  }

  // Shuffle fetched cards
  for (let i = fetchedCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fetchedCards[i], fetchedCards[j]] = [fetchedCards[j], fetchedCards[i]];
  }

  // Ensure unique IDs
  const uniqueMap = new Map<string, CardData>();
  fetchedCards.forEach((card) => {
    if (!uniqueMap.has(card.id) && !uniqueMap.has(card.name)) {
      uniqueMap.set(card.id, card);
    }
  });

  const finalCards = Array.from(uniqueMap.values()).slice(0, count);

  if (finalCards.length === 0) {
    throw new Error("No game cards could be fetched from any API.");
  }

  // Sort weakest to strongest for dramatic card opening reveal
  return finalCards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
};
