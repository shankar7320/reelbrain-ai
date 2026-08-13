"use client";

import { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Product {
  name: string;
  estimatedPrice?: string;
  whereToBuy: { platform: string; link: string }[];
  searchQuery: string;
}

interface Tool {
  name: string;
  type: string;
  downloadLink: string;
  isFree: boolean;
}

interface Action {
  step: number;
  action: string;
  detail: string;
}

interface DeepAnalysis {
  category: string;
  confidence: number;
  contentType: "product" | "tutorial" | "entertainment" | "information" | "motivation";
  products: Product[];
  tools: Tool[];
  actions: Action[];
  summary: string;
  voiceScript: string;
  tags: string[];
}

interface SmartAnalyzerProps {
  categories: Category[];
  onReelAdded: () => void;
}

export default function SmartAnalyzer({ categories, onReelAdded }: SmartAnalyzerProps) {
  const [inputText, setInputText] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DeepAnalysis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingSection, setSpeakingSection] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const speak = (text: string, section?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingSection(null);
      return;
    }

    setIsSpeaking(true);
    setSpeakingSection(section || null);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingSection(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingSection(null);
    };
    
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith("hi"));
    if (hindiVoice) utterance.voice = hindiVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceInput = () => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported. Please use Chrome.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputText((prev) => prev + " " + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  };

  const handleAnalyze = async () => {
    if (!inputText && !inputUrl) return;
    setAnalyzing(true);
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch("/api/ai/deep-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, url: inputUrl }),
      });
      const data = await res.json();
      setResult(data);
      
      // Auto-speak the voice script
      if (data.voiceScript) {
        setTimeout(() => speak(data.voiceScript, "full"), 500);
      }
    } catch (e) {
      console.error("Analysis error:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    const cat = categories.find(c => c.name === result.category);
    
    try {
      await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: inputText.substring(0, 100) || inputUrl || "Analyzed Reel",
          description: inputText,
          url: inputUrl || null,
          categoryId: cat?.id || null,
          categoryName: result.category,
          aiSummary: result.summary,
          stepByStepGuide: result.actions.map(a => `${a.step}. ${a.action}`).join("\n"),
          tags: result.tags.join(", "),
        }),
      });
      setSaved(true);
      onReelAdded();
      speak("Reel successfully save ho gayi! Ab aap My Reels tab mein dekh sakte ho.");
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const contentTypeLabels: Record<string, { emoji: string; label: string; color: string }> = {
    product: { emoji: "🛍️", label: "Product Review", color: "#ec4899" },
    tutorial: { emoji: "📚", label: "Tutorial", color: "#3b82f6" },
    entertainment: { emoji: "🎬", label: "Entertainment", color: "#f97316" },
    information: { emoji: "📰", label: "Information", color: "#22c55e" },
    motivation: { emoji: "🔥", label: "Motivation", color: "#ef4444" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-accent to-neon-blue flex items-center justify-center text-4xl animate-float shadow-lg shadow-primary/40">
            🧠
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">Smart Reel Analyzer</h2>
            <p className="text-sm text-slate-400">
              Deep AI Analysis — Products, Tools, Actions सब कुछ extract करता है और बोल कर बताता है! 🔊
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">📝 Reel Description / Content</label>
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Reel ka content describe karo ya paste karo...

Examples:
• "This iPhone 15 Pro Max unboxing and review, best camera phone under 1.5 lakh"
• "How to edit videos like a pro using CapCut, step by step tutorial for beginners"
• "Best gaming setup 2024 with RGB keyboard mouse and 4K monitor from Amazon"
• "Motivational speech about discipline and success, David Goggins style"`}
                className="w-full h-36 px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-500 text-sm resize-none"
              />
              <button
                onClick={startVoiceInput}
                className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition-all ${
                  isListening
                    ? "bg-red-500/30 text-red-400 animate-pulse"
                    : "bg-surface-lighter text-slate-400 hover:text-white hover:bg-primary/20"
                }`}
              >
                🎤
              </button>
            </div>
            {isListening && (
              <p className="text-xs text-red-400 mt-1 animate-pulse flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                Listening... Hindi में बोलो!
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">🔗 URL (Optional)</label>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none text-white placeholder-slate-500 text-sm"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || (!inputText && !inputUrl)}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary via-accent to-neon-blue bg-[length:200%_100%] hover:bg-right font-bold text-lg text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {analyzing ? (
              <>
                <span className="animate-spin text-2xl">🔄</span>
                AI Deep Analyzing...
              </>
            ) : (
              <>
                🧠 Deep Analyze & Speak
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Category</p>
              <p className="text-lg font-bold text-white">{result.category}</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Content Type</p>
              <p className="text-lg font-bold" style={{ color: contentTypeLabels[result.contentType]?.color }}>
                {contentTypeLabels[result.contentType]?.emoji} {contentTypeLabels[result.contentType]?.label}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Confidence</p>
              <p className="text-lg font-bold text-green-400">{result.confidence}%</p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Items Found</p>
              <p className="text-lg font-bold text-accent">
                {result.products.length + result.tools.length} items
              </p>
            </div>
          </div>

          {/* Voice Control */}
          <div className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isSpeaking ? "bg-red-500/20 animate-pulse" : "bg-green-500/20"
              }`}>
                {isSpeaking ? "🔊" : "🔇"}
              </div>
              <div>
                <p className="font-medium text-white">Voice Output</p>
                <p className="text-xs text-slate-400">
                  {isSpeaking ? "Speaking... Click to stop" : "Click to hear full analysis"}
                </p>
              </div>
            </div>
            <button
              onClick={() => speak(result.voiceScript, "full")}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                isSpeaking && speakingSection === "full"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
              }`}
            >
              {isSpeaking && speakingSection === "full" ? "🔇 Stop" : "🔊 Speak All"}
            </button>
          </div>

          {/* Products */}
          {result.products.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🛍️ Products Found ({result.products.length})
                </h3>
                <button
                  onClick={() => {
                    const text = result.products.map(p => `${p.name}, available on ${p.whereToBuy.map(w => w.platform).join(", ")}`).join(". ");
                    speak(`Products found: ${text}`);
                  }}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  🔊 Speak
                </button>
              </div>
              <div className="space-y-3">
                {result.products.map((product, i) => (
                  <div key={i} className="bg-surface rounded-xl p-4 border border-pink-500/10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-white capitalize">{product.name}</h4>
                      {product.estimatedPrice && (
                        <span className="text-green-400 font-mono text-sm">{product.estimatedPrice}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-3">📍 यहां से खरीदें:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.whereToBuy.map((shop, j) => (
                        <a
                          key={j}
                          href={shop.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-surface-lighter text-xs font-medium text-slate-300 hover:text-white hover:bg-primary/20 transition-all flex items-center gap-1"
                        >
                          🔗 {shop.platform}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools/Software */}
          {result.tools.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🔧 Tools & Software ({result.tools.length})
                </h3>
                <button
                  onClick={() => {
                    const text = result.tools.map(t => `${t.name}, ${t.isFree ? "free hai" : "paid hai"}`).join(". ");
                    speak(`Tools used: ${text}`);
                  }}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  🔊 Speak
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.tools.map((tool, i) => (
                  <div key={i} className="bg-surface rounded-xl p-4 border border-blue-500/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white">{tool.name}</h4>
                        <p className="text-xs text-slate-400">{tool.type}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tool.isFree
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {tool.isFree ? "✅ FREE" : "💰 PAID"}
                      </span>
                    </div>
                    <a
                      href={tool.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-xs text-primary hover:text-primary-light"
                    >
                      📥 Download / Visit →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Steps */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📋 Step-by-Step Guide
              </h3>
              <button
                onClick={() => {
                  const text = result.actions.map(a => `Step ${a.step}: ${a.action}`).join(". ");
                  speak(text, "steps");
                }}
                className={`text-xs transition-all ${
                  speakingSection === "steps"
                    ? "text-red-400"
                    : "text-green-400 hover:text-green-300"
                }`}
              >
                {speakingSection === "steps" ? "🔇 Stop" : "🔊 Speak Steps"}
              </button>
            </div>
            <div className="space-y-2">
              {result.actions.map((action) => (
                <div
                  key={action.step}
                  className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-surface-lighter hover:border-primary/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {action.step}
                  </div>
                  <p className="text-sm text-slate-300 pt-1">{action.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              saved
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/30"
            }`}
          >
            {saved ? "✅ Saved to My Reels!" : "💾 Save to Collection"}
          </button>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: "🛍️", title: "Product Detection", desc: "Products + buying links" },
          { icon: "🔧", title: "Tool Finder", desc: "Software + download links" },
          { icon: "📋", title: "Action Extraction", desc: "Step-by-step guide" },
          { icon: "🔊", title: "Voice Output", desc: "Hindi में बोल कर बताए" },
        ].map((f) => (
          <div key={f.title} className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">{f.icon}</div>
            <h4 className="font-bold text-white text-sm">{f.title}</h4>
            <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
