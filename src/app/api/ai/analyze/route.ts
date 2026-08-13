import { NextResponse } from "next/server";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Movies & Series": ["movie", "film", "series", "netflix", "watch", "trailer", "cinematic", "scene", "actor", "actress", "bollywood", "hollywood", "webseries", "drama", "thriller", "horror", "comedy film", "imdb", "review", "recommendation", "must watch", "binge"],
  "Video Editing": ["edit", "editing", "premiere", "after effects", "davinci", "resolve", "capcut", "transition", "vfx", "visual effects", "color grading", "motion graphics", "animation", "keyframe", "render", "timeline", "cut", "montage"],
  "Gaming": ["game", "gaming", "gamer", "pubg", "valorant", "gta", "minecraft", "fortnite", "esports", "playstation", "xbox", "pc gaming", "mobile game", "fps", "rpg", "gameplay", "walkthrough", "boss fight", "level", "stream"],
  "Coding & Dev": ["code", "coding", "programming", "developer", "javascript", "python", "react", "nextjs", "web dev", "api", "github", "frontend", "backend", "fullstack", "css", "html", "bug", "debug", "deploy", "algorithm", "leetcode"],
  "Technology": ["tech", "technology", "gadget", "smartphone", "laptop", "review", "specs", "unboxing", "iphone", "android", "samsung", "apple", "google", "device", "innovation", "startup", "saas", "software"],
  "AI & ML": ["ai", "artificial intelligence", "machine learning", "chatgpt", "openai", "midjourney", "stable diffusion", "neural", "deep learning", "model", "prompt", "gpt", "gemini", "claude", "copilot", "automation", "llm", "generative"],
  "Products": ["product", "buy", "amazon", "flipkart", "deal", "discount", "review", "unboxing", "worth", "price", "budget", "premium", "best", "top 5", "top 10", "recommendation", "accessories", "gadget"],
  "Music": ["music", "song", "singer", "beat", "melody", "remix", "cover", "guitar", "piano", "spotify", "rap", "hip hop", "lofi", "playlist", "concert", "album", "band"],
  "Fitness": ["fitness", "gym", "workout", "exercise", "muscle", "protein", "diet", "body", "weight", "cardio", "yoga", "running", "pushup", "abs", "transformation", "health"],
  "Food & Recipes": ["food", "recipe", "cook", "cooking", "restaurant", "dish", "meal", "kitchen", "chef", "taste", "delicious", "snack", "breakfast", "lunch", "dinner", "biryani", "pizza"],
  "Travel": ["travel", "trip", "destination", "explore", "tourist", "hotel", "flight", "vacation", "adventure", "mountain", "beach", "road trip", "backpack", "vlog", "wanderlust"],
  "Motivation": ["motivation", "motivational", "inspire", "success", "hustle", "grind", "mindset", "discipline", "focus", "goal", "dream", "believe", "consistency", "never give up", "sigma"],
  "Funny": ["funny", "meme", "comedy", "laugh", "joke", "prank", "hilarious", "roast", "sarcasm", "trolling", "viral", "cringe"],
  "Education": ["learn", "education", "study", "course", "tutorial", "explain", "knowledge", "science", "math", "history", "english", "skill", "certification", "degree", "university"],
};

function analyzeText(text: string): {
  category: string;
  confidence: number;
  tags: string[];
  summary: string;
  guide: string;
} {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  const matchedTags: string[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(" ").length;
        matchedTags.push(keyword);
      }
    }
    if (score > 0) {
      scores[category] = score;
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const bestCategory = sorted.length > 0 ? sorted[0][0] : "Other";
  const maxScore = sorted.length > 0 ? sorted[0][1] : 0;
  const confidence = Math.min(95, Math.max(30, maxScore * 15));

  const uniqueTags = [...new Set(matchedTags)].slice(0, 8);

  const summary = generateSummary(bestCategory, text, uniqueTags);
  const guide = generateGuide(bestCategory, text, uniqueTags);

  return {
    category: bestCategory,
    confidence,
    tags: uniqueTags,
    summary,
    guide,
  };
}

