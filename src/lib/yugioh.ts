import { CardData, Rarity } from "./tmdb";

const YUGIOH_BASE_URL = "https://db.ygoprodeck.com/api/v7";

const mapRarity = (rarity: string): Rarity => {
  const r = rarity.toLowerCase();
  if (r.includes("ghost") || r.includes("ultimate") || r.includes("starlight") || r.includes("collector")) return "Legendary";
  if (r.includes("ultra") || r.includes("secret") || r.includes("gold")) return "Legendary";
  if (r.includes("super")) return "Epic";
  if (r.includes("rare") || r.includes("shattered")) return "Rare";
  if (r.includes("short print") || r.includes("special")) return "Uncommon";
  return "Common";
};

// If no rarity found, we assign based on card type/level
const getFallbackRarity = (card: any): Rarity => {
  if (card.type.includes("Fusion") || card.type.includes("Synchro") || card.type.includes("Xyz") || card.type.includes("Link") || card.type.includes("Ritual")) {
    return "Epic";
  }
  if (card.level >= 7) return "Epic";
  if (card.level >= 5) return "Rare";
  if (card.level >= 3) return "Uncommon";
  return "Common";
};

export const fetchRandomYugiohPack = async (count: number = 5): Promise<CardData[]> => {
  try {
    // Single efficient call to get multiple random cards
    const res = await fetch(`${YUGIOH_BASE_URL}/cardinfo.php?num=30&offset=0&sort=random&cachebust=${Date.now()}`);
    if (!res.ok) throw new Error("Yu-Gi-Oh! API fail");
    
    const data = await res.json();
    const pool = data.data || [];
    
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selected = pool.slice(0, Math.min(count, pool.length));

    return selected.map((card: any): CardData => {
      // Find rarity from the first set it appears in
      const setInfo = card.card_sets?.[0];
      const rarityStr = setInfo?.set_rarity || "";
      const rarity = rarityStr ? mapRarity(rarityStr) : getFallbackRarity(card);

      // Create platforms list (Archetype and Type)
      const platforms: string[] = [card.type];
      if (card.race) platforms.push(card.race);
      if (card.archetype) platforms.push(`#${card.archetype}`);

      // Attack/Defense as description if applicable
      const stats = card.atk !== undefined ? `ATK/${card.atk} DEF/${card.def}` : "";
      const description = [stats, card.attribute ? `${card.attribute} Attribute` : "", card.desc].filter(Boolean).join(" • ");

      return {
        id: `yugioh-${card.id}`,
        rarity,
        name: card.name,
        description: description,
        poster: card.card_images?.[0]?.image_url || "",
        rating: card.level ? (card.level / 12) * 10 : 7.0, // Scale level 1-12 to rating 0-10
        type: "yugioh",
        platforms: platforms.slice(0, 3), // Max 3 tags
        year: card.level || 0, // Reuse year for level
        imdb_link: `https://db.ygoprodeck.com/card/?search=${encodeURIComponent(card.name)}`,
      };
    });
  } catch (error) {
    console.error("Yu-Gi-Oh! fetch failed:", error);
    return [];
  }
};
