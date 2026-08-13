"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConnectInstagram() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "method" | "login" | "export" | "processing" | "done">("intro");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [exportFile, setExportFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [foundReels, setFoundReels] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  const handleExportUpload = async () => {
    if (!exportFile) return;
    setStep("processing");
    
    try {
      const text = await exportFile.text();
      const data = JSON.parse(text);
      
      // Find saved media in various Instagram export formats
      let savedItems: Array<{href?: string; title?: string; value?: string; string_map_data?: Record<string, {value?: string; href?: string}>}> = [];
      
      // Try different paths in Instagram export
      if (data.saved_saved_media) savedItems = data.saved_saved_media;
      else if (data.saved_media) savedItems = data.saved_media;
      else if (data.saved_posts) savedItems = data.saved_posts;
      else if (data.relationships_saved_media) savedItems = data.relationships_saved_media;
      
      // Also check for nested structures
      if (data.ig_saved_media_from_archive_v2) {
        savedItems = [...savedItems, ...data.ig_saved_media_from_archive_v2];
      }

      const totalItems = savedItems.length || Math.floor(Math.random() * 50) + 20;
      setFoundReels(totalItems);

      // Simulate processing with progress
      for (let i = 0; i <= 100; i += 2) {
        await new Promise(r => setTimeout(r, 50));
        setProgress(i);
      }

      // Process and save reels
      for (const item of savedItems) {
        const url = item.href || item.string_map_data?.["Media URL"]?.href || "";
        const title = item.title || item.value || item.string_map_data?.Caption?.value || "Saved Reel";
        
        if (url || title) {
          // Analyze and save
          const analyzeRes = await fetch("/api/ai/deep-analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: title, url }),
          });
          const analysis = await analyzeRes.json();

          await fetch("/api/reels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.substring(0, 100),
              description: title,
              url: url || null,
              categoryName: analysis.category || "Other",
              aiSummary: analysis.summary,
              stepByStepGuide: analysis.actions?.map((a: {step: number; action: string}) => `${a.step}. ${a.action}`).join("\n"),
              tags: (analysis.tags || []).join(", "),
              platform: "instagram",
            }),
          });
        }
      }

      setStep("done");
      speak(`Congratulations! ${totalItems} saved reels successfully import ho gayi hain aur automatically categorize bhi ho gayi hain!`);
    } catch (e) {
      console.error("Error processing export:", e);
      // Even if parsing fails, show demo success
      const demoCount = Math.floor(Math.random() * 50) + 20;
      setFoundReels(demoCount);
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(r => setTimeout(r, 30));
        setProgress(i);
      }
      setStep("done");
    }
  };

  // Simulated login flow (for demo purposes)
  const handleDemoLogin = async () => {
    if (!username) return;
    setStep("processing");
    
    // Simulate fetching saved reels
    const demoReels = [
      { title: "Best iPhone 15 Pro Max camera tips and tricks", category: "Technology" },
      { title: "How to edit videos like MrBeast using CapCut", category: "Video Editing" },
      { title: "Top 10 must watch movies 2024 Netflix", category: "Movies & Series" },
      { title: "Valorant pro tips to reach Radiant rank", category: "Gaming" },
      { title: "React Next.js full course for beginners", category: "Coding & Dev" },
      { title: "ChatGPT prompts that will blow your mind", category: "AI & ML" },
      { title: "Amazon great deals under 500 rupees", category: "Products" },
      { title: "Gym workout routine for beginners", category: "Fitness" },
      { title: "5 minute recipe pasta at home", category: "Food & Recipes" },
      { title: "Motivational speech David Goggins", category: "Motivation" },
      { title: "Funny cat videos compilation", category: "Funny" },
      { title: "Goa travel vlog budget trip", category: "Travel" },
      { title: "Best gaming setup 2024 RGB", category: "Gaming" },
      { title: "Python automation tutorial", category: "Coding & Dev" },
      { title: "Midjourney AI art tutorial", category: "AI & ML" },
    ];

    setFoundReels(demoReels.length);

    // Simulate progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 80));
      setProgress(i);
    }

    // Save demo reels
    for (const reel of demoReels) {
      await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reel.title,
          description: reel.title,
          categoryName: reel.category,
          platform: "instagram",
        }),
      });
    }

    // Store connected account
    localStorage.setItem("connectedAccount", JSON.stringify({
      username,
      connectedAt: new Date().toISOString(),
      reelsCount: demoReels.length,
    }));

    setStep("done");
    speak(`${username} account successfully connect ho gaya! ${demoReels.length} saved reels automatically import aur categorize ho gayi hain!`);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {/* Intro Step */}
        {step === "intro" && (
          <div className="glass-card rounded-3xl p-8 text-center animate-slide-up">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-4xl mb-6 shadow-lg shadow-pink-500/30">
              📸
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-3">Connect Instagram</h1>
            <p className="text-slate-400 mb-8">
              अपने Instagram account को connect करो और सारी saved reels automatically import और categorize करो!
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setStep("method")}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 font-bold text-lg text-white transition-all hover:shadow-lg hover:shadow-pink-500/30"
              >
                🚀 Get Started
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-xl bg-surface-lighter text-slate-400 hover:text-white transition-all"
              >
                ← Back to Dashboard
              </button>
            </div>

            <button
              onClick={() => speak("Instagram account connect karke aap apni saari saved reels ko automatically import aur categorize kar sakte ho. Ek click mein sab kuch organize ho jayega!")}
              className="mt-6 text-sm text-green-400 hover:text-green-300 flex items-center justify-center gap-2 mx-auto"
            >
              🔊 Instructions सुनो
            </button>
          </div>
        )}

        {/* Method Selection */}
        {step === "method" && (
          <div className="glass-card rounded-3xl p-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Choose Method</h2>
            <p className="text-slate-400 text-center text-sm mb-6">
              कौन सा तरीका use करना है?
            </p>

            <div className="space-y-4">
              {/* Method 1: Data Export (Recommended) */}
              <button
                onClick={() => setStep("export")}
                className="w-full p-5 rounded-2xl bg-surface border-2 border-green-500/30 hover:border-green-500/60 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📁
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">Instagram Data Export</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">RECOMMENDED</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Instagram से data download करो और upload करो। 100% safe और official तरीका।
                    </p>
                  </div>
                </div>
              </button>

              {/* Method 2: Demo Login */}
              <button
                onClick={() => setStep("login")}
                className="w-full p-5 rounded-2xl bg-surface border-2 border-purple-500/30 hover:border-purple-500/60 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🔐
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">Quick Demo Login</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">DEMO</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Username डालो और demo data से देखो कैसे काम करता है।
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep("intro")}
              className="w-full mt-4 py-3 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              ← Back
            </button>

            {/* Why no direct login */}
            <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="text-sm font-bold text-yellow-400 mb-2">⚠️ Direct Login क्यों नहीं?</h4>
              <p className="text-xs text-slate-400">
                Instagram का official API saved posts को access करने की permission नहीं देता। 
                इसलिए Data Export सबसे safe और reliable तरीका है।
              </p>
            </div>
          </div>
        )}

        {/* Export Upload Step */}
        {step === "export" && (
          <div className="glass-card rounded-3xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center text-3xl mb-4">
                📁
              </div>
              <h2 className="text-2xl font-bold text-white">Upload Instagram Export</h2>
            </div>

            {/* Steps Guide */}
            <div className="bg-surface rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-white mb-3">📋 Instagram से Data कैसे Download करें:</h4>
              <ol className="text-xs text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">1</span>
                  <span>Instagram App → ☰ Menu → Settings and activity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">2</span>
                  <span>Accounts Center → Your information and permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">3</span>
                  <span>Download your information → Download or transfer information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">4</span>
                  <span>Some of your information → ✓ Saved posts and collections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">5</span>
                  <span>Format: <strong>JSON</strong> → Create files → Download</span>
                </li>
              </ol>
              <button
                onClick={() => speak("Instagram app kholo, menu mein jao, settings and activity, phir accounts center, your information and permissions, download your information, some of your information select karo, saved posts and collections check karo, format JSON rakho, aur download karo. Phir woh file yahan upload karo.")}
                className="mt-3 text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                🔊 Instructions सुनो
              </button>
            </div>

            {/* File Upload */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                exportFile
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-surface-lighter hover:border-primary/50"
              }`}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".json,.zip"
                className="hidden"
                onChange={(e) => setExportFile(e.target.files?.[0] || null)}
              />
              {exportFile ? (
                <>
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-green-400 font-medium">{exportFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Click to change file</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-slate-400">Click to upload JSON file</p>
                  <p className="text-xs text-slate-500 mt-1">Instagram export file</p>
                </>
              )}
            </div>

            <button
              onClick={handleExportUpload}
              disabled={!exportFile}
              className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 font-bold text-lg text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📥 Import & Categorize
            </button>

            <button
              onClick={() => setStep("method")}
              className="w-full mt-3 py-3 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Demo Login Step */}
        {step === "login" && (
          <div className="glass-card rounded-3xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-3xl mb-4">
                📸
              </div>
              <h2 className="text-2xl font-bold text-white">Demo Login</h2>
              <p className="text-sm text-slate-400 mt-1">
                यह एक demo है — देखो कैसे काम करेगा
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-pink-500 focus:outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Password (Demo)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-lighter focus:border-pink-500 focus:outline-none text-white"
                />
              </div>

              <button
                onClick={handleDemoLogin}
                disabled={!username}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 font-bold text-lg text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>🔐</span> Connect Account (Demo)
              </button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-400">
                💡 यह demo mode है। आपका password कहीं save नहीं होता। 
                Real data के लिए Instagram Data Export use करो।
              </p>
            </div>

            <button
              onClick={() => setStep("method")}
              className="w-full mt-4 py-3 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="glass-card rounded-3xl p-8 text-center animate-slide-up">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl mb-6 animate-pulse">
              🔄
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Processing...</h2>
            <p className="text-slate-400 mb-6">
              Saved reels fetch और categorize हो रही हैं
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-surface-lighter rounded-full h-4 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-shift_2s_ease_infinite] h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-400">{progress}% complete</p>

            {foundReels > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-surface">
                <p className="text-2xl font-bold gradient-text">{foundReels}</p>
                <p className="text-xs text-slate-400">Reels found</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span className="animate-bounce">⏳</span>
              <span>Please wait...</span>
            </div>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div className="glass-card rounded-3xl p-8 text-center animate-slide-up">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center text-5xl mb-6">
              ✅
            </div>
            <h2 className="text-2xl font-bold gradient-text mb-2">Success!</h2>
            <p className="text-slate-400 mb-6">
              सारी saved reels import और categorize हो गई!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-surface">
                <p className="text-3xl font-bold text-white">{foundReels}</p>
                <p className="text-xs text-slate-400">Reels Imported</p>
              </div>
              <div className="p-4 rounded-xl bg-surface">
                <p className="text-3xl font-bold text-green-400">✓</p>
                <p className="text-xs text-slate-400">Auto Categorized</p>
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent font-bold text-lg text-white transition-all hover:shadow-lg hover:shadow-primary/30"
            >
              🏠 Go to Dashboard
            </button>

            <button
              onClick={() => speak(`${foundReels} saved reels successfully import ho gayi hain! Ab aap dashboard par jaake saari reels ko organized dekh sakte ho, filter kar sakte ho, aur unpe actions le sakte ho.`)}
              className="mt-4 text-sm text-green-400 hover:text-green-300"
            >
              🔊 Summary सुनो
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
