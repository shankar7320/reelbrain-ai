"use client";

interface Stats {
  totalReels: number;
  totalCategories: number;
  totalFavorites: number;
  categoryStats: { name: string; count: number }[];
}

export default function StatsBar({ stats }: { stats: Stats }) {
  const statItems = [
    { icon: "📱", label: "Total Reels", value: stats.totalReels, color: "from-blue-500 to-blue-700" },
    { icon: "📂", label: "Categories", value: stats.totalCategories, color: "from-purple-500 to-purple-700" },
    { icon: "⭐", label: "Favorites", value: stats.totalFavorites, color: "from-yellow-500 to-yellow-700" },
    { icon: "📊", label: "Organized", value: stats.categoryStats.filter(s => s.name !== null).length, color: "from-green-500 to-green-700" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="glass-card rounded-xl p-4 transition-all hover:scale-105"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-lg shadow-lg`}>
              {item.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
