import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";

export const dashboard = new Hono()
  .use(authMiddleware)
  .get("/stats", requireAuth, async (c) => {
    const user = c.get("user")!;

    const [profile] = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, user.id));

    const allReturns = await db
      .select()
      .from(schema.returnSubmissions)
      .where(eq(schema.returnSubmissions.userId, user.id))
      .orderBy(desc(schema.returnSubmissions.createdAt));

    const allListings = await db
      .select()
      .from(schema.p2pListings)
      .where(eq(schema.p2pListings.sellerId, user.id));

    const allCredits = await db
      .select()
      .from(schema.creditTransactions)
      .where(eq(schema.creditTransactions.userId, user.id))
      .orderBy(schema.creditTransactions.createdAt);

    const dispositionBreakdown = {
      resell: allReturns.filter((r) => r.disposition === "resell").length,
      refurbish: allReturns.filter((r) => r.disposition === "refurbish").length,
      donate: allReturns.filter((r) => r.disposition === "donate").length,
      recycle: allReturns.filter((r) => r.disposition === "recycle").length,
      exchange: allReturns.filter((r) => r.disposition === "exchange").length,
    };

    // Build monthly returns + credits trend (last 6 months)
    const now = new Date();
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString("en-IN", { month: "short" });
      const monthReturns = allReturns.filter((r) => {
        if (!r.createdAt) return false;
        const rd = new Date(r.createdAt);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      });
      const credits = allCredits
        .filter((t) => {
          if (!t.createdAt) return false;
          const td = new Date(t.createdAt);
          return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && t.amount > 0;
        })
        .reduce((acc, t) => acc + t.amount, 0);
      return {
        month: label,
        returns: monthReturns.length,
        credits,
        co2: parseFloat((monthReturns.length * 1.8).toFixed(1)),
      };
    });

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    allReturns.forEach((r) => {
      const key = r.category || "Other";
      categoryMap[key] = (categoryMap[key] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    // Quality grade breakdown
    const gradeMap: Record<string, number> = {};
    allReturns.forEach((r) => { if (r.qualityGrade) gradeMap[r.qualityGrade] = (gradeMap[r.qualityGrade] || 0) + 1; });
    const gradeBreakdown = Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }));

    return c.json({
      user: { ...user, ...profile },
      stats: {
        totalReturns: allReturns.length,
        greenCredits: profile?.greenCredits ?? 0,
        co2SavedKg: profile?.co2Saved ?? 0,
        totalDonations: profile?.totalDonations ?? 0,
        activeListings: allListings.filter((l) => l.status === "active").length,
        activeProducts: allListings.filter((l) => l.status === "active").length,
      },
      dispositionBreakdown,
      recentReturns: allReturns.slice(0, 5),
      monthlyTrend,
      categoryBreakdown,
      gradeBreakdown,
    }, 200);
  })
  .get("/platform-metrics", async (c) => {
    const allReturns = await db.select().from(schema.returnSubmissions);
    const allProducts = await db.select().from(schema.products);

    return c.json({
      totalProductsRerouted: allReturns.length + allProducts.length,
      totalCo2SavedKg: Math.round((allReturns.length * 1.8 + allProducts.length * 2.1) * 10) / 10,
      totalCreditsIssued: allReturns.reduce((acc, r) => acc + (r.greenCreditsAwarded || 0), 0),
      totalDonations: allReturns.filter((r) => r.disposition === "donate").length,
      certifiedRefurbished: allProducts.filter((p) => p.isCertified).length,
      activeMarketplaceItems: allProducts.filter((p) => p.status === "active").length,
    }, 200);
  });
