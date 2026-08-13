import { NextResponse } from "next/server";

// Product detection keywords and platforms
const PRODUCT_KEYWORDS = [
  "buy", "price", "₹", "$", "amazon", "flipkart", "myntra", "ajio", "meesho",
  "discount", "offer", "sale", "link in bio", "shop", "store", "available",
  "order", "purchase", "cost", "cheap", "expensive", "budget", "premium",
  "brand", "product", "gadget", "phone", "laptop", "camera", "watch", "shoes",
  "clothes", "accessory", "headphone", "earbuds", "charger", "cable"
];

const TUTORIAL_KEYWORDS = [
  "how to", "tutorial", "step by step", "learn", "guide", "tips", "trick",
  "hack", "secret", "method", "way to", "process", "technique", "easy way",
  "simple", "beginners", "advanced", "pro tip", "did you know", "follow",
  "do this", "try this", "must try", "game changer"
];

const SOFTWARE_TOOLS: Record<string, { name: string; type: string; link: string }> = {
  "premiere": { name: "Adobe Premiere Pro", type: "Video Editor", link: "https://adobe.com/premiere" },
  "after effects": { name: "Adobe After Effects", type: "VFX/Motion", link: "https://adobe.com/aftereffects" },
  "photoshop": { name: "Adobe Photoshop", type: "Image Editor", link: "https://adobe.com/photoshop" },
  "capcut": { name: "CapCut", type: "Mobile Editor", link: "https://capcut.com" },
  "davinci": { name: "DaVinci Resolve", type: "Video Editor", link: "https://blackmagicdesign.com/davinci" },
  "final cut": { name: "Final Cut Pro", type: "Video Editor", link: "https://apple.com/final-cut-pro" },
  "figma": { name: "Figma", type: "Design Tool", link: "https://figma.com" },
  "canva": { name: "Canva", type: "Design Tool", link: "https://canva.com" },
  "blender": { name: "Blender", type: "3D Software", link: "https://blender.org" },
  "vscode": { name: "VS Code", type: "Code Editor", link: "https://code.visualstudio.com" },
  "chatgpt": { name: "ChatGPT", type: "AI Tool", link: "https://chat.openai.com" },
  "midjourney": { name: "Midjourney", type: "AI Image", link: "https://midjourney.com" },
  "notion": { name: "Notion", type: "Productivity", link: "https://notion.so" },
  "obs": { name: "OBS Studio", type: "Streaming", link: "https://obsproject.com" },
};

const PLATFORMS: Record<string, string> = {
  "amazon": "https://amazon.in/s?k=",
  "flipkart": "https://flipkart.com/search?q=",
  "myntra": "https://myntra.com/",
  "ajio": "https://ajio.com/search/?text=",
  "meesho": "https://meesho.com/search?q=",
};

interface DeepAnalysis {
  category: string;
  confidence: number;
  contentType: "product" | "tutorial" | "entertainment" | "information" | "motivation";
  
  // Products
  products: {
    name: string;
    estimatedPrice?: string;
    whereToBuy: { platform: string; link: string }[];
    searchQuery: string;
  }[];
  
  // Software/Tools
  tools: {
    name: string;
    type: string;
    downloadLink: string;
    isFree: boolean;
  }[];
  
  // Actions/Steps
  actions: {
    step: number;
    action: string;
    detail: string;
  }[];
  
  // Summary
  summary: string;
  voiceScript: string;
  tags: string[];
}

function detectProducts(text: string): DeepAnalysis["products"] {
  const lower = text.toLowerCase();
  const products: DeepAnalysis["products"] = [];
  
  // Common product patterns
  const productPatterns = [
    /(?:this|the|my|new|best)\s+(\w+(?:\s+\w+)?)\s+(?:is|costs?|available|from)/gi,
    /(?:buy|get|grab|order)\s+(?:this|the)?\s*(\w+(?:\s+\w+){0,3})/gi,
    /(\w+(?:\s+\w+)?)\s+(?:under|for|at)\s+(?:₹|\$|rs\.?)\s*\d+/gi,
  ];
  
  const foundProducts = new Set<string>();
  
  for (const pattern of productPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const product = match[1]?.trim();
      if (product && product.length > 2 && product.length < 50) {
        foundProducts.add(product);
      }
    }
  }
  
  // Check for explicit product mentions
  const explicitProducts = [
    "iphone", "samsung", "oneplus", "redmi", "realme", "pixel",
    "macbook", "laptop", "airpods", "earbuds", "headphones",
    "watch", "smartwatch", "camera", "drone", "gimbal",
    "keyboard", "mouse", "monitor", "chair", "desk"
  ];
  
  for (const prod of explicitProducts) {
    if (lower.includes(prod)) {
      foundProducts.add(prod);
    }
  }
  
  // Create product entries with buying links
  for (const productName of foundProducts) {
    const whereToBuy: { platform: string; link: string }[] = [];
    for (const [platform, baseUrl] of Object.entries(PLATFORMS)) {
      whereToBuy.push({
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        link: baseUrl + encodeURIComponent(productName),
      });
    }
    
    products.push({
      name: productName,
      whereToBuy: whereToBuy.slice(0, 3),
      searchQuery: productName,
    });
  }
  
  return products.slice(0, 5);
}

