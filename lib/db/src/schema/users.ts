import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  arcaneShards: integer("arcane_shards").notNull().default(0),
  rarityBoost: integer("rarity_boost").notNull().default(0),
  // JSON array of achievement IDs that have been unlocked server-side, e.g. '["first_win","win_10_games"]'
  unlockedAchievementIds: text("unlocked_achievement_ids").notNull().default("[]"),
  // JSON array of challenger IDs purchased with Arcane Shards, e.g. '["ch_02","ch_07"]'
  purchasedChallengerIds: text("purchased_challenger_ids").notNull().default("[]"),
  // JSON array of challenger IDs gifted by an admin (e.g. secret/chromatic challengers), e.g. '["morthus"]'
  giftedChallengerIds: text("gifted_challenger_ids").notNull().default("[]"),
  // JSON map of achievement progress values, e.g. '{"win_10_games":4,"kill_50_creatures":12}'
  achievementProgress: text("achievement_progress").notNull().default("{}"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
