import { Hono } from "hono";
import { aiPreventReturn, aiShoppingAssistant } from "../lib/ai";
import { db } from "../database";
import { returnSubmissions, products, p2pListings, userProfiles } from "../database/schema";
import { count, sum, isNotNull } from "drizzle-orm";

export const prevent = new Hono()
  .get("/stats", async (c) => {
    const [returnsRow] = await db.select({ cnt: count() }).from(returnSubmissions);
    const [productsRow] = await db.select({ cnt: count(), savings: sum(products.originalPrice) }).from(products);
    const [p2pRow] = await db.select({ cnt: count() }).from(p2pListings);
    const [co2Row] = await db.select({ total: sum(userProfiles.co2Saved) }).from(userProfiles);
    const [analysesRow] = await db.select({ cnt: count() }).from(returnSubmissions).where(isNotNull(returnSubmissions.disposition));

    const totalAnalyses = (Number(returnsRow.cnt) || 0) + (Number(p2pRow.cnt) || 0);
    const moneySavedINR = Number(productsRow.savings) || 0;
    const co2SavedKg = Number(co2Row.total) || 0;
    const returnsCnt = Number(returnsRow.cnt) || 0;

    return c.json({
      totalAnalyses,
      moneySavedINR,
      co2SavedKg,
      returnsCnt,
      productsCnt: Number(productsRow.cnt) || 0,
      p2pCnt: Number(p2pRow.cnt) || 0,
    }, 200);
  })
  .post("/analyze", async (c) => {
    const body = await c.req.json();
    const result = await aiPreventReturn({
      ...body,
      price: parseFloat(body.price) || 0,
      budget: body.budget ? parseFloat(body.budget) : undefined,
    });
    return c.json({ result }, 200);
  })
  .post("/chat", async (c) => {
    const { question, context } = await c.req.json();
    const answer = await aiShoppingAssistant({ question, context });
    return c.json({ answer }, 200);
  });

