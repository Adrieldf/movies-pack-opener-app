const fs = require("fs");
const path = require("path");

const csvPath = "C:/Users/adrie/.gemini/antigravity/brain/d9df85f4-d85a-4376-bd44-b59b6527e4a4/.system_generated/steps/163/content.md";
const outPath = path.join(__dirname, "../src/lib/boardgames-data.ts");

const text = fs.readFileSync(csvPath, "utf8");

// Parse only data lines (start with a numeric ID)
const dataLines = text.split("\n").filter((l) => /^\d+,/.test(l.trim()));

const games = [];

for (const line of dataLines) {
  const raw = line.trim();
  // Find the thumbnail URL (always starts with https://cf.geekdo)
  const thumbStart = raw.lastIndexOf(",https://");
  if (thumbStart === -1) continue;
  const thumbnail = raw.slice(thumbStart + 1).trim();

  // Find the BGG URL (/boardgame/...)
  const bggUrlStart = raw.lastIndexOf(",/boardgame/", thumbStart);
  if (bggUrlStart === -1) continue;
  const bggUrl = raw.slice(bggUrlStart + 1, thumbStart).trim();

  // Everything before the BGG URL is: id,name,year,rank,avg,bayes,users
  const meta = raw.slice(0, bggUrlStart);
  // Split carefully: id first, then from the right: users, bayes, avg, rank, year, then name
  const firstComma = meta.indexOf(",");
  const id = parseInt(meta.slice(0, firstComma));
  const rest = meta.slice(firstComma + 1);

  // From the right: users, bayes, avg, rank, year
  const parts = rest.split(",");
  const users = parseInt(parts[parts.length - 1]);
  const bayes = parseFloat(parts[parts.length - 2]);
  const avg = parseFloat(parts[parts.length - 3]);
  const rank = parseInt(parts[parts.length - 4]);
  const year = parseInt(parts[parts.length - 5]);
  // name is everything else (may contain commas if quoted)
  const name = parts
    .slice(0, parts.length - 5)
    .join(",")
    .replace(/^"|"$/g, "")
    .trim();

  if (!rank || rank > 500 || !name || !thumbnail) continue;

  // Upgrade the micro thumbnail (64x64) to a proper image
  // Replace __micro with __imagepage to get the actual image
  const poster = thumbnail
    .replace("__micro/img/", "__imagepage/img/")
    .replace("/fit-in/64x64/filters:strip_icc()/", "/");

  games.push({ id, name, year, rank, rating: avg, voters: users, bggUrl, poster });
}

// Sort by rank
games.sort((a, b) => a.rank - b.rank);
const top500 = games.slice(0, 500);

console.log(`Parsed ${top500.length} games`);

// Build TypeScript output
const lines = [
  "// Auto-generated from BGG ranking data (Aug 2023) — DO NOT EDIT",
  "export interface BGGGame {",
  "  id: number;",
  "  name: string;",
  "  year: number;",
  "  rank: number;",
  "  rating: number;",
  "  voters: number;",
  "  bggUrl: string;",
  "  poster: string;",
  "}",
  "",
  "export const BGG_TOP_500: BGGGame[] = [",
];

for (const g of top500) {
  const safe = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.push(
    `  { id: ${g.id}, name: "${safe(g.name)}", year: ${g.year}, rank: ${g.rank}, rating: ${g.rating.toFixed(2)}, voters: ${g.voters}, bggUrl: "${safe(g.bggUrl)}", poster: "${safe(g.poster)}" },`
  );
}

lines.push("];");
lines.push("");

fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Written to ${outPath}`);
