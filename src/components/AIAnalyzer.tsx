"use client";

import { useState, useRef, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface AnalysisResult {
  category: string;
  confidence: number;
  tags: string[];
  summary: string;
  guide: string;
  analyzedText: string;
}

interface AIAnalyzerProps {
  categories: Category[];
  onReelAdded: () => void;
}

export default function AIAnalyzer({ categories, onReelAdded }: AIAnalyzerProps) {
  const [inputText, setInputText] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  function createRecognition(): unknown {
    if (typeof window === "undefined") return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) return null;
    return new SR();
  }

  // Load voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handleAnalyze = async () => {
    if (!inputText && !inputUrl) return;
    setAnalyzing(true);
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, url: inputUrl }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error("Analysis error:", e);
    } finally {
      setAnalyzing(false);
    }
  };

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
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith("hi"));
    if (hindiVoice) utterance.voice = hindiVoice;
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeakAll = () => {
    if (!result) return;
    const fullText = `Category: ${result.category}. Confidence: ${result.confidence} percent. Summary: ${result.summary}. Guide: ${result.guide}`;
    handleSpeak(fullText);
  };

  const handleSaveAsReel = async () => {
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
          stepByStepGuide: result.guide,
          tags: result.tags.join(", "),
        }),
      });
      setSaved(true);
      onReelAdded();
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const startVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = createRecognition() as any;
    if (!recognition) {
      alert("Voice input is not supported in your browser. Please use Chrome.");
      return;
    }

    recognitionRef.current = recognition;
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev: string) => prev + " " + transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setIsListening(true);
    recognition.start();
  };

  return (
    <div className="space-y-6">
      {/* AI Analyzer Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl animate-float shadow-lg shadow-primary/30">
            🤖
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">AI Reel Analyzer</h2>
            <p className="text-sm text-slate-400">
              Reel ka description ya URL paste करो — AI automatically category, summary, और guide बनाएगा 🎯
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">📝 Reel Description / Content</label>
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Reel ka content yahan paste karo ya describe karo... jaise: 'This reel shows top 5 AI tools for video editing with after effects tutorial'"
                className="w-full h-32 px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-500 text-sm resize-none"
              />
              <button
                onClick={startVoiceInput}
                className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
                  isListening
                    ? "bg-red-500/20 text-red-400 animate-pulse"
                    : "bg-surface-lighter text-slate-400 hover:text-white"
                }`}
                title="Voice Input"
              >
                🎤
              </button>
            </div>
            {isListening && (
              <p className="text-xs text-red-400 mt-1 animate-pulse">
                🎤 Listening... बोलना शुरू करो!
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">🔗 Reel URL (Optional)</label>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-500 text-sm"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || (!inputText && !inputUrl)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent font-bold text-white transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="animate-spin">⚙️</span> AI Analyzing...
              </>
            ) : (
              <>
                🧠 Analyze with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Category Result */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">📊 Analysis Result</h3>
              <button
                onClick={handleSpeakAll}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  isSpeaking
                    ? "bg-red-500/20 text-red-400 animate-pulse"
                    : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                }`}
              >
                {isSpeaking ? "🔇 Stop Speaking" : "🔊 Speak Full Analysis"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Category */}
              <div className="p-4 rounded-xl bg-surface border border-primary/20">
                <p className="text-xs text-slate-400 mb-1">Category</p>
                <p className="text-xl font-bold text-white">{result.category}</p>
              </div>
              {/* Confidence */}
              <div className="p-4 rounded-xl bg-surface border border-green-500/20">
                <p className="text-xs text-slate-400 mb-1">Confidence</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-green-400">{result.confidence}%</p>
                  <div className="flex-1 bg-surface-lighter rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
              {/* Tags */}
              <div className="p-4 rounded-xl bg-surface border border-accent/20">
                <p className="text-xs text-slate-400 mb-1">Tags Found</p>
                <p className="text-xl font-bold text-accent">{result.tags.length}</p>
              </div>
            </div>

            {/* Tags */}
            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
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
          </div>

          {/* AI Summary */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🤖 AI Summary
              </h3>
              <button
                onClick={() => handleSpeak(result.summary)}
                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                🔊 Speak
              </button>
            </div>
            <p className="text-slate-300 whitespace-pre-line leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Step by Step Guide */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📋 Step-by-Step Guide
              </h3>
              <button
                onClick={() => handleSpeak(result.guide)}
                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                🔊 Speak
              </button>
            </div>
            <p className="text-slate-300 whitespace-pre-line leading-relaxed">
              {result.guide}
            </p>
          </div>

          {/* Save as Reel Button */}
          <button
            onClick={handleSaveAsReel}
            disabled={saved}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              saved
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-right text-white shadow-lg shadow-primary/20 hover:shadow-primary/40"
            }`}
          >
            {saved ? (
              <>✅ Saved to My Reels!</>
            ) : (
              <>💾 Save to My Reels Collection</>
            )}
          </button>
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="text-3xl mb-3">🏷️</div>
          <h4 className="font-bold text-white mb-1">Auto Categorize</h4>
          <p className="text-xs text-slate-400">
            AI automatically detect करता है कि reel किस category से belong करती है — Movies, Gaming, Coding, AI, etc.
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-3xl mb-3">🔊</div>
          <h4 className="font-bold text-white mb-1">Voice Output</h4>
          <p className="text-xs text-slate-400">
            सारी analysis बोल कर बताता है Hindi में! Text पढ़ने की ज़रूरत नहीं — सुनो और समझो।
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <div className="text-3xl mb-3">📋</div>
          <h4 className="font-bold text-white mb-1">Step-by-Step Guide</h4>
          <p className="text-xs text-slate-400">
            हर reel के लिए actionable steps देता है ताकि आप content को actually use कर सको।
          </p>
        </div>
      </div>
    </div>
  );
}