function detectTools(text: string): DeepAnalysis["tools"] {
  const lower = text.toLowerCase();
  const tools: DeepAnalysis["tools"] = [];
  
  for (const [keyword, info] of Object.entries(SOFTWARE_TOOLS)) {
    if (lower.includes(keyword)) {
      tools.push({
        name: info.name,
        type: info.type,
        downloadLink: info.link,
        isFree: ["capcut", "davinci", "blender", "vscode", "canva", "obs"].some(f => keyword.includes(f)),
      });
    }
  }
  
  return tools;
}

function extractActions(text: string, contentType: string): DeepAnalysis["actions"] {
  const actions: DeepAnalysis["actions"] = [];
  
  // Try to extract numbered steps
  const stepPatterns = [
    /(?:step\s*)?(\d+)[.:)\s]+([^.!?\n]+)/gi,
    /(?:first|second|third|fourth|fifth|then|next|finally)[,:]?\s+([^.!?\n]+)/gi,
  ];
  
  let stepNum = 1;
  for (const pattern of stepPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const actionText = match[2] || match[1];
      if (actionText && actionText.length > 5) {
        actions.push({
          step: stepNum++,
          action: actionText.trim().substring(0, 100),
          detail: `Step ${stepNum - 1}: ${actionText.trim()}`,
        });
      }
      if (actions.length >= 10) break;
    }
  }
  
  // If no steps found, generate generic steps based on content type
  if (actions.length === 0) {
    const genericSteps: Record<string, string[]> = {
      product: [
        "Product का review video पूरा देखो",
        "Features और specifications note करो",
        "Price compare करो different platforms पर",
        "User reviews check करो",
        "Best deal मिलने पर purchase करो"
      ],
      tutorial: [
        "Required tools/software install करो",
        "Tutorial video को pause करके follow करो",
        "हर step को practically try करो",
        "Problems आने पर rewind करके देखो",
        "Practice करो जब तक perfect न हो"
      ],
      entertainment: [
        "Video enjoy करो!",
        "Friends को share करो",
        "Creator को follow करो",
        "Similar content explore करो"
      ],
      information: [
        "Key points note करो",
        "Further research करो if needed",
        "Reliable sources से verify करो",
        "Knowledge को apply करो"
      ],
      motivation: [
        "Message को deeply समझो",
        "अपनी life में relate करो",
        "Action plan बनाओ",
        "Daily reminder set करो",
        "Progress track करो"
      ]
    };
    
    const steps = genericSteps[contentType] || genericSteps.information;
    steps.forEach((step, i) => {
      actions.push({
        step: i + 1,
        action: step,
        detail: step,
      });
    });
  }
  
  return actions;
}

function detectContentType(text: string): DeepAnalysis["contentType"] {
  const lower = text.toLowerCase();
  
  let productScore = 0;
  let tutorialScore = 0;
  
  for (const kw of PRODUCT_KEYWORDS) {
    if (lower.includes(kw)) productScore++;
  }
  
  for (const kw of TUTORIAL_KEYWORDS) {
    if (lower.includes(kw)) tutorialScore++;
  }
  
  if (productScore > 3) return "product";
  if (tutorialScore > 2) return "tutorial";
  if (lower.match(/motivat|inspir|success|hustle|mindset|discipline/)) return "motivation";
  if (lower.match(/funny|meme|comedy|laugh|joke/)) return "entertainment";
  
  return "information";
}

