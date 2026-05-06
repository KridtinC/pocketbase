export default function PokemonDetailLoading() {
  return (
    <div className="max-w-lg mx-auto animate-pulse">
      {/* Back link placeholder */}
      <div className="h-5 w-24 rounded bg-white/20 mb-4" />

      <div
        className="rounded-3xl overflow-hidden shadow-xl border border-white/20 dark:border-white/10"
        style={{ background: "var(--glass-card)" }}
      >
        {/* Sprite header */}
        <div className="relative flex flex-col items-center justify-end h-56 px-6 pt-6 pb-4 bg-white/10 dark:bg-white/5">
          <div className="w-36 h-36 rounded-full bg-white/20" />
          <div className="absolute top-4 left-4 flex gap-1">
            <div className="h-5 w-14 rounded-full bg-white/30" />
            <div className="h-5 w-14 rounded-full bg-white/20" />
          </div>
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20" />
        </div>

        {/* Info panel */}
        <div
          className="p-6 rounded-b-3xl"
          style={{ background: "var(--glass-bg)", backdropFilter: "blur(24px) saturate(200%)" }}
        >
          {/* Name */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="h-7 w-40 rounded bg-white/20 mb-2" />
              <div className="h-4 w-24 rounded bg-white/10" />
            </div>
            <div className="h-5 w-12 rounded bg-white/10" />
          </div>

          {/* Tab bar */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 flex-1 rounded-md bg-white/15" />
            ))}
          </div>

          {/* Stat rows */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div className="h-3 w-20 rounded bg-white/10" />
              <div className="h-3 w-8 rounded bg-white/15" />
              <div className="flex-1 h-2 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
