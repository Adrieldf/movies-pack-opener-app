import { CardData, Rarity } from "./tmdb";
import { BGG_TOP_500 } from "./boardgames-data";

/**
 * BGG rating scale:
 *  ≥ 8.5 → Legendary  (elite, cult classics)
 *  ≥ 8.0 → Epic
 *  ≥ 7.6 → Rare
 *  ≥ 7.3 → Uncommon
 *  ≥ 7.0 → Common
 *  < 7.0 → Junk
 */
const getRarityByBGGRating = (rating: number): Rarity => {
  if (rating >= 8.5) return "Legendary";
  if (rating >= 8.0) return "Epic";
  if (rating >= 7.6) return "Rare";
  if (rating >= 7.3) return "Uncommon";
  if (rating >= 7.0) return "Common";
  return "Junk";
};

const rarityOrder: Record<Rarity, number> = {
  Junk: -1,
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
};

export const fetchRandomBoardGamePack = async (
  count: number = 5
): Promise<CardData[]> => {
  // Pool: use all 500 games — shuffle and pick `count` random ones
  const pool = [...BGG_TOP_500];

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, Math.min(count, pool.length));

  const cards: CardData[] = selected.map((g) => ({
    id: `boardgame-${g.id}`,
    rarity: getRarityByBGGRating(g.rating),
    name: g.name,
    description: `A highly-rated board game published in ${g.year}. Rated ${g.rating.toFixed(2)}/10 by ${g.voters.toLocaleString()} players on BoardGameGeek. BGG Rank #${g.rank}.`,
    poster: g.poster,
    rating: parseFloat((g.rating).toFixed(2)),
    imdb_link: `https://boardgamegeek.com${g.bggUrl}`,
    year: g.year,
    type: "boardgame",
  }));

  // Sort: weakest first, strongest last (for dramatic reveal)
  return cards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
};
