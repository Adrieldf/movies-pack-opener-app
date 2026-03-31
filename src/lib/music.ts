import { CardData, Rarity } from "./tmdb";

const getRarityByRating = (rating10: number): Rarity => {
  if (rating10 >= 9.0) return "Legendary";
  if (rating10 >= 8.2) return "Epic";
  if (rating10 >= 7.2) return "Rare";
  if (rating10 >= 6.0) return "Uncommon";
  if (rating10 <= 1.0) return "Junk";
  return "Common";
};

const getRatingFromId = (id: number): number => {
  // Deterministic pseudo-random based on ID to ensure the same track always gets the same rating
  const seededRandom = Math.abs(Math.sin(id * 10.51) * 10000);
  const rand0to1 = seededRandom - Math.floor(seededRandom);
  return Number((1.0 + rand0to1 * 9.0).toFixed(1)); 
};

export const fetchRandomMusicPack = async (count: number = 5): Promise<CardData[]> => {
  const terms = [
    "rock", "pop", "hip hop", "jazz", "electronic", "classical", 
    "hits", "indie", "metal", "r&b", "soul", "reggae", "viral", 
    "2020", "2010s", "80s", "90s", "soundtrack", "synthwave"
  ];
  
  try {
    const urls = [];
    // iTunes limits to 50 commonly without issues, getting a few pages of random stuff
    for(let i = 0; i < Math.ceil(count / 10); i++) {
        const randomTerm = terms[Math.floor(Math.random() * terms.length)];
        urls.push(`https://itunes.apple.com/search?term=${randomTerm}&media=music&entity=song&limit=50`);
    }

    const responses = await Promise.all(
      urls.map(url => fetch(url).then(res => res.ok ? res.json() : { results: [] }))
    );

    const allSongs = responses.flatMap(data => data.results || []);
    if (allSongs.length === 0) return [];

    const uniqueMap = new Map();
    allSongs.forEach(item => {
      // Avoid duplicate tracks
      if (!uniqueMap.has(item.trackId)) {
        uniqueMap.set(item.trackId, item);
      }
    });
    
    const uniquePool = Array.from(uniqueMap.values());

    for (let i = uniquePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniquePool[i], uniquePool[j]] = [uniquePool[j], uniquePool[i]];
    }

    const selectedItems = uniquePool.slice(0, Math.min(count, uniquePool.length));

    const musicCards: CardData[] = selectedItems.map((item: any): CardData => {
      let year: number | undefined;
      if (item.releaseDate) {
        year = parseInt(item.releaseDate.split('-')[0], 10);
      }

      const rating10 = getRatingFromId(item.trackId || item.collectionId);

      // iTunes gives artworkUrl100, we want high res (e.g., 600x600 or 1000x1000 for crisp rendering)
      const poster = item.artworkUrl100?.replace('100x100bb', '600x600bb') || "";

      return {
        id: `music-${item.trackId || item.collectionId}`,
        rarity: getRarityByRating(rating10),
        name: item.trackName || item.collectionName || "Unknown Track",
        description: `${item.artistName} • ${item.collectionName || "Single"}`,
        poster: poster,
        rating: rating10,
        trailer: item.previewUrl || "", // iTunes song endpoint almost always has a 30s preview URL!
        imdb_link: item.trackViewUrl || item.collectionViewUrl,
        year: year,
        type: "music",
        platforms: item.primaryGenreName ? [item.primaryGenreName] : [] // Display genre as the 'platform' tag!
      };
    });

    const rarityOrder: Record<Rarity, number> = {
      Junk: -1,
      Common: 0,
      Uncommon: 1,
      Rare: 2,
      Epic: 3,
      Legendary: 4,
    };

    return musicCards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  } catch (error) {
    console.error("Error fetching Music data:", error);
    return [];
  }
};
