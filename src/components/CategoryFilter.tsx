"use client";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Stats {
  totalReels: number;
  totalCategories: number;
  totalFavorites: number;
  categoryStats: { name: string; count: number }[];
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  stats: Stats;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelect,
  stats,
}: CategoryFilterProps) {
  const getCount = (name: string) => {
    const found = stats.categoryStats.find((s) => s.name === name);
    return found ? found.count : 0;
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
        <span>📂</span> Filter by Category
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelect("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "glass-card text-slate-400 hover:text-white hover:border-primary/40"
          }`}
        >
          🌐 All ({stats.totalReels})
        </button>
        {categories.map((cat) => {
          const count = getCount(cat.name);
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.name)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.name
                  ? "text-white shadow-lg"
                  : "glass-card text-slate-400 hover:text-white"
              }`}
              style={
                selectedCategory === cat.name
                  ? { background: cat.color, boxShadow: `0 4px 15px ${cat.color}40` }
                  : {}
              }
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              {count > 0 && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
