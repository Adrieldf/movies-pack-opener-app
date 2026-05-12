import { CardData, Rarity } from "./tmdb";

const REST_COUNTRIES_API = "https://restcountries.com/v3.1/all?fields=name,flags,population,region,capital,cca3";

interface RestCountry {
  name: { common: string; official: string };
  flags: { png: string; svg: string; alt?: string };
  population: number;
  region: string;
  capital: string[];
  cca3: string;
}

let cachedCountries: RestCountry[] | null = null;

async function fetchAllCountries(): Promise<RestCountry[]> {
  if (cachedCountries) return cachedCountries;

  try {
    const res = await fetch(REST_COUNTRIES_API, {
      next: { revalidate: 86400 } // Cache for 1 day
    });

    if (!res.ok) {
      throw new Error("Failed to fetch countries");
    }

    const data = await res.json();
    cachedCountries = data;
    return data;
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
}

function getRarityByPopulation(population: number): Rarity {
  if (population > 100_000_000) return "Legendary";
  if (population > 30_000_000) return "Epic";
  if (population > 10_000_000) return "Rare";
  if (population > 1_000_000) return "Uncommon";
  return "Common";
}

function getRatingByPopulation(population: number): number {
  // Normalize population to a 1.0 - 10.0 scale roughly
  if (population > 1_000_000_000) return 9.9;
  if (population > 100_000_000) return 8.5 + (population / 1_000_000_000);
  if (population > 10_000_000) return 7.0 + (population / 100_000_000);
  if (population > 1_000_000) return 5.0 + (population / 10_000_000);
  return 3.0 + (population / 1_000_000);
}

export async function fetchRandomCountriesPack(size: number = 5): Promise<CardData[]> {
  const allCountries = await fetchAllCountries();
  if (!allCountries || allCountries.length === 0) return [];

  const selected: RestCountry[] = [];
  const usedIndices = new Set<number>();

  while (selected.length < size && usedIndices.size < allCountries.length) {
    const idx = Math.floor(Math.random() * allCountries.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      selected.push(allCountries[idx]);
    }
  }

  return selected.map((c) => {
    return {
      id: `country-${c.cca3}`,
      name: c.name.common,
      poster: c.flags.png || c.flags.svg || "",
      type: "country",
      rarity: getRarityByPopulation(c.population),
      rating: Number(getRatingByPopulation(c.population).toFixed(1)),
      description: `Capital: ${c.capital?.[0] || "N/A"}\nRegion: ${c.region}\nPopulation: ${c.population.toLocaleString()}`,
      platforms: [c.region], // Use platforms array to store region tag
    } as CardData;
  });
}
