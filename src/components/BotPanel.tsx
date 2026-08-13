"use client";

import { useState } from "react";

interface Bot {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: "idle" | "running" | "done";
  action: () => Promise<string>;
}

export default function BotPanel() {
  const [activeBot, setActiveBot] = useState<string | null>(null);
  const [botOutput, setBotOutput] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const bots: Bot[] = [
    {
      id: "categorizer",
      name: "🏷️ Auto Categorizer Bot",
      description: "सभी uncategorized reels को automatically categorize करता है",
      icon: "🏷️",
      color: "#6366f1",
      status: "idle",
      action: async () => {
        const res = await fetch("/api/reels");
        const reels = await res.json();
        if (!Array.isArray(reels)) return "No reels found to categorize.";
        const uncategorized = reels.filter(
          (r: { categoryName: string | null }) => !r.categoryName || r.categoryName === "Other"
        );
        if (uncategorized.length === 0) return "✅ सारी reels पहले से categorized हैं! कोई uncategorized reel नहीं मिली।";

        let count = 0;
        for (const reel of uncategorized) {
          const analyzeRes = await fetch("/api/ai/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `${reel.title} ${reel.description || ""}`,
              url: reel.url,
            }),
          });
          const analysis = await analyzeRes.json();
          if (analysis.category && analysis.category !== "Other") {
            await fetch(`/api/reels/${reel.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                categoryName: analysis.category,
                aiSummary: analysis.summary,
                stepByStepGuide: analysis.guide,
                tags: analysis.tags?.join(", "),
              }),
            });
            count++;
          }
        }
        return `✅ Done! ${count} reels को automatically categorize कर दिया। Total uncategorized reels checked: ${uncategorized.length}`;
      },
    },
    {
      id: "summarizer",
      name: "📝 Bulk Summarizer Bot",
      description: "सभी reels के लिए AI summaries generate करता है",
      icon: "📝",
      color: "#22c55e",
      status: "idle",
      action: async () => {
        const res = await fetch("/api/reels");
        const reels = await res.json();
        if (!Array.isArray(reels)) return "No reels found.";
        const noSummary = reels.filter(
          (r: { aiSummary: string | null }) => !r.aiSummary
        );
        if (noSummary.length === 0) return "✅ सारी reels में पहले से AI summary है!";

        let count = 0;
        for (const reel of noSummary) {
          const analyzeRes = await fetch("/api/ai/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: `${reel.title} ${reel.description || ""}`,
              url: reel.url,
            }),
          });
          const analysis = await analyzeRes.json();
          await fetch(`/api/reels/${reel.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              aiSummary: analysis.summary,
              stepByStepGuide: analysis.guide,
            }),
          });
          count++;
        }
        return `✅ ${count} reels को AI summary और guide add कर दी!`;
      },
    },
    {
      id: "duplicates",
      name: "🔍 Duplicate Finder Bot",
      description: "Duplicate reels ढूंढता है similar titles के basis पर",
      icon: "🔍",
      color: "#f97316",
      status: "idle",
      action: async () => {
        const res = await fetch("/api/reels");
        const reels = await res.json();
        if (!Array.isArray(reels)) return "No reels found.";

        const titleMap: Record<string, number> = {};
        for (const reel of reels) {
          const key = reel.title.toLowerCase().trim();
          titleMap[key] = (titleMap[key] || 0) + 1;
        }
        const dupes = Object.entries(titleMap)
          .filter(([, count]) => count > 1)
          .map(([title, count]) => `"${title}" — ${count} times`);

        if (dupes.length === 0)
          return "✅ कोई duplicate reel नहीं मिली! सब unique हैं।";
        return `⚠️ ${dupes.length} duplicate groups मिले:\n\n${dupes.join("\n")}`;
      },
    },
    {
      id: "stats",
      name: "📊 Stats Analyzer Bot",
      description: "Detailed statistics और insights generate करता है",
      icon: "📊",
      color: "#a855f7",
      status: "idle",
      action: async () => {
        const res = await fetch("/api/stats");
        const stats = await res.json();
        let output = `📊 Your Reels Statistics:\n\n`;
        output += `📱 Total Reels: ${stats.totalReels}\n`;
        output += `📂 Total Categories: ${stats.totalCategories}\n`;
        output += `⭐ Favorites: ${stats.totalFavorites}\n\n`;

        if (stats.categoryStats && stats.categoryStats.length > 0) {
          output += `📈 Category Breakdown:\n`;
          for (const cat of stats.categoryStats) {
            const bar = "█".repeat(Math.min(cat.count * 2, 20));
            output += `  ${cat.name || "Uncategorized"}: ${bar} ${cat.count}\n`;
          }
        } else {
          output += "No category data available yet. Add some reels first!";
        }
        return output;
      },
    },
    {
      id: "cleaner",
      name: "🧹 Tag Cleaner Bot",
      description: "सभी reels के tags को clean और normalize करता है",
      icon: "🧹",
      color: "#ec4899",
      status: "idle",
      action: async () => {
        const res = await fetch("/api/reels");
        const reels = await res.json();
        if (!Array.isArray(reels)) return "No reels found.";

        let cleaned = 0;
        for (const reel of reels) {
          if (reel.tags) {
            const tags = reel.tags
              .split(",")
              .map((t: string) => t.trim().toLowerCase())
              .filter(Boolean);
            const uniqueTags = [...new Set(tags)].join(", ");
            if (uniqueTags !== reel.tags) {
              await fetch(`/api/reels/${reel.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: uniqueTags }),
              });
              cleaned++;
            }
          }
        }
        return `✅ ${cleaned} reels के tags clean और normalize कर दिए!`;
      },
    },
    {
      id: "reporter",
      name: "📑 Weekly Report Bot",
      description: "Weekly summary report generate करता है",
      icon: "📑",
      color: "#14b8a6",
      status: "idle",
      action: async () => {
        const res = await fetch("/api/reels");
        const reels = await res.json();
        if (!Array.isArray(reels) || reels.length === 0)
          return "No reels to report on. Add some reels first!";

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recent = reels.filter(
          (r: { createdAt: string }) => new Date(r.createdAt) > weekAgo
        );
        const categories: Record<string, number> = {};
        for (const r of reels) {
          const cat = r.categoryName || "Uncategorized";
          categories[cat] = (categories[cat] || 0) + 1;
        }
        const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1]);

        let report = `📑 Weekly Report\n\n`;
        report += `📅 Period: Last 7 days\n`;
        report += `📱 New Reels Added: ${recent.length}\n`;
        report += `📊 Total Collection: ${reels.length}\n\n`;
        report += `🏆 Top Categories:\n`;
        for (const [name, count] of topCat.slice(0, 5)) {
          report += `  • ${name}: ${count} reels\n`;
        }
        report += `\n💡 Suggestion: `;
        if (reels.length < 10) {
          report += `अभी collection छोटा है। और reels add करो! 📱`;
        } else if (recent.length === 0) {
          report += `इस हफ्ते कोई नई reel नहीं आई। Active रहो! 🔥`;
        } else {
          report += `Great going! ${recent.length} new reels this week! Keep it up! 🚀`;
        }
        return report;
      },
    },
  ];

  const runBot = async (bot: Bot) => {
    setActiveBot(bot.id);
    setBotOutput("⚙️ Bot running... Please wait...");
    try {
      const result = await bot.action();
      setBotOutput(result);
    } catch (e) {
      console.error("Bot error:", e);
      setBotOutput("❌ Bot encountered an error. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center text-3xl animate-float shadow-lg shadow-neon-green/30">
            ⚡
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">Task Bots</h2>
            <p className="text-sm text-slate-400">
              Automated bots जो आपके reels collection को manage करते हैं — एक click में!
            </p>
          </div>
        </div>
      </div>

      {/* Bot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className={`glass-card rounded-2xl p-5 transition-all hover:scale-[1.02] cursor-pointer ${
              activeBot === bot.id ? "border-primary/40 shadow-lg shadow-primary/10" : ""
            }`}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
              style={{ background: `${bot.color}20` }}
            >
              {bot.icon}
            </div>
            <h4 className="font-bold text-white mb-1">{bot.name}</h4>
            <p className="text-xs text-slate-400 mb-4">{bot.description}</p>
            <button
              onClick={() => runBot(bot)}
              disabled={activeBot === bot.id && botOutput.includes("running")}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: `${bot.color}20`,
                color: bot.color,
                borderWidth: 1,
                borderColor: `${bot.color}30`,
              }}
            >
              {activeBot === bot.id && botOutput.includes("running")
                ? "⚙️ Running..."
                : "▶️ Run Bot"}
            </button>
          </div>
        ))}
      </div>

      {/* Bot Output */}
      {botOutput && (
        <div className="glass-card rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">🤖 Bot Output</h3>
            <button
              onClick={() => handleSpeak(botOutput)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isSpeaking
                  ? "bg-red-500/20 text-red-400"
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              }`}
            >
              {isSpeaking ? "🔇 Stop" : "🔊 Speak"}
            </button>
          </div>
          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-surface rounded-xl p-4 border border-surface-lighter">
            {botOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
