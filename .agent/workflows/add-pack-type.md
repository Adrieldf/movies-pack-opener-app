---
description: How to add a new pack type to the movies-pack-opener-app
---

# Adding a New Pack Type

This guide walks through every file that must be created or modified to add a new pack type to the app. Follow the steps in order — each step depends on the previous one.

For reference, look at the existing packs:
- **Movies/TV** → `src/lib/tmdb.ts` (uses TMDB API)
- **Games** → `src/lib/games.ts` (uses RAWG API)
- **Music** → `src/lib/music.ts` (uses iTunes + Last.fm)
- **Anime** → `src/lib/anime.ts` (uses Jikan API)

---

## Step 1 — Create the data-fetch library

Create `src/lib/<packname>.ts`. It must export a single async function:

```ts
import { CardData, Rarity } from "./tmdb";

// Tune rarity thresholds to whichever signal the API provides
// (rating, popularity, favorites, listeners, etc.)
const getRarityBy<Signal> = (value: number): Rarity => {
  if (value >= <threshold>) return "Legendary";
  if (value >= <threshold>) return "Epic";
  if (value >= <threshold>) return "Rare";
  if (value >= <threshold>) return "Uncommon";
  if (value <= <threshold>) return "Junk";
  return "Common";
};

export const fetchRandom<PackName>Pack = async (count: number = 5): Promise<CardData[]> => {
  // 1. Fetch a randomised pool from the external API
  // 2. Deduplicate (use a Map keyed on item.id)
  // 3. Fisher-Yates shuffle the pool
  // 4. Slice to `count` items
  // 5. Map each item to CardData (see the interface below)
  // 6. Sort by rarityOrder ascending (so the weakest card is revealed first)
  // 7. Return the array
};
```

### CardData interface reminder

```ts
interface CardData {
  id: string;          // must be globally unique, e.g. "mypack-123"
  rarity: Rarity;
  name: string;
  description: string;
  poster: string;      // direct image URL
  rating: number;      // 0–10 scale
  trailer?: string;    // YouTube watch URL, direct audio URL, or any link
  imdb_link?: string;  // external details page URL
  year?: number;
  type: "movie" | "tv" | "game" | "music" | "anime"; // add new literal if needed
  platforms?: string[];
  listeners?: number;  // optional, for music-style plays/popularity count
}
```

> **Sort at the end.** Always sort by `rarityOrder` (`Junk:-1 … Legendary:4`) so cards
> reveal weakest → strongest and build tension before the finale.

---

## Step 2 — Add the pack type to `PackType`

Edit `src/components/PackSelector.tsx`:

1. Add the new literal to `PackType`:

```ts
// Before
export type PackType = "movies" | "games" | "music" | "anime";

// After
export type PackType = "movies" | "games" | "music" | "anime" | "<packname>";
```

2. Add an entry to the `packs` array inside `PackSelector`:

```ts
{
  type: "<packname>",
  label: "Your Label",
  icon: "🃏",                                   // choose a fitting emoji
  color: "from-<color>-400 to-<color>-600",    // Tailwind gradient for the title
  border: "border-slate-700 hover:border-<color>-500",
  shadow: "hover:shadow-[0_0_40px_rgba(<r>,<g>,<b>,0.4)]",
  gradient: "from-<color>-900/80",
}
```

---

## Step 3 — Wire the fetcher into `page.tsx`

Edit `src/app/page.tsx`:

1. Import the new fetcher at the top:

```ts
import { fetchRandom<PackName>Pack } from "../lib/<packname>";
```

2. Add a branch to `handleOpen` (the `packType` switch):

```ts
const fetchedCards = packType === "games"
  ? await fetchRandomGamePack(packSize)
  : packType === "music"
    ? await fetchRandomMusicPack(packSize)
    : packType === "anime"
      ? await fetchRandomAnimePack(packSize)
      : packType === "<packname>"            // ← add this branch
        ? await fetchRandom<PackName>Pack(packSize)
        : await fetchRandomPack(packSize);
```

3. Update the URL param guard in the `useEffect` that reads `?pack=`:

```ts
// Find the line:
if (pType === "movies" || pType === "games" || pType === "music" || pType === "musics" || pType === "anime") {

// Add your new type:
if (pType === "movies" || ... || pType === "<packname>") {
```

---

## Step 4 — Add pack-specific artwork to `PackVisual`

