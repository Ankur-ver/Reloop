import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import { aiDispose } from "../lib/ai";

// Marketplace image fallbacks by category
const categoryImages: Record<string, string> = {
  electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
  clothing: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80",
  footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  furniture: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
  appliances: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  books: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
  toys: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  sports: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
  other: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
};

// Simulate return tracking milestones (relative hours from submission)
function getTrackingTimeline(submission: typeof schema.returnSubmissions.$inferSelect) {
  const created = new Date(submission.createdAt!).getTime();
  const steps = [
    {
      key: "initiated",
      label: "Return Initiated",
      description: "Your return request has been received and approved.",
      completedAt: submission.createdAt ? new Date(submission.createdAt).toISOString() : null,
      done: true,
    },
    {
      key: "pickup_scheduled",
      label: "Pickup Scheduled",
      description: "A pickup agent will collect your item within 24 hours.",
      completedAt: new Date(created + 2 * 3600 * 1000).toISOString(),
      done: ["pickup_scheduled","picked_up","in_transit","processed","listed","donated","recycled"].includes(submission.returnStatus),
    },
    {
      key: "picked_up",
      label: "Item Picked Up",
      description: "Your product has been collected from your address.",
      completedAt: submission.pickedUpAt ? new Date(submission.pickedUpAt).toISOString() : null,
      done: ["picked_up","in_transit","processed","listed","donated","recycled"].includes(submission.returnStatus),
    },
    {
      key: "in_transit",
      label: "In Transit",
      description: "Your item is on its way to the ReLoop processing center.",
      completedAt: submission.inTransitAt ? new Date(submission.inTransitAt).toISOString() : null,
      done: ["in_transit","processed","listed","donated","recycled"].includes(submission.returnStatus),
    },
    {
      key: "processed",
      label: "Quality Graded",
      description: "AI quality assessment complete. Disposition determined.",
      completedAt: submission.processedAt ? new Date(submission.processedAt).toISOString() : null,
      done: ["processed","listed","donated","recycled"].includes(submission.returnStatus),
    },
    {
      key: submission.disposition === "donate" ? "donated" : submission.disposition === "recycle" ? "recycled" : "listed",
      label: submission.disposition === "donate" ? "Donated to NGO" : submission.disposition === "recycle" ? "Sent for Recycling" : "Listed on Marketplace",
      description: submission.disposition === "donate"
        ? "Your item has been matched with an NGO partner."
        : submission.disposition === "recycle"
        ? "Your item has been dispatched to a certified recycling facility."
        : "Your item is now live on the ReLoop marketplace.",
      completedAt: ["listed","donated","recycled"].includes(submission.returnStatus) ? new Date(created + 48 * 3600 * 1000).toISOString() : null,
      done: ["listed","donated","recycled"].includes(submission.returnStatus),
    },
  ];
  return steps;
}

