"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ClearModalProps {
  isOpen: boolean;
  collectionCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ClearModal = ({ isOpen, collectionCount, onConfirm, onCancel }: ClearModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="clear-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={onCancel}
        >
          <motion.div
            key="clear-modal-box"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-900/40 border border-red-500/40 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            {/* Text */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Clear Collection?</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Are you sure you want to delete all{" "}
                <span className="text-white font-semibold">{collectionCount} card{collectionCount !== 1 ? "s" : ""}</span>{" "}
                from your collection? This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <button
                onClick={onCancel}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2.5 px-4 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-red-900/30 transition-all"
              >
                Clear All
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
