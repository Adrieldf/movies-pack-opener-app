import { CardData, Rarity } from "./tmdb";

const API_BASE = "https://dragonball-api.com/api";

let dbzCache: any[] | null = null;

async function fetchDragonBallData() {
  if (dbzCache) return;

  try {
    const res = await fetch(`${API_BASE}/characters?limit=100`);
    const data = await res.json();
    dbzCache = data.items || [];
  } catch (error) {
    console.error("Error fetching dragon ball data", error);
    dbzCache = [];
  }
}

function parseKi(kiStr: string): number {
  if (!kiStr || kiStr === "unknown") return 0;
  let valStr = kiStr.toLowerCase().replace(/\./g, "").replace(/,/g, "").trim();
  let multiplier = 1;
  if (valStr.includes("googolplex")) multiplier = 1e100;
  else if (valStr.includes("septillion")) multiplier = 1e24;
  else if (valStr.includes("sextillion")) multiplier = 1e21;
  else if (valStr.includes("quintillion")) multiplier = 1e18;
  else if (valStr.includes("quadrillion")) multiplier = 1e15;
  else if (valStr.includes("trillion")) multiplier = 1e12;
  else if (valStr.includes("billion")) multiplier = 1e9;
  else if (valStr.includes("million")) multiplier = 1e6;
  
  valStr = valStr.replace(/[a-z]/g, "").trim();
  const num = parseFloat(valStr);
  if (isNaN(num)) return 0;
  return num * multiplier;
}

function getRarityFromKi(ki: number): Rarity {
  if (ki >= 1e12) return "Legendary"; // Trillion+
  if (ki >= 1e9) return "Epic"; // Billion+
  if (ki >= 50_000_000) return "Rare"; // 50m+
  if (ki >= 500_000) return "Uncommon";
  if (ki > 0) return "Common";
  return "Junk"; // 0 or unknown
}

export async function fetchRandomDragonBallPack(size: number = 5): Promise<CardData[]> {
  try {
    await fetchDragonBallData();

    if (!dbzCache || dbzCache.length === 0) return [];

    const shuffled = [...dbzCache].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, size);

    return selected.map(item => {
      const kiValue = parseKi(item.ki);
      const rarity = getRarityFromKi(kiValue);
      
      const platforms = [];
      if (item.race) platforms.push(item.race.toUpperCase());
      if (item.affiliation) platforms.push(item.affiliation.toUpperCase());
      if (item.ki && item.ki !== "unknown") platforms.push(`KI: ${item.ki.toUpperCase()}`);

      return {
        id: `dbz-${item.id}`,
        name: item.name,
        poster: item.image || "",
        type: "dragonball",
        rarity,
        rating: 0, // No rating
        description: item.description || "",
        platforms,
      } as CardData;
    });
  } catch (err) {
    console.error("Dragon Ball fetch error", err);
    return [];
  }
}
