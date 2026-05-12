import { CardData, Rarity } from "./tmdb";

const API_BASE = "https://ghibliapi.vercel.app";

let filmsCache: any[] | null = null;

async function fetchGhibliData() {
  if (filmsCache) return;

  try {
    const films = await fetch(`${API_BASE}/films`).then(r => r.json());

    filmsCache = films;
  } catch (error) {
    console.error("Error fetching ghibli data", error);
  }
}

export async function fetchRandomGhibliPack(size: number = 5): Promise<CardData[]> {
  try {
    await fetchGhibliData();

    const allItems: any[] = [
      ...(filmsCache || []).map(f => ({ ...f, itemType: "film" }))
    ];

    const shuffled = [...allItems].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, size);

    return selected.map(item => {
      let title = item.title || item.name;
      let poster = "";
      let rarity: Rarity = "Common";
      let rating = parseFloat(item.rt_score || "0") / 10;
      let platforms: string[] = [];
      let description = item.description || "";

      if (item.itemType === "film") {
        poster = item.image || "";
        // Let's adjust rarity based on score or just keep legendary
        rarity = rating >= 9.0 ? "Legendary" : rating >= 8.0 ? "Epic" : rating >= 7.0 ? "Rare" : "Uncommon";
        platforms = ["FILM", item.release_date];
      }

      return {
        id: `ghibli-${item.id}`,
        name: title,
        poster,
        type: "ghibli",
        rarity,
        rating,
        description,
        platforms,
        year: item.release_date ? parseInt(item.release_date, 10) : undefined,
      } as CardData;
    });
  } catch (err) {
    console.error("Ghibli fetch error", err);
    return [];
  }
}