function generateSummary(category: string, text: string, tags: string[]): string {
  const tagStr = tags.slice(0, 5).join(", ");
  
  const summaries: Record<string, string> = {
    "Movies & Series": `🎬 यह रील Movies & Series कैटेगरी से related है। इसमें ${tagStr} जैसे topics cover किए गए हैं। यह रील आपको movie recommendations या cinematic content दिखाती है। आप इसे अपनी watchlist में add कर सकते हैं।`,
    "Video Editing": `🎞️ यह एक Video Editing tutorial या showcase रील है। Keywords: ${tagStr}. इसमें editing techniques, transitions, या effects के बारे में बताया गया है। इसे practice करने के लिए save रखें।`,
    "Gaming": `🎮 Gaming content! इस रील में ${tagStr} से related gaming content है। यह gameplay, tips, या gaming news हो सकती है। Gamers के लिए useful content।`,
    "Coding & Dev": `💻 Developer content detected! ${tagStr} से related coding content है। यह tutorial, tip, या project showcase हो सकता है। Coding skills improve करने में help करेगा।`,
    "Technology": `🚀 Tech content! ${tagStr} से related technology content। New gadgets, tech news, या innovations के बारे में जानकारी। Tech enthusiasts के लिए valuable।`,
    "AI & ML": `🤖 AI & Machine Learning content! ${tagStr} detected। Latest AI tools, tutorials, या news से related है। Future tech को समझने में मदद करेगा।`,
    "Products": `🛍️ Product review/recommendation! ${tagStr} keywords found। Products की reviews, deals, या recommendations हैं। Purchase decision लेने में help करेगा।`,
    "Music": `🎵 Music content! ${tagStr} से related। Songs, covers, या music production से जुड़ा content। Music lovers के लिए।`,
    "Fitness": `💪 Fitness content! ${tagStr} found। Workout routines, diet tips, या fitness motivation। Health journey में helpful।`,
    "Food & Recipes": `🍕 Food content! ${tagStr} detected। Recipes, food reviews, या cooking tips। Kitchen में try करने योग्य।`,
    "Travel": `✈️ Travel content! ${tagStr}। Travel destinations, vlogs, या tips। Next trip plan करने में मदद करेगा।`,
    "Motivation": `🔥 Motivational content! ${tagStr}। Success stories, mindset tips, या inspirational quotes। Daily motivation के लिए।`,
    "Funny": `😂 Entertainment/Comedy content! ${tagStr}। Memes, pranks, या comedy। Mood lighten करने के लिए perfect।`,
    "Education": `📚 Educational content! ${tagStr}। Learning resources, tutorials, या knowledge sharing। Skills development के लिए।`,
    "Other": `📌 इस रील में mixed content है। Keywords: ${tagStr || "none detected"}। Manual categorization recommended।`,
  };

  return summaries[category] || summaries["Other"];
}

