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

// Sound URLs using reliable royalty-free audio files with Web Audio synth fallback
export const DEFAULT_SOUND_URLS: Record<SoundType, string> = {
  tear:      "https://raw.githubusercontent.com/sound-effects/audio/main/tear.mp3",
  flip:      "https://raw.githubusercontent.com/sound-effects/audio/main/flip.mp3",
  swoosh:    "https://raw.githubusercontent.com/sound-effects/audio/main/swoosh.mp3",
  sparkle:   "https://raw.githubusercontent.com/sound-effects/audio/main/sparkle.mp3",
  Junk:      "https://raw.githubusercontent.com/sound-effects/audio/main/thud.mp3",
  Common:    "https://raw.githubusercontent.com/sound-effects/audio/main/chime.mp3",
  Uncommon:  "https://raw.githubusercontent.com/sound-effects/audio/main/chime2.mp3",
  Rare:      "https://raw.githubusercontent.com/sound-effects/audio/main/rare.mp3",
  Epic:      "https://raw.githubusercontent.com/sound-effects/audio/main/epic.mp3",
  Legendary: "https://raw.githubusercontent.com/sound-effects/audio/main/legendary.mp3",
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

function playSynthSound(type: SoundType) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "tear") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "flip") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "swoosh") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "sparkle" || type === "Legendary") {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } else if (type === "Epic" || type === "Rare") {
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.12, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const freq = type === "Junk" ? 160 : type === "Common" ? 360 : 460;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (err) {
    // Ignore synth audio errors gracefully
  }
}

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
      const h = new Howl({
        src: [url],
        volume: SOUND_VOLUMES[type],
        preload: true,
        onloaderror: () => {
          // If network audio fails to load, fallback to synth audio seamlessly
          howlCache.current.set(key, { play: () => playSynthSound(type), fade: () => {} });
        },
      });
      howlCache.current.set(key, h);
    }
    return howlCache.current.get(key);
  }, [customSounds]);

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;
    const vol = SOUND_VOLUMES[type];
    const h = getHowl(type);
    if (h) {
      try {
        const id = h.play();
        if (typeof id === "number") {
          setTimeout(() => h.fade(vol, 0, 400, id), SOUND_DURATIONS[type]);
        }
      } catch {
        playSynthSound(type);
      }
    } else {
      // Howler not loaded yet or unavailable — fallback to web audio synth
      playSynthSound(type);
    }
  }, [isMuted, getHowl]);

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
      const h = new Howl({
        src: [url],
        volume: vol,
        onloaderror: () => playSynthSound(type),
      });
      const id = h.play();
      if (typeof id === "number") {
        setTimeout(() => { h.fade(vol, 0, 300, id); setTimeout(() => h.unload(), 350); }, 1800);
      }
    } else {
      playSynthSound(type);
    }
  }, [customSounds]);

  useEffect(() => { return () => { howlCache.current.forEach((h) => h.unload?.()); }; }, []);

  return { isMuted, setIsMuted, playSound, customSounds, setCustomSound, resetSound, previewSound };
}

