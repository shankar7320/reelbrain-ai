"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface WelcomeScreenProps {
  onClose: () => void;
}

export default function WelcomeScreen({ onClose }: WelcomeScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Auto speak welcome message
    setTimeout(() => {
      speak("Welcome to ReelBrain AI! Main aapki Instagram saved reels ko automatically organize karunga. Chalo shuru karte hain!");
    }, 500);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const steps = [
    {
      icon: "🧠",
      title: "Welcome to ReelBrain AI!",
      subtitle: "आपका Smart Reels Manager",
      description: "मैं आपकी Instagram saved reels को automatically organize करूंगा। Products ढूंढूंगा, Step-by-step guides बनाऊंगा, और सब कुछ बोल कर बताऊंगा!",
      voiceText: "Main aapki Instagram saved reels ko automatically organize karunga. Products dhundhunga, Step by step guides banaunga, aur sab kuch bol kar bataunga!",
    },
    {
      icon: "📸",
      title: "Instagram से Reels Import करो",
      subtitle: "2 Easy Methods",
      description: `
**Method 1: Instagram Data Export (Best)**
1. Instagram App → Settings → Download your information
2. Saved posts select करो
3. JSON download करो
4. यहां upload करो
5. सारी reels automatically import + categorize!

**Method 2: Manual Add**
- Smart Analyzer में reel describe करो
- AI automatically categorize करेगा
      `,
      voiceText: "Instagram se reels import karne ke liye, Instagram app mein jao, settings, download your information, saved posts select karo, JSON download karo, aur yahan upload karo. Saari reels automatically import aur categorize ho jayengi!",
    },
    {
      icon: "🤖",
      title: "AI क्या-क्या करता है?",
      subtitle: "Smart Features",
      description: `
🏷️ **Auto Categorization**
Movies, Gaming, Coding, AI, Products - सब automatic

🛍️ **Product Detection**
Product मिलने पर Amazon, Flipkart links

🔧 **Tool Finder**
कौन सा software use हुआ है + download links

📋 **Step-by-Step Guide**
Video में जो actions हैं वो steps में

🔊 **Voice Output**
सब कुछ Hindi में बोल कर बताता है!
      `,
      voiceText: "AI automatically categorize karega, products detect karega with buying links, tools find karega with download links, step by step guide banayega, aur sab kuch Hindi mein bol kar batayega!",
    },
    {
      icon: "⚡",
      title: "Task Bots",
      subtitle: "Automation at your fingertips",
      description: `
🏷️ **Auto Categorizer Bot**
Uncategorized reels ko automatically categorize

📝 **Bulk Summarizer Bot**
Saari reels ko AI summaries add

🔍 **Duplicate Finder Bot**
Duplicate reels dhundho

📊 **Stats Analyzer Bot**
Detailed statistics generate

📑 **Weekly Report Bot**
Weekly summary report
      `,
      voiceText: "Task bots se aap ek click mein saari reels categorize kar sakte ho, summaries add kar sakte ho, duplicates dhundh sakte ho, aur reports generate kar sakte ho!",
    },
    {
      icon: "🚀",
      title: "Let's Get Started!",
      subtitle: "अब शुरू करते हैं",
      description: "Instagram connect करो और अपनी सारी saved reels को organize करो। एक click में सब कुछ हो जाएगा!",
      voiceText: "Chalo shuru karte hain! Instagram connect karo aur apni saari saved reels ko organize karo. Ek click mein sab kuch ho jayega!",
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      speak(steps[step + 1].voiceText);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      speak(steps[step - 1].voiceText);
    }
  };

  const handleStart = () => {
    window.speechSynthesis.cancel();
    onClose();
    router.push("/connect");
  };

  const handleSkip = () => {
    window.speechSynthesis.cancel();
    onClose();
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-gradient-to-r from-primary to-accent"
                  : i < step
                  ? "w-4 bg-primary/50"
                  : "w-4 bg-surface-lighter"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 animate-slide-up">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary via-accent to-neon-blue flex items-center justify-center text-5xl mb-6 shadow-xl shadow-primary/30 animate-float">
            {currentStep.icon}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center gradient-text mb-2">
            {currentStep.title}
          </h1>
          <p className="text-center text-slate-400 mb-6">{currentStep.subtitle}</p>

          {/* Description */}
          <div className="bg-surface rounded-2xl p-6 mb-6 max-h-64 overflow-y-auto">
            <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {currentStep.description.split("**").map((part, i) =>
                i % 2 === 1 ? (
                  <strong key={i} className="text-white">
                    {part}
                  </strong>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </div>
          </div>

          {/* Voice Button */}
          <button
            onClick={() => speak(currentStep.voiceText)}
            className={`w-full py-3 rounded-xl mb-6 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              isSpeaking
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
            }`}
          >
            {isSpeaking ? (
              <>
                <span className="animate-pulse">🔊</span> Speaking... Click to stop
              </>
            ) : (
              <>
                🔊 यह सुनो (Listen in Hindi)
              </>
            )}
          </button>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-6 py-3 rounded-xl bg-surface-lighter text-slate-300 hover:text-white transition-all"
              >
                ← Back
              </button>
            )}
            
            {step < steps.length - 1 ? (
              <>
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 rounded-xl bg-surface-lighter text-slate-400 hover:text-white transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                  Next →
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 rounded-xl bg-surface-lighter text-slate-400 hover:text-white transition-all"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleStart}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-bold hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2"
                >
                  📸 Connect Instagram
                </button>
              </>
            )}
          </div>
        </div>

        {/* Features Pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {["🏷️ Auto Categorize", "🔊 Voice Output", "🛍️ Product Links", "📋 Step Guide", "⚡ Task Bots"].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 rounded-full bg-surface text-xs text-slate-400 border border-surface-lighter"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
