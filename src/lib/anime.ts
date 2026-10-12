import { CardData, Rarity } from "./tmdb";

const ANILIST_URL = "https://graphql.anilist.co";
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 2;
const PAGE_SIZE = 25;

const getRarityByFavorites = (favs: number): Rarity => {
  if (favs > 50000) return "Legendary";
  if (favs > 15000) return "Epic";
  if (favs > 5000) return "Rare";
  if (favs > 1000) return "Uncommon";
  if (favs < 100) return "Junk";
  return "Common";
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MEDIA_FIELDS = `
  media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
    id
    title { romaji english }
    averageScore
    favourites
    coverImage { large }
    characters(role: MAIN, perPage: 10) {
      edges { node { id name { full } image { large } siteUrl } }
    }
  }
`;

// Three pages of top anime in a single request, so the whole pack costs one
// call against AniList's rate limit.
const PACK_QUERY = `
  query ($a: Int, $b: Int, $c: Int) {
    a: Page(page: $a, perPage: ${PAGE_SIZE}) { ${MEDIA_FIELDS} }
    b: Page(page: $b, perPage: ${PAGE_SIZE}) { ${MEDIA_FIELDS} }
    c: Page(page: $c, perPage: ${PAGE_SIZE}) { ${MEDIA_FIELDS} }
  }
`;

// Fetch with retry/backoff so a single rate-limited (429) request doesn't
// cost the whole pack.
const fetchAniList = async (variables: Record<string, number>): Promise<any> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(ANILIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: PACK_QUERY, variables }),
      });
      if (res.ok) return (await res.json())?.data ?? null;
      if (res.status !== 429) return null;
    } catch {
      // network error, retry below
    }
    await sleep(RETRY_DELAY_MS * (attempt + 1));
  }
  return null;
};

export const fetchRandomAnimePack = async (count: number = 5): Promise<CardData[]> => {
  try {
    // 1. Fetch several random pages of top anime to build a large candidate pool
    const data = await fetchAniList({
      a: Math.floor(Math.random() * 5) + 1,
      b: Math.floor(Math.random() * 15) + 6,
      c: Math.floor(Math.random() * 20) + 21,
    });
    if (!data) return [];

    const animePool: any[] = [...(data.a?.media || []), ...(data.b?.media || []), ...(data.c?.media || [])];
    if (animePool.length === 0) return [];

    // Dedupe anime by id, then shuffle
    const uniqueAnimeMap = new Map<number, any>();
    animePool.forEach(a => { if (!uniqueAnimeMap.has(a.id)) uniqueAnimeMap.set(a.id, a); });
    const uniqueAnime = Array.from(uniqueAnimeMap.values());
    for (let i = uniqueAnime.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueAnime[i], uniqueAnime[j]] = [uniqueAnime[j], uniqueAnime[i]];
    }

    // 2. Take one main character per anime, walking the pool again for big
    // packs until we have `count` cards or run out of unused characters.
    const characterCards: CardData[] = [];
    const usedCharacterIds = new Set<number>();

    while (characterCards.length < count) {
      const before = characterCards.length;

      for (const anime of uniqueAnime) {
        if (characterCards.length >= count) break;

        const pool = (anime.characters?.edges || [])
          .map((e: any) => e.node)
          .filter((c: any) => c && !usedCharacterIds.has(c.id));

        if (pool.length === 0) continue;

        const char = pool[Math.floor(Math.random() * pool.length)];
        usedCharacterIds.add(char.id);

        const animeScore = anime.averageScore ? anime.averageScore / 10 : 7.0;
        const favorites = anime.favourites || 0;
        const rarity = getRarityByFavorites(favorites);

        characterCards.push({
          id: `anilist-char-${char.id}`,
          rarity: rarity,
          name: char.name?.full || "Unknown",
          description: `Main character in ${anime.title?.romaji || anime.title?.english || "Unknown"}`,
          poster: char.image?.large || anime.coverImage?.large || "",
          rating: Number(animeScore.toFixed(1)),
          type: "anime",
          imdb_link: char.siteUrl,
        });
      }

      if (characterCards.length === before) break;
    }

    return characterCards;
  } catch (e) {
    console.error("Anime fetch failed:", e);
    return [];
  }
};
