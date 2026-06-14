import { Hono } from "hono";
import { db } from "../database";
import * as schema from "../database/schema";
import { eq, desc, and, ne } from "drizzle-orm";

export const products = new Hono()
  .get("/", async (c) => {
    const category = c.req.query("category");
    const disposition = c.req.query("disposition");
    const grade = c.req.query("grade");
    const listingType = c.req.query("listingType");
    const search = c.req.query("search");
    const includeReturned = c.req.query("includeReturned") === "true";

    const allProducts = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.status, "active"))
      .orderBy(desc(schema.products.createdAt));

    let filtered = allProducts;

    // By default, exclude returned items from the main marketplace feed
    if (!includeReturned) {
      filtered = filtered.filter((p) => !p.isReturnedItem);
    }

    if (category) filtered = filtered.filter((p) => p.category === category);
    if (disposition) filtered = filtered.filter((p) => p.disposition === disposition);
    if (grade) filtered = filtered.filter((p) => p.qualityGrade === grade);
    if (listingType) filtered = filtered.filter((p) => p.listingType === listingType);
    if (search) filtered = filtered.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    );

    return c.json({ products: filtered }, 200);
  })
  .get("/:id/returned-replicas", async (c) => {
    // Find returned versions of the same product (same brand + category)
    const id = parseInt(c.req.param("id"));
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    if (!product) return c.json({ replicas: [] }, 200);

    const allActive = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.status, "active"))
      .orderBy(desc(schema.products.createdAt));

    // Match: same brand + category, isReturnedItem=true, different id
    const replicas = allActive.filter(
      (p) =>
        p.isReturnedItem &&
        p.id !== id &&
        p.brand.toLowerCase() === product.brand.toLowerCase() &&
        p.category === product.category
    );

    return c.json({ replicas, originalProduct: product }, 200);
  })
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    if (!product) return c.json({ error: "Not found" }, 404);
    await db.update(schema.products).set({ views: product.views + 1 }).where(eq(schema.products.id, id));
    return c.json({ product }, 200);
  });
