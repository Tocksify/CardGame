import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, matchHistoryTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Auth guard middleware for all account routes
router.use((req, res, next) => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  next();
});

// GET /account — shards + last 20 matches
router.get("/", async (req, res) => {
  const userId = req.session.userId!;
  const [userRows, matches] = await Promise.all([
    db
      .select({ arcaneShards: usersTable.arcaneShards })
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
  res.json({ arcaneShards: userRows[0].arcaneShards, matches });
});

// PATCH /account/shards — add (or subtract) shards
router.patch("/shards", async (req, res) => {
  const userId = req.session.userId!;
  const { delta } = req.body as { delta?: number };
  if (typeof delta !== "number" || isNaN(delta)) {
    res.status(400).json({ error: "delta must be a number" });
    return;
  }
  const rows = await db
    .select({ arcaneShards: usersTable.arcaneShards })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const newVal = Math.max(0, rows[0].arcaneShards + delta);
  await db
    .update(usersTable)
    .set({ arcaneShards: newVal })
    .where(eq(usersTable.id, userId));
  res.json({ arcaneShards: newVal });
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
    const [user] = await db
      .select({ arcaneShards: usersTable.arcaneShards })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (user) {
      await db
        .update(usersTable)
        .set({ arcaneShards: user.arcaneShards + shardsEarned })
        .where(eq(usersTable.id, userId));
    }
  }
  res.json(matchRow);
});

export default router;
