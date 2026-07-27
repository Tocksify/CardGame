import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const matchHistoryTable = pgTable("match_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  result: text("result").notNull(), // 'win' | 'loss'
  opponentName: text("opponent_name").notNull(),
  gameMode: text("game_mode").notNull(),
  shardsEarned: integer("shards_earned").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MatchHistory = typeof matchHistoryTable.$inferSelect;
export type InsertMatchHistory = typeof matchHistoryTable.$inferInsert;
