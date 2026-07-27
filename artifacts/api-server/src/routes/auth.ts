import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

const USER_FIELDS = {
  id: usersTable.id,
  username: usersTable.username,
  isAdmin: usersTable.isAdmin,
  arcaneShards: usersTable.arcaneShards,
  rarityBoost: usersTable.rarityBoost,
  unlockedAchievementIds: usersTable.unlockedAchievementIds,
};

// GET /auth/me
router.get("/me", async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  const rows = await db
    .select(USER_FIELDS)
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (rows.length === 0) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  res.json(rows[0]);
});

// POST /auth/register
router.post("/register", async (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  const clean = username.trim().toLowerCase();
  if (clean.length < 2 || clean.length > 20) {
    res.status(400).json({ error: "Username must be 2–20 characters" });
    return;
  }
  if (!/^[a-z0-9_]+$/.test(clean)) {
    res.status(400).json({ error: "Username may only contain letters, numbers, and _" });
    return;
  }
  if (password.length < 4) {
    res.status(400).json({ error: "Password must be at least 4 characters" });
    return;
  }
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, clean))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  const rows = await db
    .insert(usersTable)
    .values({ username: clean, passwordHash: hash })
    .returning(USER_FIELDS);
  const user = rows[0];
  req.session.userId = user.id;
  res.json(user);
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.trim().toLowerCase()))
    .limit(1);
  if (rows.length === 0) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const user = rows[0];
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  req.session.userId = user.id;
  res.json({
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
    arcaneShards: user.arcaneShards,
    rarityBoost: user.rarityBoost,
    unlockedAchievementIds: user.unlockedAchievementIds,
  });
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
