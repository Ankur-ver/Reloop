import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ReLoop user profile — linked to Better Auth's user table via userId
export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(), // Better Auth user.id
  greenCredits: integer("green_credits").notNull().default(0),
  totalReturns: integer("total_returns").notNull().default(0),
  totalDonations: integer("total_donations").notNull().default(0),
  co2Saved: real("co2_saved").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Products in the second-life ecosystem
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  originalPrice: real("original_price").notNull(),
  reloopPrice: real("reloop_price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  disposition: text("disposition").notNull(), // resell | refurbish | donate | recycle | exchange
  qualityGrade: text("quality_grade").notNull(), // excellent | good | fair | poor
  qualityScore: integer("quality_score").notNull(),
  listingType: text("listing_type").notNull(), // certified | p2p | exchange
  sellerId: text("seller_id"), // Better Auth user id
  sellerName: text("seller_name"),
  isCertified: integer("is_certified", { mode: "boolean" }).notNull().default(false),
  greenCreditsEarned: integer("green_credits_earned").notNull().default(0),
  co2SavedKg: real("co2_saved_kg").notNull().default(0),
  status: text("status").notNull().default("active"), // active | sold | donated | recycled
  views: integer("views").notNull().default(0),
  isReturnedItem: integer("is_returned_item", { mode: "boolean" }).notNull().default(false), // true = came from a return submission
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Return submissions
export const returnSubmissions = sqliteTable("return_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id"), // Better Auth user id
  orderId: integer("order_id"), // links to orders table
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  purchaseDate: text("purchase_date").notNull(),
  returnReason: text("return_reason").notNull(),
  imageUrl: text("image_url"),
  disposition: text("disposition"),
  qualityGrade: text("quality_grade"),
  qualityScore: integer("quality_score"),
  confidenceScore: integer("confidence_score"),
  greenCreditsAwarded: integer("green_credits_awarded").notNull().default(0),
  aiReasoning: text("ai_reasoning"),
  status: text("status").notNull().default("pending"),
  // Return tracking lifecycle
  returnStatus: text("return_status").notNull().default("initiated"), // initiated | pickup_scheduled | picked_up | in_transit | processed | listed | donated | recycled
  pickedUpAt: integer("picked_up_at", { mode: "timestamp" }),
  inTransitAt: integer("in_transit_at", { mode: "timestamp" }),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  listedProductId: integer("listed_product_id"), // if disposition=resell, the marketplace product.id
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Green credits transactions
export const creditTransactions = sqliteTable("credit_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(), // Better Auth user id
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // return | donate | recycle | exchange | redeem
  description: text("description").notNull(),
  referenceId: integer("reference_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// P2P listings
export const p2pListings = sqliteTable("p2p_listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sellerId: text("seller_id").notNull(), // Better Auth user id
  sellerName: text("seller_name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  originalPrice: real("original_price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  qualityGrade: text("quality_grade").notNull(),
  condition: text("condition").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default("active"),
  views: integer("views").notNull().default(0),
  aiScore: integer("ai_score").default(null),           // 0-100 from AI photo analysis
  sellerRating: real("seller_rating").default(null),    // e.g. 4.2 — set at listing time from seller history
  imageUrls: text("image_urls").notNull().default("[]"), // JSON array of all 5 angle photos
  // Full AI analysis stored as JSON
  aiVerdict: text("ai_verdict").default(null),
  aiReasoning: text("ai_reasoning").default(null),
  aiPositives: text("ai_positives").notNull().default("[]"),
  aiConcerns: text("ai_concerns").notNull().default("[]"),
  // Recyclability
  isRecyclable: integer("is_recyclable", { mode: "boolean" }).notNull().default(false),
  recycleData: text("recycle_data").default(null),  // JSON: { materials, parts, instructions, environmentalImpact }
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Sustainability metrics (platform-wide)
export const platformMetrics = sqliteTable("platform_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  productsRerouted: integer("products_rerouted").notNull().default(0),
  co2SavedKg: real("co2_saved_kg").notNull().default(0),
  creditsIssued: integer("credits_issued").notNull().default(0),
  donationsCount: integer("donations_count").notNull().default(0),
  recycleCount: integer("recycle_count").notNull().default(0),
  resellCount: integer("resell_count").notNull().default(0),
  refurbishCount: integer("refurbish_count").notNull().default(0),
});

// Local hubs — delivery stations, fulfillment centers, partner stores
export const localHubs = sqliteTable("local_hubs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // delivery_station | fulfillment_hub | partner_store
  city: text("city").notNull(),
  state: text("state").notNull(),
  address: text("address").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  capacity: integer("capacity").notNull().default(100),
  currentLoad: integer("current_load").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Local Return Holding Network entries
export const localHoldings = sqliteTable("local_holdings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  returnSubmissionId: integer("return_submission_id"), // links to returnSubmissions
  hubId: integer("hub_id").notNull(), // links to localHubs
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  qualityGrade: text("quality_grade").notNull(), // excellent | good | fair | poor
  qualityScore: integer("quality_score").notNull(),
  imageUrl: text("image_url").notNull(),
  originalPrice: real("original_price").notNull(),
  holdingPrice: real("holding_price").notNull(), // discounted open-box price
  status: text("status").notNull().default("holding"), // holding | matched | shipped | expired | warehouse
  heldSince: integer("held_since", { mode: "timestamp" }).$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(), // 7 days from heldSince
  // AI demand forecast
  demandScore: integer("demand_score").notNull().default(0), // 0-100
  localSearchTrend: integer("local_search_trend").notNull().default(0),
  cartAdditions: integer("cart_additions").notNull().default(0),
  wishlistCount: integer("wishlist_count").notNull().default(0),
  historicalSalesScore: integer("historical_sales_score").notNull().default(0),
  resaleProbability: integer("resale_probability").notNull().default(0), // % chance of local resale
  forecastReasoning: text("forecast_reasoning"),
  // Matched order details
  matchedOrderId: text("matched_order_id"),
  matchedAt: integer("matched_at", { mode: "timestamp" }),
  shippedAt: integer("shipped_at", { mode: "timestamp" }),
  co2Saved: real("co2_saved").notNull().default(0), // kg CO2 saved vs warehouse route
  distanceSavedKm: integer("distance_saved_km").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Orders — represents Amazon/platform purchases eligible for return
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  orderRef: text("order_ref").notNull(), // e.g. "AMZ-2024-8821"
  productName: text("product_name").notNull(),
  brand: text("brand").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  price: real("price").notNull(),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }).notNull(),
  returnWindowDays: integer("return_window_days").notNull().default(30),
  status: text("status").notNull().default("delivered"), // delivered | return_initiated | returned | closed
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// P2P Donations
export const p2pDonations = sqliteTable("p2p_donations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),       // links to p2pListings
  donorId: text("donor_id").notNull(),
  donorName: text("donor_name").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  condition: text("condition").notNull(),
  imageUrl: text("image_url").notNull(),
  imageUrls: text("image_urls").notNull().default("[]"),  // JSON array
  location: text("location").notNull().default("India"),
  description: text("description").notNull().default(""),
  donateReason: text("donate_reason").notNull(),
  recipientType: text("recipient_type").notNull(),  // ngo | school | shelter | community
  // AI analysis snapshot
  aiScore: integer("ai_score").default(null),
  qualityGrade: text("quality_grade").notNull().default("good"),
  aiVerdict: text("ai_verdict").default(null),
  aiReasoning: text("ai_reasoning").default(null),
  aiPositives: text("ai_positives").notNull().default("[]"),   // JSON array
  aiConcerns: text("ai_concerns").notNull().default("[]"),     // JSON array
  // Recyclability
  isRecyclable: integer("is_recyclable", { mode: "boolean" }).notNull().default(false),
  recycleData: text("recycle_data").default(null),  // JSON: { materials, parts, instructions, environmentalImpact }
  status: text("status").notNull().default("pending"),  // pending | accepted | delivered
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export * from "./auth-schema";