function generateGuide(category: string, text: string, tags: string[]): string {
  const guides: Record<string, string> = {
    "Movies & Series": `📋 Step-by-Step Guide:\n\n1️⃣ रील में mentioned movie/series का नाम note करें\n2️⃣ IMDb या Google पर search करके ratings check करें\n3️⃣ Streaming platform find करें (Netflix, Prime, Hotstar)\n4️⃣ Watchlist में add करें\n5️⃣ Weekend पर देखने का plan बनाएं\n6️⃣ Review देखने के बाद अपने friends को recommend करें`,
    "Video Editing": `📋 Step-by-Step Guide:\n\n1️⃣ रील में दिखाए गए software/app को install करें\n2️⃣ Basic interface को समझें\n3️⃣ Tutorial में बताए गए steps को follow करें\n4️⃣ Practice project बनाएं\n5️⃣ Effect/transition को apply करके देखें\n6️⃣ Result export करें और compare करें\n7️⃣ Daily 30 min practice करें`,
    "Gaming": `📋 Step-by-Step Guide:\n\n1️⃣ Game install/update करें\n2️⃣ Settings optimize करें as shown\n3️⃣ Tips & tricks को याद करें\n4️⃣ Practice mode में try करें\n5️⃣ Actual game में apply करें\n6️⃣ Progress track करें`,
    "Coding & Dev": `📋 Step-by-Step Guide:\n\n1️⃣ Required tools/libraries install करें\n2️⃣ Code snippet को copy या type करें\n3️⃣ Line by line समझें\n4️⃣ अपने project में implement करें\n5️⃣ Test करें\n6️⃣ Modify करके experiment करें\n7️⃣ GitHub पर push करें`,
    "Technology": `📋 Step-by-Step Guide:\n\n1️⃣ Product/tech का detail research करें\n2️⃣ Specifications compare करें\n3️⃣ User reviews पढ़ें\n4️⃣ Price comparison करें\n5️⃣ Budget में fit हो तो purchase plan बनाएं\n6️⃣ Alternatives भी check करें`,
    "AI & ML": `📋 Step-by-Step Guide:\n\n1️⃣ AI tool/platform access करें\n2️⃣ Account create करें (if needed)\n3️⃣ Tutorial follow करें step by step\n4️⃣ Free tier से start करें\n5️⃣ Different prompts/inputs try करें\n6️⃣ Results analyze करें\n7️⃣ Workflow में integrate करें`,
    "Products": `📋 Step-by-Step Guide:\n\n1️⃣ Product details note करें\n2️⃣ Amazon/Flipkart पर search करें\n3️⃣ Reviews & ratings check करें\n4️⃣ Price history track करें\n5️⃣ Alternatives compare करें\n6️⃣ Best deal मिलने पर purchase करें`,
    "Music": `📋 Step-by-Step Guide:\n\n1️⃣ Song/artist identify करें\n2️⃣ Spotify/YouTube Music पर search करें\n3️⃣ Playlist में add करें\n4️⃣ Similar music discover करें\n5️⃣ Lyrics समझें\n6️⃣ Share with friends`,
    "Fitness": `📋 Step-by-Step Guide:\n\n1️⃣ Exercise form carefully देखें\n2️⃣ Required equipment arrange करें\n3️⃣ Warm-up ज़रूर करें\n4️⃣ Slow pace से start करें\n5️⃣ Sets और reps follow करें\n6️⃣ Consistency maintain करें\n7️⃣ Progress track करें`,
    "Food & Recipes": `📋 Step-by-Step Guide:\n\n1️⃣ Ingredients list note करें\n2️⃣ Kitchen में सब arrange करें\n3️⃣ Recipe steps follow करें\n4️⃣ Cooking time accurately maintain करें\n5️⃣ Presentation as shown करें\n6️⃣ Taste adjust करें\n7️⃣ Photo लें और share करें`,
    "Travel": `📋 Step-by-Step Guide:\n\n1️⃣ Destination research करें\n2️⃣ Best time to visit check करें\n3️⃣ Budget plan बनाएं\n4️⃣ Tickets & hotel book करें\n5️⃣ Packing list बनाएं\n6️⃣ Local attractions list करें\n7️⃣ Trip enjoy करें और vlog बनाएं`,
    "Motivation": `📋 Step-by-Step Guide:\n\n1️⃣ Key message note करें\n2️⃣ अपनी life में apply करें\n3️⃣ Daily routine में include करें\n4️⃣ Goal setting करें\n5️⃣ Progress track करें\n6️⃣ Others को भी inspire करें`,
    "Funny": `📋 Step-by-Step Guide:\n\n1️⃣ Enjoy the content! 😄\n2️⃣ Friends को share करें\n3️⃣ Similar content creators follow करें\n4️⃣ Save for bad days\n5️⃣ Spread happiness! 🎉`,
    "Education": `📋 Step-by-Step Guide:\n\n1️⃣ Topic clearly समझें\n2️⃣ Notes बनाएं\n3️⃣ Additional resources search करें\n4️⃣ Practice/revision करें\n5️⃣ Doubt clear करें\n6️⃣ Apply in real scenarios`,
    "Other": `📋 Step-by-Step Guide:\n\n1️⃣ Content type identify करें\n2️⃣ Key takeaway note करें\n3️⃣ Relevant category manually assign करें\n4️⃣ Action items list करें\n5️⃣ Follow up if needed`,
  };

  return guides[category] || guides["Other"];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, url } = body;

    const inputText = [text || "", url || ""].join(" ").trim();

    if (!inputText) {
      return NextResponse.json({ error: "Please provide text or URL to analyze" }, { status: 400 });
    }

    const result = analyzeText(inputText);

    return NextResponse.json({
      category: result.category,
      confidence: result.confidence,
      tags: result.tags,
      summary: result.summary,
      guide: result.guide,
      analyzedText: inputText.substring(0, 200),
    });
  } catch (error) {
    console.error("Error analyzing:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
