"use client";

import { useState, useRef } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface BulkImportProps {
  categories: Category[];
  onImported: () => void;
}

interface ParsedReel {
  url?: string;
  title: string;
  description?: string;
  detected: boolean;
}

export default function BulkImport({ categories, onImported }: BulkImportProps) {
  const [bulkText, setBulkText] = useState("");
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Parse bulk text (URLs, titles, descriptions)
  const parseBulkText = (text: string): ParsedReel[] => {
    const lines = text.split("\n").filter((l) => l.trim());
    const reels: ParsedReel[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Check if it's a URL
      if (trimmed.match(/^https?:\/\//i)) {
        reels.push({
          url: trimmed,
          title: extractTitleFromUrl(trimmed),
          detected: true,
        });
      } else if (trimmed.length > 5) {
        // It's a description/title
        reels.push({
          title: trimmed.substring(0, 100),
          description: trimmed,
          detected: true,
        });
      }
    }
    return reels;
  };

  const extractTitleFromUrl = (url: string): string => {
    if (url.includes("instagram.com/reel/")) {
      const match = url.match(/reel\/([^/?]+)/);
      return match ? `Instagram Reel: ${match[1]}` : "Instagram Reel";
    }
    if (url.includes("instagram.com/p/")) {
      const match = url.match(/\/p\/([^/?]+)/);
      return match ? `Instagram Post: ${match[1]}` : "Instagram Post";
    }
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return "YouTube Video";
    }
    if (url.includes("tiktok.com")) {
      return "TikTok Video";
    }
    return "Saved Video";
  };

  // Parse Instagram data export JSON
  const parseInstagramExport = async (file: File): Promise<ParsedReel[]> => {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      const reels: ParsedReel[] = [];

      // Instagram export format can vary, try multiple paths
      const savedItems =
        data.saved_saved_media ||
        data.saved_media ||
        data.saved_posts ||
        data.relationships_permanent_follow_requests ||
        [];

      if (Array.isArray(savedItems)) {
        for (const item of savedItems) {
          const url = item.href || item.url || item.uri || "";
          const title = item.title || item.value || extractTitleFromUrl(url);
          if (url || title) {
            reels.push({
              url: url || undefined,
              title: title || "Saved Item",
              description: item.string_map_data?.Caption?.value || "",
              detected: true,
            });
          }
        }
      }

      // Also try nested structure
      if (data.ig_saved_media_from_archive_v2) {
        for (const item of data.ig_saved_media_from_archive_v2) {
          reels.push({
            url: item.string_map_data?.["Media URL"]?.href || "",
            title: item.title || "Saved Media",
            detected: true,
          });
        }
      }

      return reels;
    } catch {
      console.error("Failed to parse JSON");
      return [];
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setResults([]);
    let reelsToImport: ParsedReel[] = [];

    // From bulk text
    if (bulkText.trim()) {
      reelsToImport = [...reelsToImport, ...parseBulkText(bulkText)];
    }

    // From JSON file
    if (jsonFile) {
      const jsonReels = await parseInstagramExport(jsonFile);
      reelsToImport = [...reelsToImport, ...jsonReels];
    }

    if (reelsToImport.length === 0) {
      setResults(["❌ No reels found to import. Please paste URLs or upload Instagram export."]);
      setImporting(false);
      return;
    }

    setProgress({ current: 0, total: reelsToImport.length });
    const importResults: string[] = [];

    for (let i = 0; i < reelsToImport.length; i++) {
      const reel = reelsToImport[i];
      setProgress({ current: i + 1, total: reelsToImport.length });

      try {
        // Analyze with AI
        const analyzeRes = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `${reel.title} ${reel.description || ""}`,
            url: reel.url,
          }),
        });
        const analysis = await analyzeRes.json();

        // Save reel
        await fetch("/api/reels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: reel.title,
            description: reel.description,
            url: reel.url || null,
            categoryName: analysis.category || "Other",
            aiSummary: analysis.summary,
            stepByStepGuide: analysis.guide,
            tags: (analysis.tags || []).join(", "),
          }),
        });

        importResults.push(`✅ ${reel.title.substring(0, 40)}... → ${analysis.category}`);
      } catch {
        importResults.push(`❌ Failed: ${reel.title.substring(0, 40)}...`);
      }
    }

    setResults(importResults);
    setImporting(false);
    setBulkText("");
    setJsonFile(null);
    if (fileRef.current) fileRef.current.value = "";
    onImported();

    // Speak summary
    speak(`Import complete! ${importResults.filter((r) => r.startsWith("✅")).length} reels successfully imported out of ${reelsToImport.length}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-orange to-neon-pink flex items-center justify-center text-3xl animate-float shadow-lg shadow-neon-orange/30">
            📥
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">Bulk Import</h2>
            <p className="text-sm text-slate-400">
              एक साथ सारी reels import करो — URLs paste करो या Instagram export upload करो
            </p>
          </div>
        </div>

        {/* Instagram Export Guide */}
        <div className="bg-surface rounded-xl p-4 border border-yellow-500/20 mb-4">
          <h4 className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
            💡 Instagram से Saved Reels कैसे Export करें?
          </h4>
          <ol className="text-xs text-slate-400 space-y-1">
            <li>1️⃣ Instagram App → Settings → Account Center</li>
            <li>2️⃣ Your information and permissions → Download your information</li>
            <li>3️⃣ Select &quot;Some of your information&quot; → Saved posts and collections</li>
            <li>4️⃣ Format: JSON, Date range: All time → Download</li>
            <li>5️⃣ JSON file यहां upload करो ⬇️</li>
          </ol>
          <button
            onClick={() => speak("Instagram se saved reels export karne ke liye, Instagram app open karo, Settings mein jao, Account Center, phir Your information and permissions, Download your information select karo, Some of your information choose karo, Saved posts and collections select karo, Format JSON rakho, aur download karo. Phir woh JSON file yahan upload karo.")}
            className="mt-3 text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
          >
            🔊 Instructions सुनो
          </button>
        </div>
      </div>

      {/* Import Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Method 1: Paste URLs */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            📋 Method 1: URLs/Text Paste करो
          </h3>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Paste URLs or descriptions (one per line):

https://www.instagram.com/reel/ABC123
https://www.instagram.com/reel/XYZ789
Top 5 AI tools for video editing
Movie recommendation: Inception
Gaming tips for Valorant
...`}
            className="w-full h-48 px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none text-white placeholder-slate-500 text-sm resize-none font-mono"
          />
          <p className="text-xs text-slate-500 mt-2">
            📌 हर line एक नई reel होगी — URLs या descriptions paste करो
          </p>
        </div>

        {/* Method 2: Upload JSON */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            📁 Method 2: Instagram Export Upload करो
          </h3>
          <div
            className="border-2 border-dashed border-surface-lighter rounded-xl p-8 text-center hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
            />
            <div className="text-4xl mb-3">📄</div>
            {jsonFile ? (
              <p className="text-green-400 font-medium">{jsonFile.name}</p>
            ) : (
              <>
                <p className="text-slate-400 text-sm">Click to upload JSON file</p>
                <p className="text-slate-500 text-xs mt-1">Instagram export से</p>
              </>
            )}
          </div>
          {jsonFile && (
            <button
              onClick={() => {
                setJsonFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="mt-3 text-xs text-red-400 hover:text-red-300"
            >
              ✕ Remove file
            </button>
          )}
        </div>
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={importing || (!bulkText.trim() && !jsonFile)}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-neon-orange to-neon-pink font-bold text-lg text-white transition-all hover:shadow-lg hover:shadow-neon-orange/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {importing ? (
          <>
            <span className="animate-spin">⚙️</span>
            Importing... {progress.current}/{progress.total}
          </>
        ) : (
          <>
            🚀 Start Bulk Import
          </>
        )}
      </button>

      {/* Progress */}
      {importing && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Progress</span>
            <span className="text-sm text-white font-mono">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-surface-lighter rounded-full h-3">
            <div
              className="bg-gradient-to-r from-neon-orange to-neon-pink h-3 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="glass-card rounded-2xl p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">📊 Import Results</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-400">
                ✅ {results.filter((r) => r.startsWith("✅")).length} success
              </span>
              <span className="text-xs text-red-400">
                ❌ {results.filter((r) => r.startsWith("❌")).length} failed
              </span>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {results.map((r, i) => (
              <p
                key={i}
                className={`text-xs font-mono py-1 ${
                  r.startsWith("✅") ? "text-green-400" : "text-red-400"
                }`}
              >
                {r}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
