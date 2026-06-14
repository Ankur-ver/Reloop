import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, requireAuth } from "../middleware/auth";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function generateOrderRef() {
  return `RLP-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function ensureDemoOrders(userId: string) {
  const existing = await db.select().from(schema.orders).where(eq(schema.orders.userId, userId));
  if (existing.length > 0) return;

  const demoOrders = [
    { userId, orderRef: "AMZ-2024-88210", productName: "Sony WH-1000XM5 Headphones", brand: "Sony", category: "electronics", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80", price: 29999, purchasedAt: daysAgo(8), returnWindowDays: 30, status: "delivered" },
    { userId, orderRef: "AMZ-2024-74331", productName: "Nike Air Max 270", brand: "Nike", category: "footwear", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80", price: 9995, purchasedAt: daysAgo(3), returnWindowDays: 10, status: "delivered" },
    { userId, orderRef: "AMZ-2024-61190", productName: "Levi's 511 Slim Jeans", brand: "Levi's", category: "clothing", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80", price: 3499, purchasedAt: daysAgo(45), returnWindowDays: 30, status: "delivered" },
    { userId, orderRef: "AMZ-2024-52007", productName: "Instant Pot Duo 7-in-1", brand: "Instant Pot", category: "appliances", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80", price: 7499, purchasedAt: daysAgo(12), returnWindowDays: 30, status: "delivered" },
    { userId, orderRef: "AMZ-2024-39910", productName: "Atomic Habits — James Clear", brand: "Penguin", category: "books", imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&q=80", price: 599, purchasedAt: daysAgo(20), returnWindowDays: 15, status: "delivered" },
  ];

  for (const o of demoOrders) {
    await db.insert(schema.orders).values(o);
  }
}

function enrichOrder(o: typeof schema.orders.$inferSelect) {
  const now = Date.now();
  const purchasedMs = new Date(o.purchasedAt).getTime();
  const windowMs = o.returnWindowDays * 24 * 60 * 60 * 1000;
  const deadline = new Date(purchasedMs + windowMs);
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now) / (24 * 60 * 60 * 1000)));
  const isReturnable = daysLeft > 0 && o.status === "delivered";
  return { ...o, daysLeft, isReturnable, returnDeadline: deadline.toISOString() };
}

export const orders = new Hono()
  .use(authMiddleware)

  // List user orders (for return flow)
  .get("/", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    await ensureDemoOrders(userId);
    const userOrders = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.purchasedAt));
    return c.json({ orders: userOrders.map(enrichOrder) }, 200);
  })

  // Place order from cart — bypasses payment
  .post("/place", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const body = await c.req.json() as {
      items: Array<{
        id: string;
        title: string;
        brand: string;
        imageUrl: string;
        reloopPrice: number;
        originalPrice: number;
        qualityGrade: string;
        greenCreditsEarned: number;
        quantity: number;
        category?: string;
      }>;
    };

    if (!body.items || body.items.length === 0) {
      return c.json({ error: "Cart is empty" }, 400);
    }

    const orderRef = generateOrderRef();
    const now = new Date();
    const placedOrders: (typeof schema.orders.$inferSelect)[] = [];
    let totalCredits = 0;

    for (const item of body.items) {
      // Mark marketplace product as sold
      const productId = parseInt(item.id);
      if (!isNaN(productId)) {
        await db.update(schema.products)
          .set({ status: "sold" })
          .where(eq(schema.products.id, productId));
      }

      // One order record per cart item (so each is independently returnable)
      const [order] = await db.insert(schema.orders).values({
        userId,
        orderRef,
        productName: item.title,
        brand: item.brand,
        category: item.category || "other",
        imageUrl: item.imageUrl,
        price: item.reloopPrice,
        purchasedAt: now,
        returnWindowDays: 30,
        status: "delivered",
      }).returning();

      placedOrders.push(order);

      // Award green credits
      const credits = item.greenCreditsEarned * item.quantity;
      totalCredits += credits;
      if (credits > 0) {
        await db.insert(schema.creditTransactions).values({
          userId,
          amount: credits,
          type: "return",
          description: `Purchase of ${item.title} via ReLoop`,
          referenceId: order.id,
        });
      }
    }

    // Upsert profile credits
    if (totalCredits > 0) {
      const [profile] = await db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, userId));
      if (profile) {
        await db.update(schema.userProfiles)
          .set({ greenCredits: profile.greenCredits + totalCredits })
          .where(eq(schema.userProfiles.userId, userId));
      } else {
        await db.insert(schema.userProfiles).values({
          userId, greenCredits: totalCredits, totalReturns: 0, totalDonations: 0, co2Saved: 0,
        });
      }
    }

    const totalAmount = body.items.reduce((s, i) => s + i.reloopPrice * i.quantity, 0);
    const estimatedDelivery = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return c.json({
      success: true,
      orderRef,
      orders: placedOrders.map(enrichOrder),
      totalAmount,
      totalCredits,
      itemCount: body.items.reduce((s, i) => s + i.quantity, 0),
      estimatedDelivery: estimatedDelivery.toISOString(),
      placedAt: now.toISOString(),
    }, 201);
  })

  // Single order
  .get("/:id", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const id = parseInt(c.req.param("id"));
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    if (!order) return c.json({ error: "Not found" }, 404);
    if (order.userId !== userId) return c.json({ error: "Forbidden" }, 403);
    return c.json({ order: enrichOrder(order) }, 200);
  });
