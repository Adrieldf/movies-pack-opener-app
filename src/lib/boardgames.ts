import { CardData, Rarity } from "./tmdb";
import { BGG_GAME_IDs } from "./boardgames-data";

/**
 * BGG rating scale:
 *  ≥ 8.5 → Legendary  (elite, cult classics)
 *  ≥ 8.0 → Epic
 *  ≥ 7.6 → Rare
 *  ≥ 7.3 → Uncommon
 *  ≥ 7.0 → Common
 *  < 7.0 → Junk
 */
const getRarityByBGGRating = (rating: number): Rarity => {
  if (rating >= 8.5) return "Legendary";
  if (rating >= 8.0) return "Epic";
  if (rating >= 7.6) return "Rare";
  if (rating >= 7.3) return "Uncommon";
  if (rating >= 7.0) return "Common";
  return "Junk";
};

const rarityOrder: Record<Rarity, number> = {
  Junk: -1,
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
};

export const fetchRandomBoardGamePack = async (
  count: number = 5
): Promise<CardData[]> => {
  // Pool: pick `count` random BGG IDs from our robust catalog
  const pool = [...BGG_GAME_IDs];

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, Math.min(count, pool.length));
  const ids = selected.join(",");

  let res: Response | null = null;
  let attempts = 0;
  const maxAttempts = 5;
  
  // Static project setup using a public CORS proxy
  const CORS_PROXY = "https://corsproxy.io/?";
  const BGG_API_URL = `https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`;
  const PROXIED_URL = `${CORS_PROXY}${encodeURIComponent(BGG_API_URL)}`;
  
  const token = process.env.NEXT_PUBLIC_BGG_API_KEY;
  const isValidToken = token && token !== "undefined" && token.length > 5;

  while (attempts < maxAttempts) {
    const headers: Record<string, string> = {};
    if (isValidToken) {
        headers['Authorization'] = `Bearer ${token}`.trim();
    }

    try {
        res = await fetch(PROXIED_URL, { headers });
        
        if (res.status === 202) {
          console.log(`[BGG] Processing request (202 Accepted). Retrying attempt ${attempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempts + 1)));
          attempts++;
          continue;
        }

        if (!res.ok) {
          throw new Error(`Public CORS proxy failed with status ${res.status}`);
        }

        const text = await res.text();
        
        // Sometimes BGG returns 200 but the body contains "Your request... is being processed"
        if (text.includes("Your request for this item is currently being processed") || text.includes("Please try again later")) {
          console.log(`[BGG] Response indicates processing or retry required. Retrying attempt ${attempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempts + 1)));
          attempts++;
          continue;
        }

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const items = Array.from(xml.querySelectorAll("item"));

        // If no items found, it might still be generating data or just an empty search
        if (items.length === 0 && attempts < maxAttempts - 1) {
          console.log(`[BGG] No items found in XML response. Retrying attempt ${attempts + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
          continue;
        }

        const cards: CardData[] = items.map((item) => {
          const id = item.getAttribute("id") || "";
          
          // Find metadata nodes
          const nameNode = item.querySelector("name[type='primary']");
          const name = nameNode ? nameNode.getAttribute("value") || "Unknown" : "Unknown";
          
          const yearNode = item.querySelector("yearpublished");
          const year = yearNode ? parseInt(yearNode.getAttribute("value") || "0", 10) : 0;
          
          const imageNode = item.querySelector("image");
          const poster = imageNode ? imageNode.textContent || "" : "";
          
          // Extract categories and mechanics
          const categoriesNodes = Array.from(item.querySelectorAll("link[type='boardgamecategory']"));
          const mechanicsNodes = Array.from(item.querySelectorAll("link[type='boardgamemechanic']"));
          const categories = categoriesNodes.map(node => node.getAttribute("value")).filter(Boolean);
          const mechanics = mechanicsNodes.map(node => node.getAttribute("value")).filter(Boolean);
          
          const combinedInfo = [...categories, ...mechanics].slice(0, 3).join(", ");
          
          // Find rating and stats nodes
          const avgNode = item.querySelector("ratings average");
          const rating = avgNode ? parseFloat(avgNode.getAttribute("value") || "0") : 0;
          
          const usersNode = item.querySelector("ratings usersrated");
          const voters = usersNode ? parseInt(usersNode.getAttribute("value") || "0", 10) : 0;

          const rankNode = item.querySelector("ranks rank[name='boardgame']");
          const rankStr = rankNode ? rankNode.getAttribute("value") : "0";
          const rank = (rankStr && rankStr.toLowerCase() !== "not ranked") ? parseInt(rankStr, 10) : 0;

          return {
            id: `boardgame-${id}`,
            rarity: getRarityByBGGRating(rating),
            name: name,
            description: combinedInfo || "A strategy board game.",
            poster: poster,
            rating: parseFloat(rating.toFixed(2)),
            imdb_link: `https://boardgamegeek.com/boardgame/${id}`,
            year: year,
            type: "boardgame",
            rank: rank,
          };
        });

        // Sort: weakest first, strongest last (for dramatic reveal)
        return cards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    } catch (err) {
        console.error("CORS proxy error:", err);
        attempts++;
        if (attempts >= maxAttempts) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Final fallback if all attempts fail
  throw new Error("Failed to fetch properly formatted BGG data after multiple attempts.");
};
