import { db } from "@/db";
import { reels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const [updated] = await db
      .update(reels)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(reels.id, id))
      .returning();
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating reel:", error);
    return NextResponse.json({ error: "Failed to update reel" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(reels).where(eq(reels.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reel:", error);
    return NextResponse.json({ error: "Failed to delete reel" }, { status: 500 });
  }
}
