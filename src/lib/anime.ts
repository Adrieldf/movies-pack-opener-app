import { CardData, Rarity } from "./tmdb";

const JIKAN_BASE_URL = "https://api.jikan.moe/v4";
const REQUEST_DELAY_MS = 400; // Jikan allows ~3 req/sec, stay safely under that
const MAX_RETRIES = 2;

const getRarityByFavorites = (favs: number): Rarity => {
  if (favs > 50000) return "Legendary";
  if (favs > 15000) return "Epic";
  if (favs > 5000) return "Rare";
  if (favs > 1000) return "Uncommon";
  if (favs < 100) return "Junk";
  return "Common";
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with retry/backoff so a single rate-limited (429) request doesn't
// starve the rest of the pack of cards.
const fetchJson = async (url: string): Promise<any> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      if (res.status === 429) {
        await sleep(REQUEST_DELAY_MS * (attempt + 2));
        continue;
      }
      return null;
    } catch {
      await sleep(REQUEST_DELAY_MS * (attempt + 2));
    }
  }
  return null;
};

export const fetchRandomAnimePack = async (count: number = 5): Promise<CardData[]> => {
  try {
    // 1. Fetch several random pages of top anime to build a large candidate pool,
    // so failed/empty lookups later don't leave us short on cards.
    const pagesToFetch = [
      Math.floor(Math.random() * 5) + 1,
      Math.floor(Math.random() * 15) + 6,
      Math.floor(Math.random() * 20) + 21,
    ];

    const animePool: any[] = [];
    for (const page of pagesToFetch) {
      const data = await fetchJson(`${JIKAN_BASE_URL}/top/anime?page=${page}`);
      if (data?.data?.length) animePool.push(...data.data);
      await sleep(REQUEST_DELAY_MS);
    }

    if (animePool.length === 0) return [];

    // Dedupe anime by mal_id, then shuffle
    const uniqueAnimeMap = new Map<number, any>();
    animePool.forEach(a => { if (!uniqueAnimeMap.has(a.mal_id)) uniqueAnimeMap.set(a.mal_id, a); });
    const uniqueAnime = Array.from(uniqueAnimeMap.values());
    for (let i = uniqueAnime.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueAnime[i], uniqueAnime[j]] = [uniqueAnime[j], uniqueAnime[i]];
    }

    // 2. Walk the whole shuffled pool (not just count*2) until we have `count`
    // cards, so individual failures don't leave the pack short.
    const characterCards: CardData[] = [];
    const usedCharacterIds = new Set<number>();

    for (const anime of uniqueAnime) {
      if (characterCards.length >= count) break;

      const charData = await fetchJson(`${JIKAN_BASE_URL}/anime/${anime.mal_id}/characters`);
      await sleep(REQUEST_DELAY_MS);
      if (!charData) continue;

      const characters = charData.data || [];
      const mainChars = characters.filter((c: any) => c.role === "Main");
      const pool = (mainChars.length > 0 ? mainChars : characters)
        .filter((c: any) => !usedCharacterIds.has(c.character?.mal_id));

      if (pool.length === 0) continue;

      const charEntry = pool[Math.floor(Math.random() * pool.length)];
      const char = charEntry.character;
      usedCharacterIds.add(char.mal_id);

      const animeScore = anime.score || 7.0;
      const favorites = anime.favorites || 0;
      const rarity = getRarityByFavorites(favorites);

      characterCards.push({
        id: `anime-char-${char.mal_id}`,
        rarity: rarity,
        name: char.name,
        description: `${charEntry.role} character in ${anime.title}`,
        poster: char.images?.jpg?.image_url || anime.images?.jpg?.image_url || "",
        rating: Number(animeScore.toFixed(1)),
        type: "anime",
        imdb_link: char.url,
      });
    }

    return characterCards;
  } catch (e) {
    console.error("Anime fetch failed:", e);
    return [];
  }
};
