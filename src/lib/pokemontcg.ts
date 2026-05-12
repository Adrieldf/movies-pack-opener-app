import { CardData, Rarity } from "./tmdb";

const API_URL = "https://api.pokemontcg.io/v2/cards";

function getRarityFromPokemonTcg(rarityStr?: string): Rarity {
  if (!rarityStr) return "Common";
  const lower = rarityStr.toLowerCase();
  
  if (lower.includes("secret") || lower.includes("hyper") || lower.includes("rainbow") || lower.includes("gold") || lower.includes("vmax") || lower.includes("vstar")) return "Legendary";
  if (lower.includes("ultra") || lower.includes("amazing") || lower.includes("v") || lower.includes("ex") || lower.includes("gx")) return "Epic";
  if (lower.includes("rare holo") || lower.includes("radiant")) return "Epic";
  if (lower.includes("rare")) return "Rare";
  if (lower.includes("uncommon")) return "Uncommon";
  return "Common";
}

export async function fetchRandomPokemonTcgPack(size: number = 5): Promise<CardData[]> {
  // Pick a random page out of ~250
  const randomPage = Math.floor(Math.random() * 250) + 1;
  const url = `${API_URL}?page=${randomPage}&pageSize=50`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      throw new Error("Failed to fetch Pokemon TCG");
    }

    const data = await res.json();
    const allCards: any[] = data.data || [];
    
    const validCards = allCards.filter(c => c.images?.large || c.images?.small);
    const shuffled = [...validCards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, size);

    return selected.map((c) => ({
      id: `ptcg-${c.id}`,
      name: c.name,
      poster: c.images?.large || c.images?.small || "",
      type: "pokemontcg",
      rarity: getRarityFromPokemonTcg(c.rarity),
      rating: 0,
      description: c.flavorText || c.rules?.[0] || "",
    } as CardData));
  } catch (error) {
    console.error("Pokemon TCG API Error:", error);
    return [];
  }
}