function generateVoiceScript(analysis: Partial<DeepAnalysis>, text: string): string {
  let script = `यह रील ${analysis.category} category की है। `;
  
  if (analysis.contentType === "product" && analysis.products && analysis.products.length > 0) {
    script += `इसमें ${analysis.products.map(p => p.name).join(", ")} products के बारे में बताया गया है। `;
    script += `आप इन्हें Amazon, Flipkart या Myntra पर search करके buy कर सकते हो। `;
  }
  
  if (analysis.tools && analysis.tools.length > 0) {
    script += `इसमें ${analysis.tools.map(t => t.name).join(", ")} tools use किए गए हैं। `;
    const freeTools = analysis.tools.filter(t => t.isFree);
    if (freeTools.length > 0) {
      script += `${freeTools.map(t => t.name).join(", ")} free में download कर सकते हो। `;
    }
  }
  
  if (analysis.actions && analysis.actions.length > 0) {
    script += `अब मैं steps बताता हूं। `;
    for (const action of analysis.actions.slice(0, 5)) {
      script += `Step ${action.step}: ${action.action}. `;
    }
  }
  
  script += `यह थी इस reel की complete guide!`;
  
  return script;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Movies & Series": ["movie", "film", "series", "netflix", "watch", "trailer", "cinematic", "scene", "actor", "actress", "bollywood", "hollywood"],
  "Video Editing": ["edit", "editing", "premiere", "after effects", "davinci", "capcut", "transition", "vfx", "color grading", "motion graphics"],
  "Gaming": ["game", "gaming", "gamer", "pubg", "valorant", "gta", "minecraft", "fortnite", "esports", "playstation", "xbox"],
  "Coding & Dev": ["code", "coding", "programming", "developer", "javascript", "python", "react", "nextjs", "web dev", "api", "github"],
  "Technology": ["tech", "technology", "gadget", "smartphone", "laptop", "review", "specs", "unboxing", "iphone", "android"],
  "AI & ML": ["ai", "artificial intelligence", "machine learning", "chatgpt", "openai", "midjourney", "neural", "deep learning", "prompt"],
  "Products": ["product", "buy", "amazon", "flipkart", "deal", "discount", "review", "unboxing", "worth", "price", "budget"],
  "Music": ["music", "song", "singer", "beat", "melody", "remix", "cover", "guitar", "piano", "spotify"],
  "Fitness": ["fitness", "gym", "workout", "exercise", "muscle", "protein", "diet", "body", "weight", "cardio", "yoga"],
  "Food & Recipes": ["food", "recipe", "cook", "cooking", "restaurant", "dish", "meal", "kitchen", "chef", "taste"],
  "Travel": ["travel", "trip", "destination", "explore", "tourist", "hotel", "flight", "vacation", "adventure"],
  "Motivation": ["motivation", "motivational", "inspire", "success", "hustle", "grind", "mindset", "discipline", "focus"],
  "Funny": ["funny", "meme", "comedy", "laugh", "joke", "prank", "hilarious", "roast"],
  "Education": ["learn", "education", "study", "course", "tutorial", "explain", "knowledge", "science", "skill"],
};

function detectCategory(text: string): { category: string; confidence: number; tags: string[] } {
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

  return {
    category: bestCategory,
    confidence,
    tags: [...new Set(matchedTags)].slice(0, 10),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, url } = body;
    const inputText = [text || "", url || ""].join(" ").trim();

    if (!inputText) {
      return NextResponse.json({ error: "Please provide text or URL" }, { status: 400 });
    }

    // Detect category
    const { category, confidence, tags } = detectCategory(inputText);
    
    // Detect content type
    const contentType = detectContentType(inputText);
    
    // Detect products
    const products = detectProducts(inputText);
    
    // Detect tools
    const tools = detectTools(inputText);
    
    // Extract actions
    const actions = extractActions(inputText, contentType);
    
    // Generate summary
    let summary = `🎯 Content Type: ${contentType.toUpperCase()}\n\n`;
    
    if (products.length > 0) {
      summary += `🛍️ Products Found:\n`;
      for (const p of products) {
        summary += `  • ${p.name}\n`;
        summary += `    📍 Buy: ${p.whereToBuy.map(w => w.platform).join(", ")}\n`;
      }
      summary += "\n";
    }
    
    if (tools.length > 0) {
      summary += `🔧 Tools/Software Used:\n`;
      for (const t of tools) {
        summary += `  • ${t.name} (${t.type}) ${t.isFree ? "✅ FREE" : "💰 PAID"}\n`;
      }
      summary += "\n";
    }
    
    summary += `📋 Action Steps:\n`;
    for (const a of actions) {
      summary += `  ${a.step}. ${a.action}\n`;
    }
    
    // Generate voice script
    const voiceScript = generateVoiceScript({
      category,
      contentType,
      products,
      tools,
      actions,
    }, inputText);

    const response: DeepAnalysis = {
      category,
      confidence,
      contentType,
      products,
      tools,
      actions,
      summary,
      voiceScript,
      tags,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Deep analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
