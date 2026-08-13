import { db } from "@/db";
import { reels, categories } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const totalReels = await db.select({ count: sql<number>`count(*)` }).from(reels);
    const totalCategories = await db.select({ count: sql<number>`count(*)` }).from(categories);
    const favorites = await db
      .select({ count: sql<number>`count(*)` })
      .from(reels)
      .where(eq(reels.isFavorite, true));

    // Get category-wise counts
    const categoryStats = await db
      .select({
        categoryName: reels.categoryName,
        count: sql<number>`count(*)`,
      })
      .from(reels)
      .groupBy(reels.categoryName);

    return NextResponse.json({
      totalReels: Number(totalReels[0]?.count || 0),
      totalCategories: Number(totalCategories[0]?.count || 0),
      totalFavorites: Number(favorites[0]?.count || 0),
      categoryStats: categoryStats.map(s => ({
        name: s.categoryName || "Uncategorized",
        count: Number(s.count),
      })),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({
      totalReels: 0,
      totalCategories: 0,
      totalFavorites: 0,
      categoryStats: [],
    });
  }
}
