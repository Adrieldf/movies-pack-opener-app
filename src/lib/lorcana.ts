import { CardData, Rarity } from "./tmdb";

const LORCANA_API_URL = "https://api.lorcana-api.com/cards/fetch";

interface LorcanaCard {
  Name: string;
  Set_Name: string;
  Cost?: number;
  Inkable?: boolean;
  Type: string;
  Lore?: number;
  Rarity: string;
  Unique_ID: string;
  Image?: string;
  Color?: string;
  Franchise?: string;
  Flavor_Text?: string;
  Body_Text?: string;
}

let cachedLorcanaCards: LorcanaCard[] | null = null;

async function fetchAllLorcanaCards(): Promise<LorcanaCard[]> {
  if (cachedLorcanaCards) return cachedLorcanaCards;
  
  try {
    const res = await fetch(LORCANA_API_URL, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch Lorcana cards");
    }
    
    const data = await res.json();
    cachedLorcanaCards = data;
    return data;
  } catch (error) {
    console.error("Error fetching Lorcana cards:", error);
    return [];
  }
}

function getRarityFromLorcana(rarity: string): Rarity {
  const r = (rarity || "").toLowerCase();
  if (r.includes("enchanted") || r.includes("legendary")) return "Legendary";
  if (r.includes("super rare")) return "Epic";
  if (r.includes("rare")) return "Rare";
  if (r.includes("uncommon")) return "Uncommon";
  return "Common"; // Default
}

export async function fetchRandomLorcanaPack(size: number = 5): Promise<CardData[]> {
  const allCards = await fetchAllLorcanaCards();
  if (!allCards || allCards.length === 0) return [];
  
  const validCards = allCards.filter(c => c.Image); // Only cards with images
  
  // Randomly select `size` cards
  const selectedCards: LorcanaCard[] = [];
  const usedIndices = new Set<number>();
  
  while (selectedCards.length < size && usedIndices.size < validCards.length) {
    const idx = Math.floor(Math.random() * validCards.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      selectedCards.push(validCards[idx]);
    }
  }

  return selectedCards.map((c) => {
    return {
      id: c.Unique_ID,
      name: c.Name,
      poster: c.Image || "",
      type: "lorcana",
      rarity: getRarityFromLorcana(c.Rarity || ""),
      rating: 0,
      description: c.Flavor_Text || c.Body_Text || c.Set_Name,
      platforms: c.Color ? c.Color.split(", ") : [],
    };
  });
}
