"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import ConnectedDashboard from "@/components/ConnectedDashboard";
import SmartAnalyzer from "@/components/SmartAnalyzer";
import BulkImport from "@/components/BulkImport";
import AddReelModal from "@/components/AddReelModal";
import ReelCard from "@/components/ReelCard";
import CategoryFilter from "@/components/CategoryFilter";
import BotPanel from "@/components/BotPanel";
import WelcomeScreen from "@/components/WelcomeScreen";

interface Reel {
  id: string;
  url: string | null;
  title: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  aiSummary: string | null;
  stepByStepGuide: string | null;
  tags: string | null;
  platform: string | null;
  thumbnailUrl: string | null;
  isFavorite: boolean | null;
  priority: number | null;
  createdAt: string;
  updatedAt: string;
}

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

export default function Home() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReels: 0,
    totalCategories: 0,
    totalFavorites: 0,
    categoryStats: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"reels" | "analyzer" | "import" | "bots">("reels");
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [reelsRes, catsRes, statsRes] = await Promise.all([
        fetch("/api/reels"),
        fetch("/api/categories"),
        fetch("/api/stats"),
      ]);
      const [reelsData, catsData, statsData] = await Promise.all([
        reelsRes.json(),
        catsRes.json(),
        statsRes.json(),
      ]);
      setReels(Array.isArray(reelsData) ? reelsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setStats(statsData);
      
      // Show welcome if no reels and first visit
      if (Array.isArray(reelsData) && reelsData.length === 0) {
        const welcomed = localStorage.getItem("welcomed");
        if (!welcomed) {
          setShowWelcome(true);
        }
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCloseWelcome = () => {
    localStorage.setItem("welcomed", "true");
    setShowWelcome(false);
  };

  const filteredReels = reels.filter((reel) => {
    const matchesCategory =
      selectedCategory === "all" || reel.categoryName === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      reel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reel.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reel.tags || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reel.categoryName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDeleteReel = async (id: string) => {
    await fetch(`/api/reels/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    await fetch(`/api/reels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current }),
    });
    fetchData();
  };

  const tabs = [
    { key: "reels" as const, label: "📱 My Reels", desc: `${stats.totalReels} saved`, badge: null },
    { key: "analyzer" as const, label: "🧠 Smart Analyzer", desc: "Deep AI Analysis", badge: "AI" },
    { key: "import" as const, label: "📥 Bulk Import", desc: "Import All", badge: null },
    { key: "bots" as const, label: "⚡ Task Bots", desc: "Automation", badge: null },
  ];

  // Show welcome screen for first time users
  if (showWelcome) {
    return <WelcomeScreen onClose={handleCloseWelcome} />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddClick={() => setShowAddModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 pb-12">
        {/* Connected Account Dashboard */}
        <div className="mt-6">
          <ConnectedDashboard stats={stats} />
        </div>

        {/* Stats Bar */}
        <StatsBar stats={stats} />

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 mt-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-medium transition-all duration-300 relative ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30"
                  : "glass-card text-slate-400 hover:text-white"
              }`}
            >
              {tab.badge && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] rounded-full font-bold">
                  {tab.badge}
                </span>
              )}
              <div className="text-lg">{tab.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Reels Tab - Default */}
        {activeTab === "reels" && (
          <>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
              stats={stats}
            />

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-5xl animate-float mb-4">🧠</div>
                  <p className="text-slate-400 text-lg">Loading your reels...</p>
                </div>
              </div>
            ) : filteredReels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-7xl mb-6 animate-float">📱</div>
                <h3 className="text-2xl font-bold gradient-text mb-3">
                  {selectedCategory === "all" ? "No Reels Yet" : `No ${selectedCategory} Reels`}
                </h3>
                <p className="text-slate-400 text-center max-w-md mb-6">
                  {selectedCategory === "all"
                    ? "Instagram connect करो या Smart Analyzer से reels add करो!"
                    : `${selectedCategory} category में कोई reel नहीं है।`}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <a
                    href="/connect"
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-pink-500/30 flex items-center gap-2"
                  >
                    📸 Connect Instagram
                  </a>
                  <button
                    onClick={() => setActiveTab("analyzer")}
                    className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-primary/30"
                  >
                    🧠 Smart Analyzer
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReels.map((reel, i) => (
                  <div
                    key={reel.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <ReelCard
                      reel={reel}
                      onDelete={handleDeleteReel}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Smart Analyzer Tab */}
        {activeTab === "analyzer" && (
          <SmartAnalyzer categories={categories} onReelAdded={fetchData} />
        )}

        {/* Bulk Import Tab */}
        {activeTab === "import" && (
          <BulkImport categories={categories} onImported={fetchData} />
        )}

        {/* Bots Tab */}
        {activeTab === "bots" && <BotPanel />}
      </main>

      {showAddModal && (
        <AddReelModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onAdded={fetchData}
        />
      )}
    </div>
  );
}
