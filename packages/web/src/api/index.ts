import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { products } from "./routes/products";
import { returns } from "./routes/returns";
import { credits } from "./routes/credits";
import { p2p } from "./routes/p2p";
import { dashboard } from "./routes/dashboard";
import { prevent } from "./routes/prevent";
import { seed } from "./routes/seed";
import { admin } from "./routes/admin";
import { upload } from "./routes/upload";
import { orders } from "./routes/orders";

const app = new Hono()
  .use(cors({
    origin: (origin) => origin ?? "*",
    credentials: true,
    exposeHeaders: ["set-auth-token"],
  }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("api")
  .get("/health", (c) => c.json({ status: "ok", service: "ReLoop API" }, 200))
  .route("/products", products)
  .route("/returns", returns)
  .route("/credits", credits)
  .route("/p2p", p2p)
  .route("/dashboard", dashboard)
  .route("/prevent", prevent)
  .route("/seed", seed)
  .route("/admin", admin)
  .route("/upload", upload)
  .route("/orders", orders);

export type AppType = typeof app;
export default app;
