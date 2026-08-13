"use client";

import { useState } from "react";

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

interface ReelCardProps {
  reel: Reel;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
}

const categoryIcons: Record<string, string> = {
  "Movies & Series": "🎬",
  "Video Editing": "🎞️",
  "Gaming": "🎮",
  "Coding & Dev": "💻",
  "Technology": "🚀",
  "AI & ML": "🤖",
  "Products": "🛍️",
  "Music": "🎵",
  "Fitness": "💪",
  "Food & Recipes": "🍕",
  "Travel": "✈️",
  "Motivation": "🔥",
  "Funny": "😂",
  "Education": "📚",
  "Other": "📌",
};

const categoryColors: Record<string, string> = {
  "Movies & Series": "#ef4444",
  "Video Editing": "#f97316",
  "Gaming": "#22c55e",
  "Coding & Dev": "#3b82f6",
  "Technology": "#6366f1",
  "AI & ML": "#a855f7",
  "Products": "#ec4899",
  "Music": "#14b8a6",
  "Fitness": "#eab308",
  "Food & Recipes": "#f59e0b",
  "Travel": "#06b6d4",
  "Motivation": "#f43f5e",
  "Funny": "#84cc16",
  "Education": "#8b5cf6",
  "Other": "#64748b",
};

function speakText(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith("hi"));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    window.speechSynthesis.speak(utterance);
  }
}

export default function ReelCard({ reel, onDelete, onToggleFavorite }: ReelCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const icon = categoryIcons[reel.categoryName || "Other"] || "📌";
  const color = categoryColors[reel.categoryName || "Other"] || "#64748b";
  const tags = reel.tags ? reel.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const handleSpeak = (text: string) => {
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
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith("hi"));
    if (hindiVoice) utterance.voice = hindiVoice;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] group">
      {/* Category Bar */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-medium" style={{ color }}>
            {reel.categoryName || "Uncategorized"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(reel.id, !!reel.isFavorite)}
            className="text-lg hover:scale-125 transition-transform"
          >
            {reel.isFavorite ? "⭐" : "☆"}
          </button>
          <button
            onClick={() => onDelete(reel.id)}
            className="text-slate-500 hover:text-red-400 text-sm transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white text-lg mb-1 line-clamp-2">{reel.title}</h3>
        {reel.description && (
          <p className="text-sm text-slate-400 mb-3 line-clamp-2">{reel.description}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-surface-lighter text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* URL */}
        {reel.url && (
          <a
            href={reel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:text-primary-light mb-3 block truncate"
          >
            🔗 {reel.url}
          </a>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          {reel.aiSummary && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-1 py-2 px-3 rounded-lg bg-surface-lighter hover:bg-primary/20 text-xs font-medium text-slate-300 hover:text-white transition-all"
            >
              {expanded ? "🔼 Hide Summary" : "🤖 AI Summary"}
            </button>
          )}
          {reel.stepByStepGuide && (
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex-1 py-2 px-3 rounded-lg bg-surface-lighter hover:bg-accent/20 text-xs font-medium text-slate-300 hover:text-white transition-all"
            >
              {showGuide ? "🔼 Hide Guide" : "📋 Guide"}
            </button>
          )}
          {(reel.aiSummary || reel.stepByStepGuide) && (
            <button
              onClick={() => handleSpeak(reel.aiSummary || reel.stepByStepGuide || "")}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                isSpeaking
                  ? "bg-red-500/20 text-red-400 animate-pulse"
                  : "bg-surface-lighter hover:bg-green-500/20 text-slate-300 hover:text-green-400"
              }`}
            >
              {isSpeaking ? "🔇 Stop" : "🔊 Speak"}
            </button>
          )}
        </div>

        {/* Expandable AI Summary */}
        {expanded && reel.aiSummary && (
          <div className="mt-3 p-3 rounded-xl bg-surface text-sm text-slate-300 border border-primary/20 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-primary">🤖 AI Summary</span>
              <button
                onClick={() => handleSpeak(reel.aiSummary || "")}
                className="text-xs text-green-400 hover:text-green-300"
              >
                🔊 Speak this
              </button>
            </div>
            <p className="whitespace-pre-line">{reel.aiSummary}</p>
          </div>
        )}

        {/* Step by Step Guide */}
        {showGuide && reel.stepByStepGuide && (
          <div className="mt-3 p-3 rounded-xl bg-surface text-sm text-slate-300 border border-accent/20 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-accent">📋 Step-by-Step Guide</span>
              <button
                onClick={() => handleSpeak(reel.stepByStepGuide || "")}
                className="text-xs text-green-400 hover:text-green-300"
              >
                🔊 Speak this
              </button>
            </div>
            <p className="whitespace-pre-line">{reel.stepByStepGuide}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-surface-lighter flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {new Date(reel.createdAt).toLocaleDateString("hi-IN")}
        </span>
        <span className="text-xs text-slate-500">{reel.platform || "instagram"}</span>
      </div>
    </div>
  );
}
