import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Creates the connect-pg-simple session table if it doesn't exist.
 * We do this via raw SQL so it works even when the package is bundled
 * (esbuild strips the package's table.sql file, breaking createTableIfMissing).
 */
export async function ensureSessionTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid"    varchar      NOT NULL,
        "sess"   json         NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire"
        ON "user_sessions" ("expire");
    `);
  } catch (err) {
    logger.error({ err }, "Failed to ensure session table");
  }
}

export async function seedAdminUser() {
  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, "glo"))
      .limit(1);
    if (existing.length === 0) {
      const hash = bcrypt.hashSync("Jax030209", 10);
      await db.insert(usersTable).values({
        username: "glo",
        passwordHash: hash,
        isAdmin: true,
        rarityBoost: 2,
        arcaneShards: 9999,
      });
      logger.info('Admin user "glo" created.');
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed admin user");
  }
}
