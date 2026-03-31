import { useCallback, useEffect, useRef, useState } from "react";

export type SoundType =
  | "tear" | "flip" | "sparkle" | "swoosh"
  | "Junk" | "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export const SOUND_LABELS: Record<SoundType, string> = {
  tear: "Pack Tear",
  flip: "Card Flip",
  swoosh: "Swoosh",
  sparkle: "Sparkle",
  Junk: "Junk Reveal",
  Common: "Common Reveal",
  Uncommon: "Uncommon Reveal",
  Rare: "Rare Reveal",
  Epic: "Epic Reveal",
  Legendary: "Legendary Reveal",
};

export const SOUND_ACCENT: Record<SoundType, string> = {
  tear: "bg-slate-400",
  flip: "bg-slate-400",
  swoosh: "bg-slate-400",
  sparkle: "bg-yellow-300",
  Junk: "bg-lime-600",
  Common: "bg-slate-400",
  Uncommon: "bg-green-400",
  Rare: "bg-blue-400",
  Epic: "bg-purple-400",
  Legendary: "bg-yellow-400",
};

export const DEFAULT_SOUND_URLS: Record<SoundType, string> = {
  tear:      "https://assets.mixkit.co/active_storage/sfx/147/147-preview.mp3",
  flip:      "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  swoosh:    "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  sparkle:   "https://assets.mixkit.co/active_storage/sfx/1998/1998-preview.mp3",
  Junk:      "https://assets.mixkit.co/active_storage/sfx/2046/2046-preview.mp3",
  Common:    "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  Uncommon:  "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  Rare:      "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
  Epic:      "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
  Legendary: "https://assets.mixkit.co/active_storage/sfx/1998/1998-preview.mp3",
};

const SOUND_VOLUMES: Record<SoundType, number> = {
  tear: 0.08, flip: 0.08, swoosh: 0.08, sparkle: 0.4,
  Junk: 0.08, Common: 0.08, Uncommon: 0.08, Rare: 0.12, Epic: 0.15, Legendary: 0.4,
};

const SOUND_DURATIONS: Record<SoundType, number> = {
  tear: 500, flip: 500, swoosh: 500, sparkle: 3000,
  Junk: 500, Common: 500, Uncommon: 500, Rare: 500, Epic: 500, Legendary: 3000,
};

const STORAGE_PREFIX = "custom_sound_";

function loadCustomSounds(): Partial<Record<SoundType, string>> {
  const result: Partial<Record<SoundType, string>> = {};
  for (const key of Object.keys(DEFAULT_SOUND_URLS) as SoundType[]) {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored) result[key] = stored;
  }
  return result;
}

export function useGameAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [customSounds, setCustomSounds] = useState<Partial<Record<SoundType, string>>>({});

  // Loaded dynamically to avoid Next.js SSR issues (Howler accesses `window` at module level)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const HowlRef = useRef<any>(null);
  // Cache: key = `${type}::${url}` → Howl instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const howlCache = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    setCustomSounds(loadCustomSounds());
    import("howler").then((mod) => { HowlRef.current = mod.Howl; });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getHowl = useCallback((type: SoundType): any | null => {
    const Howl = HowlRef.current;
    if (!Howl) return null;
    const url = customSounds[type] ?? DEFAULT_SOUND_URLS[type];
    const key = `${type}::${url}`;
    if (!howlCache.current.has(key)) {
      for (const [k, h] of howlCache.current.entries()) {
        if (k.startsWith(`${type}::`)) { h.unload(); howlCache.current.delete(k); }
      }
      howlCache.current.set(key, new Howl({ src: [url], volume: SOUND_VOLUMES[type], preload: true }));
    }
    return howlCache.current.get(key);
  }, [customSounds]);

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;
    const vol = SOUND_VOLUMES[type];
    const h = getHowl(type);
    if (h) {
      const id = h.play();
      setTimeout(() => h.fade(vol, 0, 400, id), SOUND_DURATIONS[type]);
    } else {
      // Howler not loaded yet — HTML5 Audio fallback
      const audio = new Audio(customSounds[type] ?? DEFAULT_SOUND_URLS[type]);
      audio.volume = vol;
      audio.play().catch(() => {});
      setTimeout(() => {
        const fade = setInterval(() => {
          if (audio.volume > 0.01) audio.volume = Math.max(0, audio.volume - 0.015);
          else { audio.pause(); clearInterval(fade); }
        }, 20);
      }, SOUND_DURATIONS[type]);
    }
  }, [isMuted, getHowl, customSounds]);

  const setCustomSound = useCallback((type: SoundType, dataUrl: string) => {
    localStorage.setItem(STORAGE_PREFIX + type, dataUrl);
    setCustomSounds((prev) => ({ ...prev, [type]: dataUrl }));
    for (const [k, h] of howlCache.current.entries()) {
      if (k.startsWith(`${type}::`)) { h.unload(); howlCache.current.delete(k); }
    }
  }, []);

  const resetSound = useCallback((type: SoundType) => {
    localStorage.removeItem(STORAGE_PREFIX + type);
    setCustomSounds((prev) => { const n = { ...prev }; delete n[type]; return n; });
    for (const [k, h] of howlCache.current.entries()) {
      if (k.startsWith(`${type}::`)) { h.unload(); howlCache.current.delete(k); }
    }
  }, []);

  const previewSound = useCallback((type: SoundType) => {
    const url = customSounds[type] ?? DEFAULT_SOUND_URLS[type];
    const vol = Math.min(SOUND_VOLUMES[type] * 2.5, 1);
    const Howl = HowlRef.current;
    if (Howl) {
      const h = new Howl({ src: [url], volume: vol });
      const id = h.play();
      setTimeout(() => { h.fade(vol, 0, 300, id); setTimeout(() => h.unload(), 350); }, 1800);
    } else {
      const audio = new Audio(url);
      audio.volume = vol;
      audio.play().catch(() => {});
      setTimeout(() => { audio.pause(); }, 2000);
    }
  }, [customSounds]);

  useEffect(() => { return () => { howlCache.current.forEach((h) => h.unload()); }; }, []);

  return { isMuted, setIsMuted, playSound, customSounds, setCustomSound, resetSound, previewSound };
}
