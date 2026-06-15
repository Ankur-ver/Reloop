# ReLoop

**ReLoop** is a sustainable commerce platform that gives returned and underutilized products a meaningful second life. Instead of immediately shipping returned products back to central warehouses, ReLoop introduces a **Local Return Holding Network (LRHN)** that temporarily stores eligible returns at nearby hubs and intelligently matches them with local demand, reducing logistics costs, delivery times, and environmental impact.

---

# Problem

Traditional reverse logistics is expensive and inefficient.

When a customer returns a perfectly usable product:

1. Product is shipped to a central warehouse.
2. Product is inspected and stored.
3. Another customer purchases the same item.
4. Product is shipped again to the new customer.

This process creates:

* High transportation costs
* Increased warehouse workload
* Longer delivery times
* Additional packaging waste
* Higher carbon emissions

---

# Solution: Local Return Holding Network (LRHN)

ReLoop transforms returned products into **temporary local inventory**.

### Workflow

```text
Customer Return
        ↓
AI Quality Assessment
        ↓
Nearest Local Hub
(Delivery Station / Fulfillment Center / Partner Store)
        ↓
7-Day Holding Window
        ↓
Demand Forecasting Engine
        ↓
Local Match Found?
     ↙         ↘
   YES         NO
    ↓           ↓
Ship to      Central
Customer     Warehouse
```

Instead of routing every return through a central warehouse, products are temporarily stored at nearby hubs and made available for local resale.

If demand is detected during the holding period, the product is shipped directly to the next customer.

---

# Key Features

## Local Return Holding Network

* Local storage of returned products
* Configurable holding periods
* Real-time inventory visibility
* Direct fulfillment from local hubs
* Reduced reverse logistics costs

## AI Quality Assessment

Automatically evaluates:

* Product condition
* Cosmetic damage
* Packaging quality
* Resale eligibility

Generates:

* Quality grade
* Confidence score
* Resale recommendation

## Demand Forecast Engine

Analyzes:

* Local search trends
* Cart additions
* Wishlist activity
* Historical purchases

Produces:

* Demand score
* Match probability
* Hold vs Warehouse recommendation

## Marketplace Integration

Returned products can be listed as:

* Open Box
* Like New
* Refurbished

Customers receive:

* Lower prices
* Faster delivery
* Sustainability benefits

---

# 🛠 Tech Stack

## Monorepo

* Bun Workspaces
* Turborepo

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Wouter

## Backend

* Hono
* Node.js
* Bun Runtime

## Database

* Turso / LibSQL
* Drizzle ORM

## Mobile

* Expo
* React Native

## Desktop

* Electron

---

# Project Structure

```text
packages/
├── web/
│   ├── src/
│   │   ├── api/
│   │   └── web/
│   └── vite.config.ts
│
├── mobile/
│   ├── app/
│   └── lib/
│
└── desktop/
    ├── electron/
    └── vite.config.ts
```

---

# Admin Portal

The platform includes a protected Admin Dashboard available at:

```text
/admin
```

Only authorized administrators can access operational data and LRHN management tools.

---

# Admin Dashboard

## Dashboard Overview

Route:

```text
/admin
```

Provides:

* Total Returns
* Active Holdings
* Matched Products
* Warehouse Transfers
* Cost Savings
* Carbon Emissions Saved

---

## Returns Management

Route:

```text
/admin/returns
```

Features:

* View all return submissions
* AI assessment results
* Product quality grading
* Return status tracking

---

## LRHN Management

Route:

```text
/admin/lrhn
```

Features:

* Local hub inventory
* Holding countdown timers
* Demand forecasting scores
* Hub utilization metrics
* Product movement tracking

Status Flow:

```text
holding
   ↓
matched
   ↓
shipped
```

or

```text
holding
   ↓
expired
   ↓
warehouse
```

---

## Product Management

Route:

```text
/admin/products
```

Features:

* Marketplace inventory
* Product moderation
* Refurbished listings
* Inventory analytics

---

## P2P Marketplace Management

Route:

```text
/admin/p2p
```

Features:

* User listings
* Moderation tools
* Listing approvals
* Marketplace insights

---

# 🗄 Database Schema

## local_hubs

Stores participating hub locations.

| Field    | Type   |
| -------- | ------ |
| id       | UUID   |
| name     | String |
| type     | String |
| city     | String |
| lat      | Number |
| lng      | Number |
| capacity | Number |

---

## local_holdings

Tracks products held in local hubs.

| Field                | Type   |
| -------------------- | ------ |
| id                   | UUID   |
| return_submission_id | UUID   |
| product_name         | String |
| hub_id               | UUID   |
| quality_grade        | String |
| held_since           | Date   |
| expires_at           | Date   |
| status               | String |
| demand_score         | Number |
| ai_forecast_data     | JSON   |
| matched_order_id     | UUID   |

---

## users

Additional field:

| Field | Type   |
| ----- | ------ |
| role  | String |

Roles:

```text
user
admin
```

---

# 🔌 API Routes

## Admin Stats

```http
GET /api/admin/stats
```

Returns:

* Total returns
* Active holdings
* Matched items
* Cost savings
* Sustainability metrics

---

## Returns

```http
GET /api/admin/returns
```

Returns all return submissions and AI analysis data.

---

## LRHN

```http
GET /api/admin/lrhn
GET /api/admin/lrhn/:id
PATCH /api/admin/lrhn/:id/status
```

Manage holdings and workflow statuses.

---

## Products

```http
GET /api/admin/products
```

Returns marketplace inventory.

---

## P2P Listings

```http
GET /api/admin/p2p
```

Returns peer-to-peer marketplace listings.

---

# Authentication & Authorization

Admin routes are protected using:

* Session authentication
* Role-based access control

Middleware:

```text
requireAdmin()
```

Checks:

* Authenticated session
* User role = admin

---

# 📈 Sustainability Impact

ReLoop aims to:

* Reduce reverse logistics costs
* Lower warehouse processing overhead
* Decrease transportation emissions
* Increase local product reuse
* Create a circular commerce ecosystem

Key Metrics:

* Products reused locally
* Distance avoided
* CO₂ emissions saved
* Warehouse operations eliminated
* Logistics cost savings


# 🎯 Vision

**ReLoop's mission is to ensure that every returned product gets the most efficient next destination before entering the traditional reverse logistics chain.**

By treating returned products as local inventory first and warehouse inventory second, ReLoop creates a smarter, greener, and more cost-effective commerce ecosystem.
