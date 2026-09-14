import { CardData } from "./tmdb";
import { getAssetUrl } from "./assets";
import { formatPackName } from "./cardUtils";

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

