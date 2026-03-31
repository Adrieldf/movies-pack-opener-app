export const PackSelector = ({ onSelect }: { onSelect: (type: "movies" | "games" | "music") => void }) => {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(120,0,255,0.1),_rgba(0,0,0,1))] pointer-events-none" />
        <h1 className="text-3xl sm:text-5xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-600 drop-shadow-lg z-10 text-center uppercase tracking-widest">
           Choose Your Pack
        </h1>
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 w-full max-w-6xl z-10 justify-center items-center flex-wrap">
             <button onClick={() => onSelect("movies")} className="group relative w-72 h-80 lg:h-96 rounded-2xl border-4 border-slate-700 bg-slate-900 overflow-hidden hover:border-purple-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all duration-300 transform hover:scale-105">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                   <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-4xl mb-6 shadow-xl group-hover:scale-110 transition-transform shadow-purple-900/50">🎬</div>
                   <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-widest text-slate-200">Cinema</h2>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-purple-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             </button>

             <button onClick={() => onSelect("games")} className="group relative w-72 h-80 lg:h-96 rounded-2xl border-4 border-slate-700 bg-slate-900 overflow-hidden hover:border-blue-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-300 transform hover:scale-105">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                   <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-4xl mb-6 shadow-xl group-hover:scale-110 transition-transform shadow-blue-900/50">🎮</div>
                   <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-widest text-slate-200">Games</h2>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-blue-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             </button>

             <button onClick={() => onSelect("music")} className="group relative w-72 h-80 lg:h-96 rounded-2xl border-4 border-slate-700 bg-slate-900 overflow-hidden hover:border-green-500 hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all duration-300 transform hover:scale-105">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
                   <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-4xl mb-6 shadow-xl group-hover:scale-110 transition-transform shadow-green-900/50">🎧</div>
                   <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-widest text-slate-200">Music</h2>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-green-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             </button>
        </div>
    </div>
  );
};
