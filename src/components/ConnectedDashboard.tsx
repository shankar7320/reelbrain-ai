"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ConnectedAccount {
  username: string;
  connectedAt: string;
  reelsCount: number;
}

interface Stats {
  totalReels: number;
  totalCategories: number;
  totalFavorites: number;
  categoryStats: { name: string; count: number }[];
}

export default function ConnectedDashboard({ stats }: { stats: Stats }) {
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("connectedAccount");
    if (stored) {
      setConnectedAccount(JSON.parse(stored));
    }
  }, []);

  const speak = (text: string) => {
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
    window.speechSynthesis.speak(utterance);
  };

  if (!connectedAccount) {
    return (
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 flex items-center justify-center text-3xl border-2 border-dashed border-pink-500/30">
              📸
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Connect Instagram</h3>
              <p className="text-sm text-slate-400">
                Automatically import और categorize करो सारी saved reels
              </p>
            </div>
          </div>
          <Link
            href="/connect"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all"
          >
            Connect Now →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 mb-6 border border-green-500/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/20">
            📸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">@{connectedAccount.username}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Connected
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {connectedAccount.reelsCount} reels imported • Connected {new Date(connectedAccount.connectedAt).toLocaleDateString("hi-IN")}
            </p>
          </div>
        </div>
        <Link
          href="/connect"
          className="px-4 py-2 rounded-xl bg-surface-lighter text-sm text-slate-300 hover:text-white transition-all"
        >
          🔄 Sync
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-surface text-center">
          <p className="text-xl font-bold text-white">{stats.totalReels}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
        <div className="p-3 rounded-xl bg-surface text-center">
          <p className="text-xl font-bold text-green-400">{stats.categoryStats.filter(s => s.name).length}</p>
          <p className="text-xs text-slate-400">Categorized</p>
        </div>
        <div className="p-3 rounded-xl bg-surface text-center">
          <p className="text-xl font-bold text-yellow-400">{stats.totalFavorites}</p>
          <p className="text-xs text-slate-400">Favorites</p>
        </div>
        <div className="p-3 rounded-xl bg-surface text-center">
          <p className="text-xl font-bold text-purple-400">{stats.totalCategories}</p>
          <p className="text-xs text-slate-400">Categories</p>
        </div>
      </div>

      {/* Voice Summary */}
      <button
        onClick={() => {
          const topCats = stats.categoryStats.slice(0, 3).map(c => c.name || "Other").join(", ");
          speak(`Aapke account mein total ${stats.totalReels} reels hain. Top categories hain: ${topCats}. ${stats.totalFavorites} reels favorite hain.`);
        }}
        className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          isSpeaking
            ? "bg-red-500/20 text-red-400"
            : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
        }`}
      >
        {isSpeaking ? "🔇 Stop" : "🔊 Account Summary सुनो"}
      </button>
    </div>
  );
}
