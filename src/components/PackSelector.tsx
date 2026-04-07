import { motion } from "framer-motion";

export type PackType = "movies" | "games" | "music" | "anime" | "pokemon" | "boardgame" | "giphy" | "yugioh" | "mtg" | "random";

const PACK_CONFIG: Record<PackType, { label: string; icon: string; bg: string; accent: string; glow: string }> = {
  movies: { label: "Cinema", icon: "🎬", bg: "from-slate-900 to-purple-950", accent: "from-purple-400 to-pink-500", glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]" },
  games: { label: "Games", icon: "🎮", bg: "from-slate-900 to-blue-950", accent: "from-blue-400 to-indigo-500", glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]" },
  music: { label: "Music", icon: "🎧", bg: "from-slate-900 to-emerald-950", accent: "from-green-400 to-emerald-500", glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]" },
  anime: { label: "Anime", icon: "🌸", bg: "from-slate-900 to-rose-950", accent: "from-rose-400 to-pink-500", glow: "group-hover:shadow-[0_0_30px_rgba(244,114,182,0.4)]" },
  pokemon: { label: "Pokémon", icon: "🌟", bg: "from-slate-900 to-red-950", accent: "from-yellow-400 to-red-500", glow: "group-hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]" },
  giphy: { label: "Giphy", icon: "🖼️", bg: "from-slate-900 to-cyan-950", accent: "from-cyan-400 to-blue-500", glow: "group-hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]" },
  yugioh: { label: "Yu-Gi-Oh!", icon: "🃏", bg: "from-slate-900 to-amber-950", accent: "from-amber-500 to-yellow-600", glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]" },
  mtg: { label: "MTG", icon: "🔮", bg: "from-slate-900 to-purple-950", accent: "from-purple-400 to-indigo-500", glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]" },
  boardgame: { label: "Boards", icon: "🎲", bg: "from-slate-900 to-amber-950", accent: "from-amber-400 to-orange-500", glow: "group-hover:shadow-[0_0_30_rgba(245,158,11,0.4)]" },
  random: { label: "Surprise!", icon: "🎲", bg: "from-slate-800 via-purple-900 to-slate-900", accent: "from-white/40 to-white/10", glow: "group-hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]" }
};

export const PackSelector = ({ onSelect }: { onSelect: (type: PackType) => void }) => {
  const packs = (Object.keys(PACK_CONFIG) as PackType[]).filter(t => t !== "random");

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-8 font-sans overflow-y-auto">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_15%,_rgba(120,0,255,0.1),_transparent)] pointer-events-none" />
      
      {/* Branding */}
      <div className="absolute top-8 left-8 hidden md:block">
        <h1 className="text-xl font-black tracking-tighter text-white opacity-80 uppercase">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">PACK</span> OPENER
        </h1>
      </div>

      <div className="w-full max-w-4xl z-10 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-white mb-2 uppercase">
            Select <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 italic">Pack</span>
          </h2>
          <p className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-[0.3em]">Choose your collection</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          {packs.map((type, idx) => {
            const config = PACK_CONFIG[type];
            return (
              <motion.button
                key={type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelect(type)}
                className={`group relative aspect-[4/5] sm:aspect-square rounded-2xl sm:rounded-3xl p-0.5 transition-all duration-500 ${config.glow} hover:scale-[1.03] active:scale-95`}
              >
                <div className={`w-full h-full rounded-[0.9rem] sm:rounded-[1.4rem] bg-gradient-to-br ${config.bg} border border-white/10 flex flex-col items-center justify-center relative overflow-hidden`}>
                  {/* Themed Accent Glow */}
                  <div className={`absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br ${config.accent} opacity-5 blur-[60px] group-hover:opacity-20 transition-opacity`} />
                  
                  <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-4 p-4 text-center">
                    <span className="text-3xl sm:text-5xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{config.icon}</span>
                    <div>
                      <h3 className="text-sm sm:text-lg font-black uppercase tracking-widest text-white leading-tight">
                        {config.label}
                      </h3>
                      <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${config.accent} mx-auto mt-1 transition-all duration-500 rounded-full`} />
                    </div>
                  </div>

                  {/* Corner detail */}
                  <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl ${config.accent} opacity-10 group-hover:opacity-30 transition-opacity rounded-bl-3xl`} />
                  
                  {/* Subtle noise pattern */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                </div>
              </motion.button>
            );
          })}

          {/* Random / Surprise Pack */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: packs.length * 0.05 }}
            onClick={() => onSelect("random")}
            className="group relative aspect-[4/5] sm:aspect-square rounded-2xl sm:rounded-3xl p-0.5 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.05] active:scale-95"
          >
            <div className="w-full h-full rounded-[0.9rem] sm:rounded-[1.4rem] bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 border border-white/20 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1),_transparent)] transform group-hover:scale-150 transition-transform duration-1000"></div>
               <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-4 p-4 text-center">
                  <span className="text-3xl sm:text-5xl drop-shadow-2xl group-hover:rotate-12 transition-transform duration-500">🎲</span>
                  <div className="flex flex-col items-center">
                     <h3 className="text-sm sm:text-lg font-black uppercase tracking-widest text-white leading-tight">Surprise!</h3>
                     <span className="text-[8px] sm:text-[10px] text-white/40 font-bold uppercase tracking-tighter mt-1">Random Collection</span>
                  </div>
               </div>
               
               {/* Shifting animated border/glow effect */}
               <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_2s_infinite]"></div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