Edit `src/components/PackVisual.tsx`. There are **three** places to update:

### 4a — Top foil accent glow (inside `topFoilContent`)

```tsx
{packType === '<packname>' && (
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(<r>,<g>,<b>,0.4),_transparent)]"></div>
)}
```

### 4b — Pack body background colour

Find the main body `<div>` with the background gradient class and extend the ternary:

```tsx
className={`h-3/4 w-full ${
  packType === 'games' ? 'bg-gradient-to-b from-blue-900 via-indigo-950 to-black' :
  packType === 'anime' ? 'bg-gradient-to-b from-orange-900 via-orange-950 to-black' :
  packType === '<packname>' ? 'bg-gradient-to-b from-<color>-900 via-<color>-950 to-black' :
  'bg-gradient-to-b from-slate-800 to-black'
} ...`}
```

### 4c — Center illustration

Add a new branch inside the `{packType === "games" ? … : packType === "music" ? … : (…)}` tree with your own illustration built from Tailwind utility classes.

### 4d — Pack name label

Extend the `{packType === "games" ? … : …}` label at the bottom:

```tsx
: packType === "<packname>" ? (
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-<color>-400 ...">
    <YOUR LABEL> PACK
  </span>
)
```

### 4e — Bottom crimp strip colour

Similarly extend the crimp strip colour ternary.

---

## Step 5 — Add the card back label in `CardReveal`

Edit `src/components/CardReveal.tsx`:

1. Update the emoji on the card back:

```tsx
{packType === "games" ? "🎮" : packType === "music" ? "🎧" : packType === "anime" ? "🌸" : packType === "<packname>" ? "🃏" : "🎬"}
```

2. Update the card back label text:

```tsx
{packType === "games" ? <>GAMING<br />COLLECTION</> :
 packType === "music" ? <>VINYL<br />COLLECTION</> :
 packType === "anime" ? <>ANIME<br />COLLECTION</> :
 packType === "<packname>" ? <><YOUR LABEL><br />COLLECTION</> :
 <>CINEMA<br />COLLECTION</>}
```

---

## Step 6 — Add the `type` literal to `CardData` (if needed)

If the new pack introduces a brand-new `type` value (e.g. `"comic"`) that isn't already
in the union, update two files:

**`src/lib/tmdb.ts`** — extend the union:
```ts
type: "movie" | "tv" | "game" | "music" | "anime" | "<newtype>";
```

**`src/lib/cardUtils.ts`** — add to `TypeFilter`:
```ts
export type TypeFilter = "all" | "movie" | "tv" | "game" | "music" | "anime" | "<newtype>";
```

**`src/components/CardGrid.tsx`** — add a filter button in the Filter Type row.

**`src/components/CardReveal.tsx`** — add a type icon/tag in the top-right badge.

---

## Step 7 — Add an API key (if required)

If the external API needs a key:

1. Add it to `.env.local`:
   ```
   NEXT_PUBLIC_<PACKNAME>_API_KEY=your_key_here
   ```

2. Read it in your lib file:
   ```ts
   const API_KEY = process.env.NEXT_PUBLIC_<PACKNAME>_API_KEY;
   ```

3. Add the same variable to `.github/workflows/deploy.yml` (GitHub secret) if the project uses CI/CD.

---

## Step 8 — Update the URL slug (optional)

In `page.tsx`, the URL param `?pack=` is used for deep-linking. By convention, the slug matches the `PackType` value. If you want a different slug (like `musics` → `music`), add a normalisation alias in both places where `pType` is read and written.

---

## Checklist

```
- [ ] src/lib/<packname>.ts                  — fetcher + rarity function
- [ ] src/components/PackSelector.tsx        — PackType union + packs[] entry
- [ ] src/app/page.tsx                       — import, handleOpen branch, URL guard
- [ ] src/components/PackVisual.tsx          — foil glow, body colour, artwork, label, crimp
- [ ] src/components/CardReveal.tsx          — back emoji, back label
- [ ] src/lib/tmdb.ts                        — type union (if new type literal)
- [ ] src/lib/cardUtils.ts                   — TypeFilter union (if new type literal)
- [ ] src/components/CardGrid.tsx            — filter button (if new type literal)
- [ ] .env.local                             — API key (if required)
- [ ] npm run build                          — verify zero TypeScript errors
```
