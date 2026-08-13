"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onAddClick: () => void;
}

interface ConnectedAccount {
  username: string;
  connectedAt: string;
  reelsCount: number;
}

export default function Header({ searchQuery, setSearchQuery, onAddClick }: HeaderProps) {
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    // Check for connected account
    const stored = localStorage.getItem("connectedAccount");
    if (stored) {
      setConnectedAccount(JSON.parse(stored));
    }
  }, []);

  const handleDisconnect = () => {
    localStorage.removeItem("connectedAccount");
    setConnectedAccount(null);
    setShowAccountMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl shadow-lg shadow-primary/30">
              🧠
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">ReelBrain AI</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Smart Reels Manager</p>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input
                type="text"
                placeholder="Search reels, tags, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm text-white placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Connected Account / Connect Button */}
            {connectedAccount ? (
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-pink-500/30 hover:border-pink-500/50 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-xs">
                    📸
                  </div>
                  <span className="text-sm text-white hidden sm:inline">@{connectedAccount.username}</span>
                  <span className="text-xs text-green-400">●</span>
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 glass-card rounded-xl p-4 shadow-xl border border-surface-lighter animate-slide-up">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-surface-lighter">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-lg">
                        📸
                      </div>
                      <div>
                        <p className="font-bold text-white">@{connectedAccount.username}</p>
                        <p className="text-xs text-green-400">Connected</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Reels Imported</span>
                        <span className="text-white font-medium">{connectedAccount.reelsCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Connected</span>
                        <span className="text-white font-medium">
                          {new Date(connectedAccount.connectedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Link
                        href="/connect"
                        className="block w-full py-2 px-3 rounded-lg bg-surface-lighter text-center text-sm text-slate-300 hover:text-white transition-all"
                      >
                        🔄 Sync Again
                      </Link>
                      <button
                        onClick={handleDisconnect}
                        className="w-full py-2 px-3 rounded-lg bg-red-500/10 text-center text-sm text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/connect"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-pink-500/30 transition-all"
              >
                <span>📸</span>
                <span className="hidden sm:inline">Connect Instagram</span>
              </Link>
            )}

            {/* Add Button */}
            <button
              onClick={onAddClick}
              className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-primary to-accent rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>+</span>
              <span className="hidden sm:inline">Add Reel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop for menu */}
      {showAccountMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)} />
      )}
    </header>
  );
}
