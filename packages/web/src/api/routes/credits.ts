import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";

export const credits = new Hono()
  .use(authMiddleware)
  .get("/transactions", requireAuth, async (c) => {
    const user = c.get("user")!;
    const transactions = await db
      .select()
      .from(schema.creditTransactions)
      .where(eq(schema.creditTransactions.userId, user.id))
      .orderBy(desc(schema.creditTransactions.createdAt));
    return c.json({ transactions }, 200);
  })
  .get("/balance", requireAuth, async (c) => {
    const user = c.get("user")!;
    const [profile] = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, user.id));
    return c.json({ balance: profile?.greenCredits ?? 0, profile }, 200);
  })
  .post("/redeem", requireAuth, async (c) => {
    const user = c.get("user")!;
    const { amount, description } = await c.req.json();
    const [profile] = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, user.id));

    if (!profile || profile.greenCredits < amount) {
      return c.json({ error: "Insufficient credits" }, 400);
    }

    await db.update(schema.userProfiles)
      .set({ greenCredits: profile.greenCredits - amount })
      .where(eq(schema.userProfiles.userId, user.id));

    const [tx] = await db.insert(schema.creditTransactions).values({
      userId: user.id,
      amount: -amount,
      type: "redeem",
      description: description || "Redeemed Green Credits",
    }).returning();

    return c.json({ transaction: tx, newBalance: profile.greenCredits - amount }, 200);
  });
