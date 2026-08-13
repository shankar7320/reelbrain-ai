"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface AddReelModalProps {
  categories: Category[];
  onClose: () => void;
  onAdded: () => void;
}

export default function AddReelModal({ categories, onClose, onAdded }: AddReelModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);

  const selectedCat = categories.find((c) => c.id === categoryId);

  const handleAutoAnalyze = async () => {
    if (!title && !description && !url) return;
    setAutoAnalyze(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${title} ${description}`, url }),
      });
      const data = await res.json();
      if (data.category) {
        const cat = categories.find((c) => c.name === data.category);
        if (cat) setCategoryId(cat.id);
        if (data.tags) setTags(data.tags.join(", "));
      }
    } catch (e) {
      console.error("Auto-analyze error:", e);
    } finally {
      setAutoAnalyze(false);
    }
  };

  const handleSave = async () => {
    if (!title) return;
    setSaving(true);

    try {
      // First analyze
      const analyzeRes = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${title} ${description}`, url }),
      });
      const analysis = await analyzeRes.json();

      const catName = selectedCat?.name || analysis.category || "Other";

      await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          url: url || null,
          categoryId: categoryId || null,
          categoryName: catName,
          aiSummary: analysis.summary || null,
          stepByStepGuide: analysis.guide || null,
          tags: tags || (analysis.tags || []).join(", "),
        }),
      });

      onAdded();
      onClose();
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up border border-primary/20">
        {/* Header */}
        <div className="p-5 border-b border-surface-lighter flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold gradient-text">Add New Reel</h2>
            <p className="text-xs text-slate-400 mt-0.5">AI will auto-analyze & categorize</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-lighter flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">📌 Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Top 5 AI tools for video editing"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none text-white placeholder-slate-500 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">📝 Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reel ka content describe karo..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none text-white placeholder-slate-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">🔗 URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none text-white placeholder-slate-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-slate-400">📂 Category</label>
              <button
                onClick={handleAutoAnalyze}
                disabled={autoAnalyze}
                className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
              >
                {autoAnalyze ? "⚙️ Analyzing..." : "🤖 Auto Detect"}
              </button>
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none text-white text-sm appearance-none"
            >
              <option value="">Auto Detect (AI will choose)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">🏷️ Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma separated: ai, editing, tutorial"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none text-white placeholder-slate-500 text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-lighter flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-surface-lighter text-slate-400 hover:text-white font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title || saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "⚙️ Saving..." : "💾 Save Reel"}
          </button>
        </div>
      </div>
    </div>
  );
}
