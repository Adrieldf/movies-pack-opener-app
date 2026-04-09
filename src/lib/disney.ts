import { CardData, Rarity } from "./tmdb";

const DISNEY_BASE_URL = "https://api.disneyapi.dev";

const getRarityByAppearances = (count: number): Rarity => {
  if (count >= 10) return "Legendary";
  if (count >= 6) return "Epic";
  if (count >= 3) return "Rare";
  if (count >= 2) return "Uncommon";
  if (count === 0) return "Junk";
  return "Common";
};

export const fetchRandomDisneyPack = async (count: number = 5): Promise<CardData[]> => {
  try {
    // Disney API has ~7400 characters, ~150 pages (50 per page usually)
    // We'll pick 3 random pages to get a diverse selection
    const pages = [
      Math.floor(Math.random() * 10) + 1,    // Popular early pages
      Math.floor(Math.random() * 50) + 11,   // Middle range
      Math.floor(Math.random() * 80) + 61    // Deeper cuts
    ];

    const poolPromises = pages.map(p => 
      fetch(`${DISNEY_BASE_URL}/character?page=${p}`).then(r => r.ok ? r.json() : { data: [] })
    );

    const results = await Promise.all(poolPromises);
    const pool = results.flatMap(r => r.data || []);

    if (pool.length === 0) return [];

    // Filter characters without images
    const validPool = pool.filter(char => char.imageUrl);

    // Shuffle pool
    for (let i = validPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validPool[i], validPool[j]] = [validPool[j], validPool[i]];
    }

    const selectedItems = validPool.slice(0, Math.min(count, validPool.length));

    const rarityOrder: Record<Rarity, number> = { Junk: -1, Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 };

    const cards: CardData[] = selectedItems.map((char: any): CardData => {
      const appearances = 
        (char.films?.length || 0) + 
        (char.shortFilms?.length || 0) + 
        (char.tvShows?.length || 0) + 
        (char.videoGames?.length || 0) + 
        (char.parkAttractions?.length || 0);

      const rarity = getRarityByAppearances(appearances);
      
      // Calculate a rating 1-10 based on appearances (maxing out at 15 for a 10)
      const rating = Math.min(10, Math.max(4, (appearances / 15) * 10));

      // Use the first film or show as description
      const source = char.films?.[0] || char.tvShows?.[0] || char.shortFilms?.[0] || "Disney Universe";

      return {
        id: `disney-${char._id}`,
        rarity,
        name: char.name,
        description: source,
        poster: char.imageUrl,
        rating: Number(rating.toFixed(1)),
        type: "disney",
        imdb_link: char.sourceUrl || `https://disney.fandom.com/wiki/${encodeURIComponent(char.name)}`,
      };
    });

    return cards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  } catch (error) {
    console.error("Disney fetch failed:", error);
    return [];
  }
};
