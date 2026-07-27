import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, matchHistoryTable } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

// Auth guard middleware for all account routes
router.use((req, res, next) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  next();
});

// GET /account — shards + purchased challengers + last 20 matches
router.get("/", async (req, res) => {
  const userId = req.session.userId!;
  const [userRows, matches] = await Promise.all([
    db
      .select({ arcaneShards: usersTable.arcaneShards, purchasedChallengerIds: usersTable.purchasedChallengerIds })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1),
    db
      .select()
      .from(matchHistoryTable)
      .where(eq(matchHistoryTable.userId, userId))
      .orderBy(desc(matchHistoryTable.createdAt))
      .limit(20),
  ]);
  if (userRows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const row = userRows[0];
  let purchasedChallengerIds: string[] = [];
  try { purchasedChallengerIds = JSON.parse(row.purchasedChallengerIds); } catch { /* ignore */ }
  res.json({ arcaneShards: row.arcaneShards, purchasedChallengerIds, matches });
});

// PATCH /account/shards — add (or subtract) shards
router.patch("/shards", async (req, res) => {
  const userId = req.session.userId!;
  const { delta } = req.body as { delta?: number };
  if (typeof delta !== "number" || !Number.isFinite(delta)) {
    res.status(400).json({ error: "delta must be a number" });
    return;
  }
  const amount = Math.trunc(delta);
  const rows = await db
    .update(usersTable)
    .set({
      arcaneShards: sql`GREATEST(0, ${usersTable.arcaneShards} + ${amount})`,
    })
    .where(eq(usersTable.id, userId))
    .returning({ arcaneShards: usersTable.arcaneShards });
  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(rows[0]);
});

// PATCH /account/challengers — save the full list of purchased challenger IDs
router.patch("/challengers", async (req, res) => {
  const userId = req.session.userId!;
  const { purchasedChallengerIds } = req.body as { purchasedChallengerIds?: unknown };
  if (
    !Array.isArray(purchasedChallengerIds) ||
    purchasedChallengerIds.some((id) => typeof id !== "string")
  ) {
    res.status(400).json({ error: "purchasedChallengerIds must be an array of strings" });
    return;
  }
  const ids = [...new Set(purchasedChallengerIds)].slice(0, 200) as string[];
  const rows = await db
    .update(usersTable)
    .set({ purchasedChallengerIds: JSON.stringify(ids) })
    .where(eq(usersTable.id, userId))
    .returning({ purchasedChallengerIds: usersTable.purchasedChallengerIds });
  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ purchasedChallengerIds: ids });
});

// PATCH /account/achievement-progress — save incremental progress for achievements
router.patch("/achievement-progress", async (req, res) => {
  const userId = req.session.userId!;
  const { progress } = req.body as { progress?: unknown };
  if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
    res.status(400).json({ error: "progress must be a key-value object" });
    return;
  }
  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(progress)) {
    if (typeof k === "string" && typeof v === "number" && Number.isFinite(v)) {
      clean[k] = Math.trunc(v);
    }
  }
  const rows = await db
    .update(usersTable)
    .set({ achievementProgress: JSON.stringify(clean) })
    .where(eq(usersTable.id, userId))
    .returning({ achievementProgress: usersTable.achievementProgress });
  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ achievementProgress: clean });
});

// PATCH /account/achievements — unlock one or more achievements for the current account
router.patch("/achievements", async (req, res) => {
  const userId = req.session.userId!;
  const { achievementIds } = req.body as { achievementIds?: unknown };
  if (
    !Array.isArray(achievementIds) ||
    achievementIds.some((id) => typeof id !== "string")
  ) {
    res.status(400).json({ error: "achievementIds must be an array of strings" });
    return;
  }
  const ids = [...new Set(achievementIds)].slice(0, 200) as string[];
  const rows = await db
    .update(usersTable)
    .set({ unlockedAchievementIds: JSON.stringify(ids) })
    .where(eq(usersTable.id, userId))
    .returning({ unlockedAchievementIds: usersTable.unlockedAchievementIds });
  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ unlockedAchievementIds: ids });
});

// POST /account/match — record a completed match
router.post("/match", async (req, res) => {
  const userId = req.session.userId!;
  const { result, opponentName, gameMode, shardsEarned } = req.body as {
    result?: string;
    opponentName?: string;
    gameMode?: string;
    shardsEarned?: number;
  };
  if (!result || !opponentName || !gameMode) {
    res.status(400).json({ error: "result, opponentName, and gameMode are required" });
    return;
  }
  const [matchRow] = await db
    .insert(matchHistoryTable)
    .values({
      userId,
      result,
      opponentName: String(opponentName).slice(0, 100),
      gameMode: String(gameMode).slice(0, 20),
      shardsEarned: typeof shardsEarned === "number" ? shardsEarned : 0,
    })
    .returning();
  // If shards earned, update balance
  if (typeof shardsEarned === "number" && shardsEarned > 0) {
    await db
      .update(usersTable)
      .set({
        arcaneShards: sql`${usersTable.arcaneShards} + ${Math.trunc(shardsEarned)}`,
      })
      .where(eq(usersTable.id, userId));
  }
  res.json(matchRow);
});

export default router;
