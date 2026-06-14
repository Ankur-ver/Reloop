import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";
import { aiAnalyzeP2PPhotos } from "../lib/ai";

export const p2p = new Hono()
  .use(authMiddleware)

  // ── Listings ────────────────────────────────────────────────────────────
  .get("/listings", async (c) => {
    const listings = await db
      .select()
      .from(schema.p2pListings)
      .where(eq(schema.p2pListings.status, "active"))
      .orderBy(desc(schema.p2pListings.createdAt));
    return c.json({ listings }, 200);
  })

  .post("/listings", requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();
    const [listing] = await db.insert(schema.p2pListings).values({
      sellerId: user.id,
      sellerName: user.name || "Anonymous",
      title: body.title,
      category: body.category,
      condition: body.condition,
      qualityGrade: body.qualityGrade || "good",
      price: body.price,
      originalPrice: body.originalPrice || body.price * 1.5,
      imageUrl: body.imageUrl,
      imageUrls: JSON.stringify(body.imageUrls || [body.imageUrl]),
      location: body.location || "India",
      description: body.description || "Item listed via ReLoop P2P marketplace.",
      status: "active",
      aiScore: body.aiScore ?? null,
      sellerRating: body.sellerRating ?? null,
      aiVerdict: body.aiVerdict ?? null,
      aiReasoning: body.aiReasoning ?? null,
      aiPositives: JSON.stringify(body.aiPositives || []),
      aiConcerns: JSON.stringify(body.aiConcerns || []),
      isRecyclable: body.isRecyclable ?? false,
      recycleData: body.recycleData ? JSON.stringify(body.recycleData) : null,
    }).returning();
    return c.json({ listing }, 201);
  })

  .get("/listings/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [listing] = await db
      .select()
      .from(schema.p2pListings)
      .where(eq(schema.p2pListings.id, id));
    if (!listing) return c.json({ error: "Not found" }, 404);
    await db.update(schema.p2pListings).set({ views: listing.views + 1 }).where(eq(schema.p2pListings.id, id));
    return c.json({ listing }, 200);
  })

  .get("/my-listings", requireAuth, async (c) => {
    const user = c.get("user")!;
    const listings = await db
      .select()
      .from(schema.p2pListings)
      .where(eq(schema.p2pListings.sellerId, user.id))
      .orderBy(desc(schema.p2pListings.createdAt));
    return c.json({ listings }, 200);
  })

  .patch("/listings/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const [listing] = await db.select().from(schema.p2pListings).where(eq(schema.p2pListings.id, id));
    if (!listing) return c.json({ error: "Not found" }, 404);
    if (listing.sellerId !== user.id) return c.json({ error: "Forbidden" }, 403);
    const body = await c.req.json();
    const updateData: Partial<typeof schema.p2pListings.$inferInsert> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.status !== undefined) updateData.status = body.status;
    const [updated] = await db.update(schema.p2pListings).set(updateData).where(eq(schema.p2pListings.id, id)).returning();
    return c.json({ listing: updated }, 200);
  })

  .delete("/listings/:id", requireAuth, async (c) => {
    const user = c.get("user")!;
    const id = parseInt(c.req.param("id"));
    const [listing] = await db.select().from(schema.p2pListings).where(eq(schema.p2pListings.id, id));
    if (!listing) return c.json({ error: "Not found" }, 404);
    if (listing.sellerId !== user.id) return c.json({ error: "Forbidden" }, 403);
    await db.update(schema.p2pListings).set({ status: "sold" }).where(eq(schema.p2pListings.id, id));
    return c.json({ success: true }, 200);
  })

  // ── AI Analyze ──────────────────────────────────────────────────────────
  .post("/analyze", requireAuth, async (c) => {
    const body = await c.req.json();
    const imageUrls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls : [];
    if (imageUrls.length === 0) {
      return c.json({ error: "No images provided" }, 400);
    }
    // Convert relative /api/upload/img/... to absolute for server-side fetch
    const origin = new URL(c.req.url).origin;
    const absoluteUrls = imageUrls.map((url) =>
      url.startsWith("/") ? `${origin}${url}` : url
    );
    try {
      const result = await aiAnalyzeP2PPhotos(absoluteUrls, {
        category: body.category,
        title: body.title,
        condition: body.condition,
      });
      return c.json(result, 200);
    } catch (err: any) {
      return c.json({ error: err.message || "Analysis failed" }, 500);
    }
  })

  // ── Donations ───────────────────────────────────────────────────────────
  .get("/donations", async (c) => {
    const donations = await db
      .select()
      .from(schema.p2pDonations)
      .orderBy(desc(schema.p2pDonations.createdAt));
    return c.json({ donations }, 200);
  })

  .post("/donations", requireAuth, async (c) => {
    const user = c.get("user")!;
    const body = await c.req.json();

    const listingId = parseInt(body.listingId) || 0;

    // Try to fetch the listing — but it's optional (donate can come from any product)
    let listing: typeof schema.p2pListings.$inferSelect | undefined;
    if (listingId > 0) {
      const rows = await db
        .select()
        .from(schema.p2pListings)
        .where(eq(schema.p2pListings.id, listingId));
      listing = rows[0];
    }

    // Build donation data — prefer listing fields, fall back to body fields
    const donationData = {
      listingId: listingId || 0,
      donorId: user.id,
      donorName: user.name || "Anonymous",
      title: listing?.title ?? body.title ?? "Donated Item",
      category: listing?.category ?? body.category ?? "other",
      condition: listing?.condition ?? body.condition ?? "Good",
      imageUrl: listing?.imageUrl ?? body.imageUrl ?? "",
      imageUrls: listing?.imageUrls ?? JSON.stringify(body.imageUrls || []),
      location: listing?.location ?? body.location ?? "India",
      description: listing?.description ?? body.description ?? "",
      donateReason: body.donateReason || "",
      recipientType: body.recipientType || "ngo",
      aiScore: listing?.aiScore ?? body.aiScore ?? null,
      qualityGrade: listing?.qualityGrade ?? body.qualityGrade ?? "good",
      aiVerdict: listing?.aiVerdict ?? body.aiVerdict ?? null,
      aiReasoning: listing?.aiReasoning ?? body.aiReasoning ?? null,
      aiPositives: listing?.aiPositives ?? JSON.stringify(body.aiPositives || []),
      aiConcerns: listing?.aiConcerns ?? JSON.stringify(body.aiConcerns || []),
      isRecyclable: listing?.isRecyclable ?? body.isRecyclable ?? false,
      recycleData: listing?.recycleData ?? (body.recycleData ? JSON.stringify(body.recycleData) : null),
      status: "pending" as const,
    };

    const [donation] = await db.insert(schema.p2pDonations).values(donationData).returning();

    // Mark the P2P listing as donated only if it came from one
    if (listing) {
      await db.update(schema.p2pListings)
        .set({ status: "sold" })
        .where(eq(schema.p2pListings.id, listingId));
    }

    return c.json({ donation }, 201);
  });
