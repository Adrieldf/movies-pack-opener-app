import { CardData } from "./tmdb";

export const RICK_ROLL_CARD: CardData = {
  id: "rick-roll-fallback",
  name: "Never Gonna Give You Up",
  rarity: "Legendary",
  description: "Oops! API failed or returned 0 cards... Enjoy Rick Astley!",
  poster: "/rickroll.gif",
  rating: 10.0,
  year: 1987,
  type: "giphy",
  imdb_link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

export const getRickRollPack = (): CardData[] => {
  return [RICK_ROLL_CARD];
};
