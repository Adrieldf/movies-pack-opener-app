import { CardData, Rarity } from "./tmdb";

const DIGI_API_BASE_URL = "https://digi-api.com/api/v1/digimon";

// Rarity based on Digimon level
const getRarityByLevel = (levels: { id: number; level: string }[]): Rarity => {
  if (!levels || levels.length === 0) return "Common";

  const levelNames = levels.map(l => l.level.toLowerCase());
  
  if (levelNames.includes("super ultimate") || levelNames.includes("ultra")) return "Legendary";
  if (levelNames.includes("ultimate") || levelNames.includes("mega")) return "Epic";
  if (levelNames.includes("perfect")) return "Rare";
  if (levelNames.includes("adult") || levelNames.includes("champion") || levelNames.includes("armor")) return "Uncommon";
  if (levelNames.includes("child") || levelNames.includes("rookie")) return "Common";
  if (levelNames.includes("baby") || levelNames.includes("in-training")) return "Junk";

  return "Common";
};

export const fetchRandomDigimonPack = async (count: number = 5): Promise<CardData[]> => {
  try {
    const totalPages = 297; // From API currently
    const randomPages = Array.from({ length: Math.ceil(count / 2) + 1 }, () => Math.floor(Math.random() * totalPages));
    
    // Fetch random pages
    const pageResponses = await Promise.all(
      randomPages.map(page => 
        fetch(`${DIGI_API_BASE_URL}?page=${page}`).then(res => res.ok ? res.json() : { content: [] })
      )
    );

    const allSummaries = pageResponses.flatMap(data => data.content || []);
    if (allSummaries.length === 0) return [];

    // Deduplicate
    const uniqueMap = new Map();
    allSummaries.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    let uniquePool = Array.from(uniqueMap.values());

    // Shuffle
    for (let i = uniquePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniquePool[i], uniquePool[j]] = [uniquePool[j], uniquePool[i]];
    }

    // Select exactly count
    const selectedSummaries = uniquePool.slice(0, Math.min(count, uniquePool.length));

    // Fetch full details for the selected Digimons
    const enrichedItems: CardData[] = await Promise.all(
      selectedSummaries.map(async (item: any): Promise<CardData> => {
        try {
          const res = await fetch(`${DIGI_API_BASE_URL}/${item.id}`);
          if (!res.ok) throw new Error("Failed to fetch details");
          const details = await res.json();
          
          let description = details.descriptions?.find((d: any) => d.language === "en_us")?.description || 
                            details.descriptions?.[0]?.description || 
                            "A mysterious Digital Monster.";

          let attribute = details.attributes?.[0]?.attribute;
          if (attribute) {
             description = `Attribute: ${attribute}. ${description}`;
          }

          let typeStr = details.types?.[0]?.type;
          if (typeStr) {
             description = `Type: ${typeStr}. ${description}`;
          }

          return {
            id: `digimon-${details.id}`,
            rarity: getRarityByLevel(details.levels || []),
            name: details.name,
            description: description,
            poster: details.images?.[0]?.href || item.image || "",
            rating: details.id % 10, // Just a pseudo-random rating based on ID, since Digimon don't have user ratings
            type: "digimon",
            platforms: details.types?.map((t: any) => t.type) || [], // Put types in platforms for display
            year: details.releaseDate ? parseInt(details.releaseDate.split("-")[0], 10) : undefined,
          };
        } catch (e) {
          console.error(e);
          return {
            id: `digimon-${item.id}`,
            rarity: "Common",
            name: item.name,
            description: "A mysterious Digital Monster.",
            poster: item.image || "",
            rating: 0,
            type: "digimon",
          };
        }
      })
    );

    // Sort by rarity
    const rarityOrder: Record<Rarity, number> = {
      Junk: -1,
      Common: 0,
      Uncommon: 1,
      Rare: 2,
      Epic: 3,
      Legendary: 4,
    };

    return enrichedItems.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  } catch (error) {
    console.error("Error fetching Digimon pack:", error);
    return [];
  }
};
