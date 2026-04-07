# 🎬 Movies Pack Opener 🎬

A premium, interactive web application for opening simulated packs of movies, board games, music, and more. Built with **Next.js**, **Framer Motion**, and various entertainment APIs.

## ✨ Features
- **Live Board Game Data:** Powered by the BoardGameGeek XML API 2.
- **Dynamic Variety:** 1,000+ top-ranked board games to find.
- **Multiple Pack Types:** Movies, Games, Music, Anime, Pokémon, Giphy, Yu-Gi-Oh!, and Magic: The Gathering.
- **Premium Animations:** Realistic "pack tearing" physics and card reveal effects.
- **Collection Management:** Save your pulls locally and browse them in a grid view.
- **Twitch Integration:** High-rarity polls are automatically posted to Twitch chat if connected.

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📽️ Streamer Queue System (Twitch Overlay)

This application includes a dedicated system for streamers to handle automated pack openings via Twitch rewards or chat redemptions.

### 1. OBS Setup (The Display)
1. Add a new **Browser Source** in OBS.
2. Set the URL to: `https://your-app-url.com/overlay`
3. Set width to **1920** and height to **1080**.
4. Enable "Shutdown source when not visible" for a clean reset.

### 2. MixItUp / Channel Point Setup (The Trigger)
When a viewer redeems a reward, configure your bot to trigger this URL:
`https://your-app-url.com/add?type=TYPE&count=5&user=$username`

#### URL Parameters:
- `user=$username`: Shows the viewer's name on top of the pack.
- `count=5`: Number of cards in the pack.
- `type=...`: Choose from: `boardgame`, `movies`, `pokemon`, `music`, `anime`, `games`, `yugioh`, `mtg`, or `giphy`.

### 3. Auto-Hide Configuration (Webhook)
The website automatically pings the MixItUp webhook when the queue is empty.
1. In **MixItUp**, find your webhook entry.
2. Set the action to: **Source Visibility -> Hide** (target your OBS Browser Source).

---

## 🛠️ Tech Stack
- **Framework:** [Next.js](https://nextjs.org) (Static Export)
- **Styling:** Vanilla CSS & Tailwind CSS
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev)
- **APIs:** TMDB, RAWG, Last.fm, BoardGameGeek, PokéAPI, Giphy, and more.

## 📄 License
This project is for demonstration and personal use. Attribution to TMDB/BGG and other data providers is maintained within the app.
