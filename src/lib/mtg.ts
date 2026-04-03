import { CardData, Rarity } from "./tmdb";

const SCRYFALL_BASE_URL = "https://api.scryfall.com";

const getRarityFromMtg = (rarity: string): Rarity => {
  switch (rarity) {
    case "mythic": return "Legendary";
    case "rare": return "Epic";
    case "uncommon": return "Rare";
    case "common": return "Common";
    default: return "Common";
  }
};

export const fetchRandomMtgPack = async (count: number = 5): Promise<CardData[]> => {
  try {
    // Scryfall allows a search with random sort. We use is:firstprinting to avoid too much duplicate art
    const res = await fetch(`${SCRYFALL_BASE_URL}/cards/search?q=is:firstprinting+is:nonfoil&order=random`);
    if (!res.ok) throw new Error("Magic: The Gathering API fetch failed");
    
    const data = await res.json();
    const pool = data.data || [];
    
    // Shuffle and pick requested amount
    const poolCopy = [...pool];
    for (let i = poolCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
    }

    const selected = poolCopy.slice(0, Math.min(count, poolCopy.length));

    return selected.map((card: any): CardData => {
      // For double-faced cards, Scryfall puts images in card_faces
      const poster = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "";
      
      return {
        id: `mtg-${card.id}`,
        rarity: getRarityFromMtg(card.rarity),
        name: card.name,
        description: "", // Minimalist look as requested
        poster,
        rating: card.edhrec_rank ? Number((10 - (card.edhrec_rank / 30000) * 10).toFixed(1)) : 7.0,
        type: "mtg",
        year: card.released_at ? parseInt(card.released_at.substring(0, 4)) : 0,
        imdb_link: card.scryfall_uri,
      };
    });
  } catch (e) {
    console.error("MTG Fetch Error:", e);
    return [];
  }
};
