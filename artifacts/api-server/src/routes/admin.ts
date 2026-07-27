import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, ilike } from "drizzle-orm";

const router = Router();

// Admin guard
router.use(async (req, res, next) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  const rows = await db
    .select({ isAdmin: usersTable.isAdmin })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!rows[0]?.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
});

// GET /admin/users?q=username — search users
router.get("/users", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const rows = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      isAdmin: usersTable.isAdmin,
      arcaneShards: usersTable.arcaneShards,
      rarityBoost: usersTable.rarityBoost,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(q ? ilike(usersTable.username, `%${q}%`) : undefined)
    .limit(30);
  res.json(rows);
});

// PATCH /admin/users/:id — update arcaneShards and/or rarityBoost
router.patch("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const { arcaneShards, rarityBoost } = req.body as {
    arcaneShards?: number;
    rarityBoost?: number;
  };
  const update: Record<string, unknown> = {};
  if (typeof arcaneShards === "number" && !isNaN(arcaneShards)) {
    update.arcaneShards = Math.max(0, arcaneShards);
  }
  if (typeof rarityBoost === "number" && !isNaN(rarityBoost)) {
    update.rarityBoost = Math.max(0, Math.min(2, rarityBoost));
  }
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }
  const rows = await db
    .update(usersTable)
    .set(update)
    .where(eq(usersTable.id, id))
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      isAdmin: usersTable.isAdmin,
      arcaneShards: usersTable.arcaneShards,
      rarityBoost: usersTable.rarityBoost,
    });
  if (rows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(rows[0]);
});

export default router;
