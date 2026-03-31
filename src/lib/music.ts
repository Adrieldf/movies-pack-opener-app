import { CardData, Rarity } from "./tmdb";

const LASTFM_API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY || "";

const getRarityByRating = (rating10: number): Rarity => {
  if (rating10 >= 9.2) return "Legendary";
  if (rating10 >= 8.5) return "Epic";
  if (rating10 >= 7.5) return "Rare";
  if (rating10 >= 6.0) return "Uncommon";
  if (rating10 <= 1.5) return "Junk";
  return "Common";
};

const getRandomRating = (id: number): number => {
  const seededRandom = Math.abs(Math.sin(id * 10.51) * 10000);
  const rand0to1 = seededRandom - Math.floor(seededRandom);
  return Number((2.0 + rand0to1 * 8.0).toFixed(1)); 
};

/** Use Last.fm to get a real-world popularity score */
const getRealMusicRating = async (artist: string, track: string, id: number): Promise<{ rating: number; listeners: number }> => {
    if (!LASTFM_API_KEY) return { rating: getRandomRating(id), listeners: 0 };

    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;
        const res = await fetch(url);
        if (!res.ok) return { rating: getRandomRating(id), listeners: 0 };
        
        const data = await res.json();
        const listeners = parseInt(data.track?.listeners || "0", 10);
        
        if (listeners === 0) return { rating: getRandomRating(id), listeners: 0 };

        /** 
         * LOGARITHMIC SCALING 
         */
        const logScore = Math.log10(listeners);
        let rating = (logScore / 7) * 10; 
        
        return { 
          rating: Number(Math.min(10, Math.max(1, rating)).toFixed(1)), 
          listeners 
        };
    } catch (e) {
        return { rating: getRandomRating(id), listeners: 0 };
    }
}

export const fetchRandomMusicPack = async (count: number = 5): Promise<CardData[]> => {
  const terms = [
    "hits", "top charts", "classic rock", "r&b", "90s house", "80s synth", 
    "viral", "soundtrack", "top tracks", "pop 2024", "hip hop", "alternative",
    "jazz", "blues", "country", "EDM", "indie", "metal", "classical", "k-pop",
    "reggae", "punk", "disco", "funk", "grunge", "lo-fi", "chill", "workout",
    "acoustic", "ambient", "folk", "latin", "salsa", "heavy metal", "techno"
  ];
  
  try {
    const urls = [];
    // At least 3 distinct genres per pack, or more if the pack is very large
    const numGenres = Math.max(3, Math.ceil(count / 5)); 
    const shuffledTerms = [...terms].sort(() => 0.5 - Math.random());
    const selectedTerms = shuffledTerms.slice(0, numGenres);

    for(const term of selectedTerms) {
        urls.push(`https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=40`);
    }

    const responses = await Promise.all(
      urls.map(url => fetch(url).then(res => res.ok ? res.json() : { results: [] }))
    );

    const allSongs = responses.flatMap(data => data.results || []);
    if (allSongs.length === 0) return [];

    const uniqueMap = new Map();
    allSongs.forEach(item => {
      if (!uniqueMap.has(item.trackId)) uniqueMap.set(item.trackId, item);
    });
    
    const uniquePool = Array.from(uniqueMap.values());
    for (let i = uniquePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniquePool[i], uniquePool[j]] = [uniquePool[j], uniquePool[i]];
    }

    const selectedItems = uniquePool.slice(0, Math.min(count, uniquePool.length));

    const musicCards: CardData[] = await Promise.all(selectedItems.map(async (item: any): Promise<CardData> => {
      let year: number | undefined;
      if (item.releaseDate) year = parseInt(item.releaseDate.split('-')[0], 10);

      const { rating: rating10, listeners } = await getRealMusicRating(item.artistName, item.trackName, item.trackId || item.collectionId);

      const poster = item.artworkUrl100?.replace('100x100bb', '600x600bb') || "";

      return {
        id: `music-${item.trackId || item.collectionId}`,
        rarity: getRarityByRating(rating10),
        name: item.trackName || item.collectionName || "Unknown Track",
        description: `${item.artistName} • ${item.collectionName || "Single"}`,
        poster: poster,
        rating: rating10,
        listeners: listeners,
        trailer: item.previewUrl || "",
        imdb_link: item.trackViewUrl || item.collectionViewUrl,
        year: year,
        type: "music",
        platforms: item.primaryGenreName ? [item.primaryGenreName] : []
      };
    }));

    const rarityOrder: Record<Rarity, number> = { Junk: -1, Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 };
    return musicCards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  } catch (error) {
    console.error("Error fetching Music data:", error);
    return [];
  }
};
