"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCcw } from "lucide-react";
import { TwitchConfig } from "../../lib/useTwitchChat";

type TwitchStatus = "disconnected" | "connecting" | "connected" | "error";

interface TwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TwitchStatus;
  config: TwitchConfig;
  form: TwitchConfig;
  setForm: (f: TwitchConfig | ((prev: TwitchConfig) => TwitchConfig)) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const TwitchModal = ({
  isOpen,
  onClose,
  status,
  config,
  form,
  setForm,
  onConnect,
  onDisconnect,
}: TwitchModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="twitch-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
          onClick={onClose}
        >
          <motion.div
            key="twitch-modal-box"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Twitch Integration</h3>
                <p className="text-white/50 text-xs">Post card reveals to your chat</p>
              </div>
              <button onClick={onClose} className="ml-auto text-white/40 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status badge */}
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border ${
              status === "connected" ? "bg-purple-900/30 border-purple-500/40 text-purple-300" :
              status === "connecting" ? "bg-yellow-900/30 border-yellow-500/40 text-yellow-300" :
              status === "error" ? "bg-red-900/30 border-red-500/40 text-red-300" :
              "bg-white/5 border-white/10 text-white/40"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                status === "connected" ? "bg-purple-400" :
                status === "connecting" ? "bg-yellow-400 animate-pulse" :
                status === "error" ? "bg-red-400" :
                "bg-white/20"
              }`} />
              {status === "connected" && `Connected to #${config.channel}`}
              {status === "connecting" && "Connecting…"}
              {status === "error" && "Auth failed — check your token"}
              {status === "disconnected" && "Not connected"}
            </div>

            {/* Form */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Channel Name</label>
                <input
                  id="twitch-channel"
                  type="text"
                  placeholder="your_channel"
                  value={form.channel}
                  onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">Twitch Username</label>
                <input
                  id="twitch-username"
                  type="text"
                  placeholder="your_username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                  OAuth Token
                  <a href="https://twitchapps.com/tmi/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-bold normal-case tracking-normal text-[11px] transition-colors">
                    Get token ↗
                  </a>
                </label>
                <input
                  id="twitch-token"
                  type="password"
                  placeholder="oauth:xxxxxxxxxxxxxx"
                  value={form.token}
                  onChange={e => {
                    const val = e.target.value.replace(/^oauth:/i, "");
                    setForm(f => ({ ...f, token: val }));
                  }}
                  className="bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all font-mono"
                />
                <p className="text-white/30 text-[10px] leading-relaxed">
                  Stored only in your browser&apos;s localStorage. Never sent anywhere except directly to Twitch.
                </p>
              </div>
            </div>

            {/* Message preview */}
            <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2">
              <p className="text-white/30 text-[10px] uppercase font-semibold mb-1">Preview message</p>
              <p className="text-white/70 text-xs font-mono break-all">
                🌟 [LEGENDARY] Inception | 🎬 Movie | ⭐ 8.8/10 ⭐⭐⭐⭐⭐
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {status === "connected" ? (
                <button
                  id="twitch-disconnect-btn"
                  onClick={() => { onDisconnect(); onClose(); }}
                  className="flex-1 bg-red-900/40 hover:bg-red-700/50 border border-red-500/40 text-red-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  id="twitch-connect-btn"
                  onClick={onConnect}
                  disabled={!form.channel || !form.username || !form.token || status === "connecting"}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-purple-900/30 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {status === "connecting" ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Connecting…</> : "Connect"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
