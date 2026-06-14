import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { auth } from "../auth";
import { db } from "../database";
import { sql } from "drizzle-orm";

// Admin auth middleware
const requireAdmin = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ message: "Unauthorized" }, 401);
  // Check role in DB
  const userRow = await db.run(sql`SELECT role FROM user WHERE id = ${session.user.id}`);
  const role = (userRow as any)?.rows?.[0]?.[0] ?? "user";
  if (role !== "admin") return c.json({ message: "Forbidden: admin only" }, 403);
  c.set("user", session.user);
  return next();
});

// Separate router for unprotected admin routes
const adminPublic = new Hono()
  .get("/check", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ isAdmin: false, authenticated: false });
    const userRow = await db.run(sql`SELECT role FROM user WHERE id = ${session.user.id}`);
    const role = (userRow as any)?.rows?.[0]?.[0] ?? "user";
    return c.json({ isAdmin: role === "admin", authenticated: true, role });
  });

const adminProtected = new Hono()
  .use("*", requireAdmin)

  // ── Overview stats ──────────────────────────────────────────────
  .get("/stats", async (c) => {
    const [
      totalReturns,
      totalProducts,
      totalP2P,
      totalUsers,
      holdingStats,
      co2Stats,
      returnsRaw,
      dispositionRaw,
      categoryRaw,
      p2pStatusRaw,
      creditsRaw,
    ] = await Promise.all([
      db.run(sql`SELECT COUNT(*) as count FROM return_submissions`),
      db.run(sql`SELECT COUNT(*) as count FROM products`),
      db.run(sql`SELECT COUNT(*) as count FROM p2p_listings`),
      db.run(sql`SELECT COUNT(*) as count FROM user`),
      db.run(sql`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'holding' THEN 1 ELSE 0 END) as holding,
          SUM(CASE WHEN status = 'matched' THEN 1 ELSE 0 END) as matched,
          SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
          SUM(CASE WHEN status = 'warehouse' THEN 1 ELSE 0 END) as warehouse,
          SUM(co2_saved) as totalCo2,
          SUM(distance_saved_km) as totalDistanceSaved,
          AVG(demand_score) as avgDemandScore,
          AVG(resale_probability) as avgResaleProbability
        FROM local_holdings
      `),
      db.run(sql`SELECT SUM(co2_saved) as total FROM user_profiles`),
      db.run(sql`SELECT created_at FROM return_submissions ORDER BY created_at ASC`),
      db.run(sql`SELECT disposition, COUNT(*) as cnt FROM return_submissions WHERE disposition IS NOT NULL GROUP BY disposition`),
      db.run(sql`SELECT category, COUNT(*) as cnt FROM return_submissions GROUP BY category ORDER BY cnt DESC LIMIT 8`),
      db.run(sql`SELECT status, COUNT(*) as cnt FROM p2p_listings GROUP BY status`),
      db.run(sql`SELECT SUM(green_credits) as total FROM user_profiles`),
    ]);

    const hs = (holdingStats as any).rows[0];
    const successfulSaves = (parseInt(hs[2]) || 0) + (parseInt(hs[3]) || 0);
    const totalHoldings = parseInt(hs[0]) || 0;
    const localResaleRate = totalHoldings > 0 ? Math.round((successfulSaves / totalHoldings) * 100) : 0;

    // Build monthly trend for last 6 months
    const now = new Date();
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleString("en-IN", { month: "short" });
      const count = ((returnsRaw as any).rows as any[]).filter((r: any) => {
        const ts = r[0];
        if (!ts) return false;
        const rd = new Date(typeof ts === "number" ? ts * 1000 : ts);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      }).length;
      return { month: label, returns: count, co2: parseFloat((count * 1.8).toFixed(1)) };
    });

    // Disposition breakdown
    const dispositionBreakdown: Record<string, number> = {};
    ((dispositionRaw as any).rows as any[]).forEach((r: any) => {
      dispositionBreakdown[r[0]] = parseInt(r[1]) || 0;
    });

    // Category breakdown
    const categoryBreakdown = ((categoryRaw as any).rows as any[]).map((r: any) => ({
      name: r[0], value: parseInt(r[1]) || 0
    }));

    // P2P status
    const p2pStatus: Record<string, number> = {};
    ((p2pStatusRaw as any).rows as any[]).forEach((r: any) => {
      p2pStatus[r[0]] = parseInt(r[1]) || 0;
    });

    return c.json({
      overview: {
        totalReturns: (totalReturns as any).rows[0][0],
        totalProducts: (totalProducts as any).rows[0][0],
        totalP2P: (totalP2P as any).rows[0][0],
        totalUsers: (totalUsers as any).rows[0][0],
        totalCo2: parseFloat(((co2Stats as any).rows[0][0] || "0")).toFixed(1),
        totalCredits: parseInt((creditsRaw as any).rows[0][0] || "0"),
      },
      lrhn: {
        total: hs[0],
        holding: hs[1],
        matched: hs[2],
        shipped: hs[3],
        expired: hs[4],
        warehouse: hs[5],
        totalCo2Saved: parseFloat(hs[6] || "0").toFixed(1),
        totalDistanceSaved: hs[7],
        avgDemandScore: Math.round(parseFloat(hs[8] || "0")),
        avgResaleProbability: Math.round(parseFloat(hs[9] || "0")),
        localResaleRate,
      },
      monthlyTrend,
      dispositionBreakdown,
      categoryBreakdown,
      p2pStatus,
    });
  })

  // ── All returns ──────────────────────────────────────────────────
  .get("/returns", async (c) => {
    const returns = await db.run(sql`
      SELECT 
        rs.*,
        u.name as user_name,
        u.email as user_email
      FROM return_submissions rs
      LEFT JOIN user u ON rs.user_id = u.id
      ORDER BY rs.created_at DESC
      LIMIT 100
    `);
    const cols = returns.columns;
    const rows = (returns as any).rows.map((r: any) => {
      const obj: Record<string, any> = {};
      cols.forEach((col, i) => obj[col] = r[i]);
      return obj;
    });
    return c.json({ returns: rows });
  })

  // ── LRHN holdings ────────────────────────────────────────────────
  .get("/lrhn", async (c) => {
    const holdings = await db.run(sql`
      SELECT 
        lh.*,
        hub.name as hub_name,
        hub.type as hub_type,
        hub.city as hub_city,
        hub.state as hub_state,
        hub.address as hub_address,
        hub.lat as hub_lat,
        hub.lng as hub_lng,
        hub.capacity as hub_capacity,
        hub.current_load as hub_current_load
      FROM local_holdings lh
      JOIN local_hubs hub ON lh.hub_id = hub.id
      ORDER BY lh.held_since DESC
    `);
    const cols = holdings.columns;
    const rows = (holdings as any).rows.map((r: any) => {
      const obj: Record<string, any> = {};
      cols.forEach((col, i) => obj[col] = r[i]);
      return obj;
    });
    return c.json({ holdings: rows });
  })

  // ── Single holding ────────────────────────────────────────────────
  .get("/lrhn/:id", async (c) => {
    const id = c.req.param("id");
    const res = await db.run(sql`
      SELECT lh.*, hub.name as hub_name, hub.type as hub_type, hub.city as hub_city,
        hub.state as hub_state, hub.address as hub_address, hub.capacity as hub_capacity, hub.current_load as hub_current_load
      FROM local_holdings lh
      JOIN local_hubs hub ON lh.hub_id = hub.id
      WHERE lh.id = ${parseInt(id)}
    `);
    const cols = res.columns;
    const row = (res as any).rows[0];
    if (!row) return c.json({ message: "Not found" }, 404);
    const obj: Record<string, any> = {};
    cols.forEach((col, i) => obj[col] = row[i]);
    return c.json({ holding: obj });
  })

  // ── Update holding status ─────────────────────────────────────────
  .patch("/lrhn/:id/status", async (c) => {
    const id = c.req.param("id");
    const { status } = await c.req.json<{ status: string }>();
    const allowed = ["holding", "matched", "shipped", "expired", "warehouse"];
    if (!allowed.includes(status)) return c.json({ message: "Invalid status" }, 400);

    const now = Math.floor(Date.now() / 1000);
    if (status === "matched") {
      await db.run(sql`UPDATE local_holdings SET status = ${status}, matched_at = ${now} WHERE id = ${parseInt(id)}`);
    } else if (status === "shipped") {
      await db.run(sql`UPDATE local_holdings SET status = ${status}, shipped_at = ${now} WHERE id = ${parseInt(id)}`);
    } else {
      await db.run(sql`UPDATE local_holdings SET status = ${status} WHERE id = ${parseInt(id)}`);
    }
    return c.json({ success: true });
  })

  // ── All products ──────────────────────────────────────────────────
  .get("/products", async (c) => {
    const res = await db.run(sql`SELECT * FROM products ORDER BY created_at DESC`);
    const cols = res.columns;
    const rows = (res as any).rows.map((r: any) => {
      const obj: Record<string, any> = {};
      cols.forEach((col, i) => obj[col] = r[i]);
      return obj;
    });
    return c.json({ products: rows });
  })

  // ── All P2P listings ──────────────────────────────────────────────
  .get("/p2p", async (c) => {
    const res = await db.run(sql`
      SELECT pl.*, u.name as seller_display_name, u.email as seller_email
      FROM p2p_listings pl
      LEFT JOIN user u ON pl.seller_id = u.id
      ORDER BY pl.created_at DESC
    `);
    const cols = res.columns;
    const rows = (res as any).rows.map((r: any) => {
      const obj: Record<string, any> = {};
      cols.forEach((col, i) => obj[col] = r[i]);
      return obj;
    });
    return c.json({ listings: rows });
  })

  // ── All hubs ──────────────────────────────────────────────────────
  .get("/hubs", async (c) => {
    const res = await db.run(sql`SELECT * FROM local_hubs ORDER BY city`);
    const cols = res.columns;
    const rows = (res as any).rows.map((r: any) => {
      const obj: Record<string, any> = {};
      cols.forEach((col, i) => obj[col] = r[i]);
      return obj;
    });
    return c.json({ hubs: rows });
  })

  // ── All users ──────────────────────────────────────────────────────
  .get("/users", async (c) => {
    const res = await db.run(sql`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
        COALESCE(up.green_credits, 0) as green_credits,
        COALESCE(up.total_returns, 0) as total_returns,
        COALESCE(up.co2_saved, 0) as co2_saved
      FROM user u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY u.created_at DESC
    `);
    const cols = res.columns;
    const rows = (res as any).rows.map((r: any) => {
      const obj: Record<string, any> = {};
      cols.forEach((col, i) => obj[col] = r[i]);
      return obj;
    });
    return c.json({ users: rows });
  });

export const admin = new Hono()
  .route("/", adminPublic)
  .route("/", adminProtected);
