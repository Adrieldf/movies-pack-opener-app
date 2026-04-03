"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2 } from "lucide-react";
import { SoundRow } from "../SoundRow";
import { SoundType } from "../../lib/useGameAudio";

interface SoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  customSounds: Partial<Record<SoundType, string>>;
  onPreview: (type: SoundType) => void;
  onReset: (type: SoundType) => void;
  onUpload: (type: SoundType) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SoundModal = ({
  isOpen,
  onClose,
  customSounds,
  onPreview,
  onReset,
  onUpload,
  onFileChange,
}: SoundModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (type: SoundType) => {
    onUpload(type);
    fileInputRef.current?.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sound-modal-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
          onClick={onClose}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={onFileChange}
          />
          <motion.div
            key="sound-modal-box"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-7 w-full max-w-sm flex flex-col gap-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 text-white/80" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Sound Settings</h3>
                <p className="text-white/40 text-xs">Upload custom SFX per rarity</p>
              </div>
              <button onClick={onClose} className="ml-auto text-white/40 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pack Actions group */}
            <div>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Pack Actions</p>
              <div className="flex flex-col divide-y divide-white/5 rounded-xl overflow-hidden border border-white/10">
                {(["tear", "flip", "swoosh", "sparkle"] as SoundType[]).map((type) => (
                  <SoundRow
                    key={type}
                    type={type}
                    isCustom={!!customSounds[type]}
                    onPreview={() => onPreview(type)}
                    onUpload={() => handleUpload(type)}
                    onReset={() => onReset(type)}
                  />
                ))}
              </div>
            </div>

            {/* Rarity Reveals group */}
            <div>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Rarity Reveals</p>
              <div className="flex flex-col divide-y divide-white/5 rounded-xl overflow-hidden border border-white/10">
                {(["Junk", "Common", "Uncommon", "Rare", "Epic", "Legendary"] as SoundType[]).map((type) => (
                  <SoundRow
                    key={type}
                    type={type}
                    isCustom={!!customSounds[type]}
                    onPreview={() => onPreview(type)}
                    onUpload={() => handleUpload(type)}
                    onReset={() => onReset(type)}
                  />
                ))}
              </div>
            </div>

            <p className="text-white/20 text-[10px] text-center">
              MP3 · WAV · OGG · M4A supported. Custom sounds are saved locally in your browser.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
