import { db } from "@/db";
import { categories } from "@/db/schema";
import { NextResponse } from "next/server";

const DEFAULT_CATEGORIES = [
  { name: "Movies & Series", icon: "🎬", color: "#ef4444" },
  { name: "Video Editing", icon: "🎞️", color: "#f97316" },
  { name: "Gaming", icon: "🎮", color: "#22c55e" },
  { name: "Coding & Dev", icon: "💻", color: "#3b82f6" },
  { name: "Technology", icon: "🚀", color: "#6366f1" },
  { name: "AI & ML", icon: "🤖", color: "#a855f7" },
  { name: "Products", icon: "🛍️", color: "#ec4899" },
  { name: "Music", icon: "🎵", color: "#14b8a6" },
  { name: "Fitness", icon: "💪", color: "#eab308" },
  { name: "Food & Recipes", icon: "🍕", color: "#f59e0b" },
  { name: "Travel", icon: "✈️", color: "#06b6d4" },
  { name: "Motivation", icon: "🔥", color: "#f43f5e" },
  { name: "Funny", icon: "😂", color: "#84cc16" },
  { name: "Education", icon: "📚", color: "#8b5cf6" },
  { name: "Other", icon: "📌", color: "#64748b" },
];

export async function GET() {
  try {
    const existing = await db.select().from(categories);
    if (existing.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await db.insert(categories).values(cat);
      }
      const all = await db.select().from(categories);
      return NextResponse.json(all);
    }
    return NextResponse.json(existing);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [newCat] = await db.insert(categories).values({
      name: body.name,
      icon: body.icon || "📁",
      color: body.color || "#6366f1",
    }).returning();
    return NextResponse.json(newCat);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
