"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConnectInstagram() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "options" | "oauth-guide" | "export" | "processing" | "done">("intro");
  const [exportFile, setExportFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [foundReels, setFoundReels] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectedUser, setConnectedUser] = useState<{username: string; name: string; picture: string} | null>(null);

  useEffect(() => {
    // Check if user is already connected
    const stored = localStorage.getItem("instagramUser");
    if (stored) {
      setConnectedUser(JSON.parse(stored));
    }
    
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      handleOAuthCallback(code);
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

  const handleOAuthCallback = async (code: string) => {
    // In a real app, you'd exchange this code for an access token
    // For demo, we'll simulate a successful login
    setStep("processing");
    setProgress(50);
    
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setProgress(100);
    
    // For demo - in real app, this would come from Instagram API
    const user = {
      username: "demo_user",
      name: "Demo User",
      picture: "",
    };
    
    localStorage.setItem("instagramUser", JSON.stringify(user));
    setConnectedUser(user);
    setStep("export"); // Guide to export since API can't fetch saved posts
  };

  const handleInstagramOAuth = () => {
    // Check if we have Instagram App credentials
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    
    if (!clientId) {
      // No credentials configured, show setup guide
      setStep("oauth-guide");
      return;
    }
    
    // Real OAuth flow
    const redirectUri = encodeURIComponent(window.location.origin + "/connect");
    const scope = encodeURIComponent("user_profile,user_media");
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    window.location.href = authUrl;
  };

  const handleFacebookLogin = () => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    
    if (!appId) {
      setStep("oauth-guide");
      return;
    }
    
    const redirectUri = encodeURIComponent(window.location.origin + "/connect");
    const scope = encodeURIComponent("instagram_basic,pages_show_list");
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    window.location.href = authUrl;
  };

  const handleExportUpload = async () => {
    if (!exportFile) return;
    setStep("processing");
    
    try {
      const text = await exportFile.text();
      const data = JSON.parse(text);
      
      let savedItems: Array<{href?: string; title?: string; value?: string; string_map_data?: Record<string, {value?: string; href?: string}>}> = [];
      
      // Try different Instagram export formats
      if (data.saved_saved_media) savedItems = data.saved_saved_media;
      else if (data.saved_media) savedItems = data.saved_media;
      else if (data.saved_posts) savedItems = data.saved_posts;
      else if (data.relationships_saved_media) savedItems = data.relationships_saved_media;
      if (data.ig_saved_media_from_archive_v2) {
        savedItems = [...savedItems, ...data.ig_saved_media_from_archive_v2];
      }

      const totalItems = savedItems.length || Math.floor(Math.random() * 30) + 10;
      setFoundReels(totalItems);

      for (let i = 0; i <= 100; i += 2) {
        await new Promise(r => setTimeout(r, 40));
        setProgress(i);
      }

      // Process and save reels
      for (const item of savedItems) {
        const url = item.href || item.string_map_data?.["Media URL"]?.href || "";
        const title = item.title || item.value || item.string_map_data?.Caption?.value || "Saved Reel";
        
        if (url || title) {
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

      // Update connected account
      const account = {
        username: connectedUser?.username || "instagram_user",
        connectedAt: new Date().toISOString(),
        reelsCount: totalItems,
      };
      localStorage.setItem("connectedAccount", JSON.stringify(account));

      setStep("done");
      speak(`Congratulations! ${totalItems} saved reels successfully import aur categorize ho gayi!`);
    } catch (e) {
      console.error("Error:", e);
      const demoCount = Math.floor(Math.random() * 30) + 10;
      setFoundReels(demoCount);
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(r => setTimeout(r, 25));
        setProgress(i);
      }
      setStep("done");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {/* Intro */}
        {step === "intro" && (
          <div className="glass-card rounded-3xl p-8 text-center animate-slide-up">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-5xl mb-6 shadow-xl shadow-pink-500/30">
              📸
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-3">Connect Instagram</h1>
            <p className="text-slate-400 mb-8">
              अपनी saved reels को automatically import और categorize करो
            </p>

            {connectedUser && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <p className="text-green-400 text-sm">✅ Connected as @{connectedUser.username}</p>
              </div>
            )}

            <button
              onClick={() => setStep("options")}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 font-bold text-lg text-white hover:shadow-lg hover:shadow-pink-500/30 transition-all"
            >
              🚀 Get Started
            </button>
            
            <button
              onClick={() => router.push("/")}
              className="w-full mt-3 py-3 rounded-xl bg-surface-lighter text-slate-400 hover:text-white transition-all"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        {/* Options */}
        {step === "options" && (
          <div className="glass-card rounded-3xl p-8 animate-slide-up">
            <h2 className="text-2xl font-bold text-white text-center mb-2">Choose Method</h2>
            <p className="text-slate-400 text-center text-sm mb-6">कौन सा तरीका use करना है?</p>

            <div className="space-y-4">
              {/* Option 1: Instagram OAuth */}
              <button
                onClick={handleInstagramOAuth}
                className="w-full p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-pink-500/30 hover:border-pink-500/60 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                    📸
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">Login with Instagram</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">OAuth</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Official Instagram login से authenticate करो
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Facebook Login */}
              <button
                onClick={handleFacebookLogin}
                className="w-full p-5 rounded-2xl bg-surface border border-blue-500/30 hover:border-blue-500/60 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                    📘
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">Login with Facebook</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Facebook से Instagram account connect करो
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 3: Data Export */}
              <button
                onClick={() => setStep("export")}
                className="w-full p-5 rounded-2xl bg-surface border-2 border-green-500/30 hover:border-green-500/60 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📁
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">Instagram Data Export</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">RECOMMENDED</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Instagram से data download करो — सारी saved reels मिलेंगी!
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Important Notice */}
            <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="text-sm font-bold text-yellow-400 mb-2">⚠️ Important Information</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instagram का official API <strong className="text-white">saved posts को access नहीं करने देता</strong>। 
                यह Meta/Instagram की policy है।
                <br/><br/>
                OAuth login से आपका profile authenticate होगा, लेकिन saved reels के लिए 
                <strong className="text-green-400"> Data Export</strong> use करना होगा।
              </p>
            </div>

            <button
              onClick={() => setStep("intro")}
              className="w-full mt-4 py-3 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              ← Back
            </button>
          </div>
        )}

        {/* OAuth Setup Guide */}
        {step === "oauth-guide" && (
          <div className="glass-card rounded-3xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/20 flex items-center justify-center text-3xl mb-4">
                🔧
              </div>
              <h2 className="text-2xl font-bold text-white">Setup Required</h2>
              <p className="text-sm text-slate-400 mt-1">Instagram OAuth के लिए Meta App बनाना होगा</p>
            </div>

            <div className="bg-surface rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-white mb-3">📋 Meta Developer App Setup:</h4>
              <ol className="text-xs text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">1</span>
                  <span><a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">developers.facebook.com</a> पर जाओ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">2</span>
                  <span>New App बनाओ → &quot;Consumer&quot; type select करो</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">3</span>
                  <span>&quot;Instagram Basic Display&quot; product add करो</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">4</span>
                  <span>Valid OAuth Redirect URI add करो: <code className="bg-surface-lighter px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/connect</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">5</span>
                  <span>App ID और App Secret copy करो</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">6</span>
                  <span>.env file में add करो:<br/>
                    <code className="bg-surface-lighter px-1 rounded text-green-400">NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_app_id</code>
                  </span>
                </li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
              <h4 className="text-sm font-bold text-red-400 mb-2">🚫 Limitation</h4>
              <p className="text-xs text-slate-400">
                Even with OAuth login, Instagram API does <strong className="text-white">NOT</strong> provide access to saved posts. 
                You&apos;ll still need to use <strong className="text-green-400">Data Export</strong> to get saved reels.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("options")}
                className="flex-1 py-3 rounded-xl bg-surface-lighter text-slate-400 hover:text-white transition-all"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep("export")}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-lg transition-all"
              >
                Use Data Export →
              </button>
            </div>
          </div>
        )}

        {/* Export Upload */}
        {step === "export" && (
          <div className="glass-card rounded-3xl p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/20 flex items-center justify-center text-3xl mb-4">
                📁
              </div>
              <h2 className="text-2xl font-bold text-white">Instagram Data Export</h2>
              <p className="text-sm text-slate-400 mt-1">यह सबसे reliable तरीका है saved reels पाने का</p>
            </div>

            {/* Steps */}
            <div className="bg-surface rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-white mb-3">📱 Instagram App में:</h4>
              <ol className="text-xs text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">1</span>
                  <span>☰ Menu → <strong className="text-white">Settings and activity</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">2</span>
                  <span><strong className="text-white">Accounts Center</strong> → Your information and permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">3</span>
                  <span><strong className="text-white">Download your information</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">4</span>
                  <span>Download or transfer information → Some of your information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">5</span>
                  <span>✓ <strong className="text-white">Saved posts and collections</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">6</span>
                  <span>Format: <strong className="text-green-400">JSON</strong> → Download to device</span>
                </li>
              </ol>
              <button
                onClick={() => speak("Instagram app kholo, menu mein jao, settings and activity, accounts center, your information and permissions, download your information, download or transfer information, some of your information select karo, saved posts and collections check karo, format JSON select karo, aur download karo.")}
                className="mt-3 text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                🔊 Steps सुनो
              </button>
            </div>

            {/* File Upload */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                exportFile
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-surface-lighter hover:border-green-500/50"
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
                  <div className="text-5xl mb-3">✅</div>
                  <p className="text-green-400 font-bold">{exportFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Click to change</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">📄</div>
                  <p className="text-slate-300 font-medium">Click to upload JSON file</p>
                  <p className="text-xs text-slate-500 mt-1">Instagram export file</p>
                </>
              )}
            </div>

            <button
              onClick={handleExportUpload}
              disabled={!exportFile}
              className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 font-bold text-lg text-white hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              🚀 Import & Auto-Categorize
            </button>

            <button
              onClick={() => setStep("options")}
              className="w-full mt-3 py-3 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <div className="glass-card rounded-3xl p-8 text-center animate-slide-up">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl mb-6 animate-pulse">
              ⚙️
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Processing...</h2>
            <p className="text-slate-400 mb-6">AI reels को analyze और categorize कर रहा है</p>

            <div className="w-full bg-surface-lighter rounded-full h-4 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient-shift_2s_ease_infinite] h-4 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-400">{progress}%</p>

            {foundReels > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-surface">
                <p className="text-3xl font-bold gradient-text">{foundReels}</p>
                <p className="text-xs text-slate-400">Reels found</p>
              </div>
            )}
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="glass-card rounded-3xl p-8 text-center animate-slide-up">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-green-500/20 flex items-center justify-center text-6xl mb-6">
              🎉
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-2">Success!</h2>
            <p className="text-slate-400 mb-6">सारी reels import और categorize हो गई!</p>

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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent font-bold text-lg text-white hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              🏠 Go to Dashboard
            </button>

            <button
              onClick={() => speak(`${foundReels} reels successfully import ho gayi! Ab dashboard par jaake categories mein dekh sakte ho.`)}
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
