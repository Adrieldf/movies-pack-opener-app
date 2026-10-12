import { CardData } from "./tmdb";
import { getAssetUrl } from "./assets";
import { formatPackName } from "./cardUtils";
import { fetchRandomNumbersPack } from "./numbers";

export const RICK_ROLL_CARD: CardData = {
  id: "rick-roll-fallback",
  name: "Consolation Prize",
  rarity: "Legendary",
  description: "Consolation prize: pack was missing",
  poster: getAssetUrl("/rickroll.gif"),
  rating: 10.0,
  year: 1987,
  type: "giphy",
  imdb_link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

// Preferred fallback when a pack errors out: a numbers pack instead of the
// rickroll gif, tagged so the Twitch message still calls out which pack failed.
export const getConsolationNumbersPack = async (count: number, originalPack?: string): Promise<CardData[]> => {
  const cards = await fetchRandomNumbersPack(count);
  return cards.map((c) => ({ ...c, originalPack, isConsolation: true }));
};

export const getRickRollPack = (originalPack?: string): CardData[] => {
  const packTitle = originalPack ? `${formatPackName(originalPack)} Pack` : "Pack";
  return [{
    ...RICK_ROLL_CARD,
    poster: getAssetUrl("/rickroll.gif"),
    originalPack,
    description: originalPack
      ? `Consolation prize: ${packTitle} ran into a problem`
      : "Consolation prize: pack was missing",
  }];
};

export const PACK_TIMEOUT_MS = 30000;

// Caps how long a pack fetch may take. Rejecting sends it down the same error
// path as a failed fetch, so a hung API yields the consolation pack instead of
// leaving the pack stuck on loading.
export const withPackTimeout = <T>(promise: Promise<T>, ms: number = PACK_TIMEOUT_MS): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Pack fetch timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};
