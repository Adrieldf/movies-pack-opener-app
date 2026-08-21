import { useCallback, useState } from "react";

export type SoundType =
  | "tear" | "flip" | "sparkle" | "swoosh"
  | "Junk" | "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

// Singleton AudioContext to prevent resource exhaustion and browser audio thread lag
let sharedAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function playSynthSound(type: SoundType) {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === "tear") {
      // Pack tear: crisp paper/foil friction noise burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.15);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.linearRampToValueAtTime(300, now + 0.15);
      filter.Q.setValueAtTime(2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.onended = () => {
        noise.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    } else if (type === "flip") {
      // Card flip: quick subtle flick pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.08);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } else if (type === "swoosh") {
      // Swoosh: smooth air glide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } else if (type === "sparkle") {
      // Sparkle: shimmering bell cascade
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.05;
        const dur = 0.35;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    } else if (type === "Junk") {
      // Junk: dull low-frequency thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } else if (type === "Common") {
      // Common: clean single-tone glass chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } else if (type === "Uncommon") {
      // Uncommon: bright ascending 2-tone chime
      const notes = [523.25, 659.25]; // C5 -> E5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.08;
        const dur = 0.28;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    } else if (type === "Rare") {
      // Rare: energetic ascending triad chime
      const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.07;
        const dur = 0.35;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    } else if (type === "Epic") {
      // Epic: rich multi-voice fantasy chord
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 -> E5 -> G5 -> C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.07;
        const dur = 0.45;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    } else if (type === "Legendary") {
      // Legendary: grand victory fanfare with golden sparkle tail
      const fanfare = [
        { freq: 523.25, delay: 0.00, dur: 0.3 }, // C5
        { freq: 659.25, delay: 0.08, dur: 0.3 }, // E5
        { freq: 783.99, delay: 0.16, dur: 0.3 }, // G5
        { freq: 1046.5, delay: 0.24, dur: 0.6 }, // C6
        { freq: 1318.5, delay: 0.32, dur: 0.6 }, // E6
        { freq: 1567.9, delay: 0.40, dur: 0.8 }, // G6
      ];
      fanfare.forEach(({ freq, delay, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + delay;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    }
  } catch {
    // Ignore synth audio errors gracefully
  }
}

export function useGameAudio() {
  const [isMuted, setIsMuted] = useState(false);

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;
    playSynthSound(type);
  }, [isMuted]);

  return { isMuted, setIsMuted, playSound };
}



