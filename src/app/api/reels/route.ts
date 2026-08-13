import { db } from "@/db";
import { reels } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const all = await db.select().from(reels).orderBy(desc(reels.createdAt));
    return NextResponse.json(all);
  } catch (error) {
    console.error("Error fetching reels:", error);
    return NextResponse.json({ error: "Failed to fetch reels" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [newReel] = await db.insert(reels).values({
      url: body.url || null,
      title: body.title,
      description: body.description || null,
      categoryId: body.categoryId || null,
      categoryName: body.categoryName || null,
      aiSummary: body.aiSummary || null,
      stepByStepGuide: body.stepByStepGuide || null,
      tags: body.tags || null,
      platform: body.platform || "instagram",
      thumbnailUrl: body.thumbnailUrl || null,
      isFavorite: body.isFavorite || false,
      priority: body.priority || 0,
    }).returning();
    return NextResponse.json(newReel);
  } catch (error) {
    console.error("Error creating reel:", error);
    return NextResponse.json({ error: "Failed to create reel" }, { status: 500 });
  }
}