export const returns = new Hono()
  .use(authMiddleware)
  .get("/", requireAuth, async (c) => {
    const user = c.get("user")!;
    const submissions = await db
      .select()
      .from(schema.returnSubmissions)
      .where(eq(schema.returnSubmissions.userId, user.id))
      .orderBy(desc(schema.returnSubmissions.createdAt));
    return c.json({ submissions }, 200);
  })
  .post("/submit", requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();
    const { productName, category, brand, purchaseDate, returnReason, imageUrl, description, orderId } = body;

    // If orderId provided, validate the order belongs to user and is within return window
    let orderRecord: typeof schema.orders.$inferSelect | null = null;
    if (orderId) {
      const [found] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
      if (!found) return c.json({ error: "Order not found" }, 404);
      if (found.userId !== user.id) return c.json({ error: "Order does not belong to you" }, 403);
      if (found.status !== "delivered") return c.json({ error: "Order is not eligible for return" }, 400);

      // Check return window
      const purchasedMs = new Date(found.purchasedAt).getTime();
      const windowMs = found.returnWindowDays * 24 * 60 * 60 * 1000;
      const deadline = purchasedMs + windowMs;
      if (Date.now() > deadline) {
        return c.json({ error: `Return window expired. This order had a ${found.returnWindowDays}-day return window.` }, 400);
      }
      orderRecord = found;
    }

    // Run AI disposition
    const aiResult = await aiDispose({ category: category || orderRecord?.category, returnReason, brand: brand || orderRecord?.brand, purchaseDate, description });

    const [submission] = await db
      .insert(schema.returnSubmissions)
      .values({
        userId: user.id,
        orderId: orderId || null,
        productName: productName || orderRecord?.productName || "Unknown",
        category: category || orderRecord?.category || "other",
        brand: brand || orderRecord?.brand || "Unknown",
        purchaseDate,
        returnReason,
        imageUrl: imageUrl || orderRecord?.imageUrl || null,
        disposition: aiResult.disposition,
        qualityGrade: aiResult.qualityGrade,
        qualityScore: aiResult.qualityScore,
        confidenceScore: aiResult.confidenceScore,
        greenCreditsAwarded: aiResult.greenCreditsAwarded,
        aiReasoning: aiResult.aiReasoning,
        status: "analyzed",
        returnStatus: "pickup_scheduled",
      })
      .returning();

    // Mark order as return_initiated
    if (orderId) {
      await db.update(schema.orders).set({ status: "return_initiated" }).where(eq(schema.orders.id, orderId));
    }

    // If disposition is resell → auto-list on marketplace
    let listedProduct = null;
    if (aiResult.disposition === "resell") {
      const originalPrice = orderRecord?.price || 0;
      const reloopPrice = Math.round(originalPrice * (aiResult.qualityScore / 100) * 0.7);
      const [product] = await db.insert(schema.products).values({
        title: productName || orderRecord?.productName || "Returned Product",
        description: `Returned item — ${aiResult.qualityGrade} condition. ${aiResult.aiReasoning}`,
        originalPrice,
        reloopPrice: reloopPrice || 999,
        imageUrl: imageUrl || orderRecord?.imageUrl || categoryImages[category || "other"],
        category: category || orderRecord?.category || "other",
        brand: brand || orderRecord?.brand || "ReLoop",
        disposition: "resell",
        qualityGrade: aiResult.qualityGrade,
        qualityScore: aiResult.qualityScore,
        listingType: "certified",
        isCertified: true,
        greenCreditsEarned: aiResult.greenCreditsAwarded,
        co2SavedKg: aiResult.qualityScore > 60 ? 2.4 : 0.8,
        status: "active",
        isReturnedItem: true,
      }).returning();
      listedProduct = product;

      // Update submission with listed product id and advance status
      await db.update(schema.returnSubmissions).set({
        listedProductId: product.id,
        returnStatus: "listed",
        pickedUpAt: new Date(Date.now() - 24 * 3600 * 1000),
        inTransitAt: new Date(Date.now() - 16 * 3600 * 1000),
        processedAt: new Date(Date.now() - 4 * 3600 * 1000),
      }).where(eq(schema.returnSubmissions.id, submission.id));

      submission.returnStatus = "listed";
      submission.listedProductId = product.id;
    } else if (aiResult.disposition === "donate") {
      await db.update(schema.returnSubmissions).set({ returnStatus: "donated" }).where(eq(schema.returnSubmissions.id, submission.id));
      submission.returnStatus = "donated";
    } else if (aiResult.disposition === "recycle") {
      await db.update(schema.returnSubmissions).set({ returnStatus: "recycled" }).where(eq(schema.returnSubmissions.id, submission.id));
      submission.returnStatus = "recycled";
    }

    // Award green credits
    await db.insert(schema.creditTransactions).values({
      userId: user.id,
      amount: aiResult.greenCreditsAwarded,
      type: "return",
      description: `Return of ${productName || orderRecord?.productName} — ${aiResult.disposition} route`,
      referenceId: submission.id,
    });

    // Upsert user profile
    const [profile] = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, user.id));
    if (profile) {
      await db.update(schema.userProfiles).set({
        greenCredits: profile.greenCredits + aiResult.greenCreditsAwarded,
        totalReturns: profile.totalReturns + 1,
        totalDonations: aiResult.disposition === "donate" ? profile.totalDonations + 1 : profile.totalDonations,
        co2Saved: profile.co2Saved + (aiResult.qualityScore > 60 ? 2.4 : 0.8),
      }).where(eq(schema.userProfiles.userId, user.id));
    } else {
      await db.insert(schema.userProfiles).values({
        userId: user.id,
        greenCredits: aiResult.greenCreditsAwarded,
        totalReturns: 1,
        totalDonations: aiResult.disposition === "donate" ? 1 : 0,
        co2Saved: aiResult.qualityScore > 60 ? 2.4 : 0.8,
      });
    }

    const timeline = getTrackingTimeline(submission);
    return c.json({ submission, aiResult, timeline, listedProduct }, 201);
  })
  .get("/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const [submission] = await db
      .select()
      .from(schema.returnSubmissions)
      .where(eq(schema.returnSubmissions.id, id));
    if (!submission) return c.json({ error: "Not found" }, 404);
    if (submission.userId !== user.id) return c.json({ error: "Forbidden" }, 403);

    const timeline = getTrackingTimeline(submission);

    // If listed, fetch the marketplace product
    let listedProduct = null;
    if (submission.listedProductId) {
      const [p] = await db.select().from(schema.products).where(eq(schema.products.id, submission.listedProductId));
      listedProduct = p || null;
    }

    return c.json({ submission, timeline, listedProduct }, 200);
  });
