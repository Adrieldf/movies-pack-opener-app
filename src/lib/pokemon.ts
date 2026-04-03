import { CardData, Rarity } from "./tmdb";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const TOTAL_POKEMON = 1025; // Gen 1-9 (Scarlet/Violet)

const rarityOrder: Record<Rarity, number> = {
  Junk: -1, Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4,
};

/** Rarity based on sum of all base stats (max ≈ 780 for Arceus/Eternatus) */
const getRarityByBaseStats = (total: number): Rarity => {
  if (total >= 600) return "Legendary";  // True legendaries / pseudo-legends
  if (total >= 500) return "Epic";       // Strong stage-3 / rare forms
  if (total >= 400) return "Rare";       // Mid-stage evolutions
  if (total >= 300) return "Uncommon";   // Basic evolved Pokémon
  if (total <= 200) return "Junk";       // Very weak base-stage Pokémon
  return "Common";
};

/** Scale base-stat total (roughly 175–780) → 0–10 rating */
const ratingFromStats = (total: number): number =>
  Math.min(10, Math.max(0, ((total - 175) / (780 - 175)) * 10));

export const fetchRandomPokemonPack = async (count: number = 5): Promise<CardData[]> => {
  try {
    // Pick `count * 3` random IDs so we have a good pool to shuffle from
    const poolSize = Math.min(count * 3, 30);
    const ids = new Set<number>();
    while (ids.size < poolSize) {
      ids.add(Math.floor(Math.random() * TOTAL_POKEMON) + 1);
    }

    // Fetch all Pokémon in parallel
    const results = await Promise.allSettled(
      Array.from(ids).map(id =>
        fetch(`${POKEAPI_BASE}/pokemon/${id}`).then(r => r.ok ? r.json() : null)
      )
    );

    const pool = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value != null)
      .map(r => r.value);

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selected = pool.slice(0, Math.min(count, pool.length));

    const cards: CardData[] = selected.map((poke: any): CardData => {
      const baseTotal: number = (poke.stats as any[]).reduce((sum: number, s: any) => sum + s.base_stat, 0);
      const rarity = getRarityByBaseStats(baseTotal);
      const rating = parseFloat(ratingFromStats(baseTotal).toFixed(1));

      // Prefer the official artwork, fall back to the default sprite
      const poster: string =
        poke.sprites?.other?.["official-artwork"]?.front_default ||
        poke.sprites?.front_default ||
        "";

      // Type tags as "platforms" so they appear on the card
      const types: string[] = (poke.types as any[]).map((t: any) => t.type.name as string);

      // Capitalise name
      const name: string = poke.name
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return {
        id: `pokemon-${poke.id}`,
        rarity,
        name,
        description: `#${String(poke.id).padStart(4, "0")} • ${types.join(" / ")} • BST ${baseTotal}`,
        poster,
        rating,
        imdb_link: `https://www.pokemon.com/us/pokedex/${poke.name}`,
        type: "pokemon" as any,
        platforms: types.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)),
        year: poke.id,            // reuse year field for Pokédex number (shown on cards)
        cryUrl: poke.cries?.latest || "",
      };
    });

    // Sort weakest → strongest so the pack builds tension
    return cards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
  } catch (e) {
    console.error("PokéAPI fetch failed:", e);
    return [];
  }
};
