import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("📁"),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reels = pgTable("reels", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url"),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categories.id),
  categoryName: text("category_name"),
  aiSummary: text("ai_summary"),
  stepByStepGuide: text("step_by_step_guide"),
  tags: text("tags"),
  platform: text("platform").default("instagram"),
  thumbnailUrl: text("thumbnail_url"),
  isFavorite: boolean("is_favorite").default(false),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const taskBots = pgTable("task_bots", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(),
  status: text("status").default("idle"),
  lastRun: timestamp("last_run"),
  config: text("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
