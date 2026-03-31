import { SoundType, SOUND_LABELS, SOUND_ACCENT } from "../lib/useGameAudio";

export const SoundRow = ({
  type,
  isCustom,
  onPreview,
  onUpload,
  onReset,
}: {
  type: SoundType;
  isCustom: boolean;
  onPreview: () => void;
  onUpload: () => void;
  onReset: () => void;
}) => (
  <div className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
    <span className={`w-2 h-2 rounded-full shrink-0 ${SOUND_ACCENT[type]}`} />
    <span className="text-white/75 text-xs font-medium flex-1 min-w-0 truncate">{SOUND_LABELS[type]}</span>
    {isCustom ? (
      <span className="text-[9px] bg-purple-600/30 border border-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
        Custom
      </span>
    ) : (
      <span className="text-[9px] text-white/20 font-semibold uppercase">Default</span>
    )}
    {/* Preview */}
    <button
      onClick={onPreview}
      title="Preview"
      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all text-xs"
    >▶</button>
    {/* Upload */}
    <button
      onClick={onUpload}
      title="Upload custom sound"
      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-purple-600/50 text-white/60 hover:text-white transition-all text-xs"
    >↑</button>
    {/* Reset – only visible when custom */}
    {isCustom && (
      <button
        onClick={onReset}
        title="Reset to default"
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-900/30 hover:bg-red-700/50 text-red-400 hover:text-white transition-all text-xs"
      >✕</button>
    )}
  </div>
);
