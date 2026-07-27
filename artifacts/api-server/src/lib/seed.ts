import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

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
