CREATE TABLE `local_holdings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`return_submission_id` integer,
	`hub_id` integer NOT NULL,
	`product_name` text NOT NULL,
	`category` text NOT NULL,
	`brand` text NOT NULL,
	`quality_grade` text NOT NULL,
	`quality_score` integer NOT NULL,
	`image_url` text NOT NULL,
	`original_price` real NOT NULL,
	`holding_price` real NOT NULL,
	`status` text DEFAULT 'holding' NOT NULL,
	`held_since` integer,
	`expires_at` integer NOT NULL,
	`demand_score` integer DEFAULT 0 NOT NULL,
	`local_search_trend` integer DEFAULT 0 NOT NULL,
	`cart_additions` integer DEFAULT 0 NOT NULL,
	`wishlist_count` integer DEFAULT 0 NOT NULL,
	`historical_sales_score` integer DEFAULT 0 NOT NULL,
	`resale_probability` integer DEFAULT 0 NOT NULL,
	`forecast_reasoning` text,
	`matched_order_id` text,
	`matched_at` integer,
	`shipped_at` integer,
	`co2_saved` real DEFAULT 0 NOT NULL,
	`distance_saved_km` integer DEFAULT 0 NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `local_hubs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`address` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`capacity` integer DEFAULT 100 NOT NULL,
	`current_load` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`order_ref` text NOT NULL,
	`product_name` text NOT NULL,
	`brand` text NOT NULL,
	`category` text NOT NULL,
	`image_url` text NOT NULL,
	`price` real NOT NULL,
	`purchased_at` integer NOT NULL,
	`return_window_days` integer DEFAULT 30 NOT NULL,
	`status` text DEFAULT 'delivered' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `p2p_donations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`donor_id` text NOT NULL,
	`donor_name` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`condition` text NOT NULL,
	`image_url` text NOT NULL,
	`image_urls` text DEFAULT '[]' NOT NULL,
	`location` text DEFAULT 'India' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`donate_reason` text NOT NULL,
	`recipient_type` text NOT NULL,
	`ai_score` integer DEFAULT 'null',
	`quality_grade` text DEFAULT 'good' NOT NULL,
	`ai_verdict` text DEFAULT 'null',
	`ai_reasoning` text DEFAULT 'null',
	`ai_positives` text DEFAULT '[]' NOT NULL,
	`ai_concerns` text DEFAULT '[]' NOT NULL,
	`is_recyclable` integer DEFAULT false NOT NULL,
	`recycle_data` text DEFAULT 'null',
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
ALTER TABLE `p2p_listings` ADD `ai_score` integer DEFAULT 'null';--> statement-breakpoint
ALTER TABLE `p2p_listings` ADD `seller_rating` real DEFAULT 'null';--> statement-breakpoint
ALTER TABLE `p2p_listings` ADD `image_urls` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `p2p_listings` ADD `ai_verdict` text DEFAULT 'null';--> statement-breakpoint
ALTER TABLE `p2p_listings` ADD `ai_reasoning` text DEFAULT 'null';--> statement-breakpoint
ALTER TABLE `p2p_listings` ADD `ai_positives` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `p2p_listings` ADD `ai_concerns` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `p2p_listings` ADD `is_recyclable` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `p2p_listings` ADD `recycle_data` text DEFAULT 'null';--> statement-breakpoint
ALTER TABLE `return_submissions` ADD `order_id` integer;--> statement-breakpoint
ALTER TABLE `return_submissions` ADD `return_status` text DEFAULT 'initiated' NOT NULL;--> statement-breakpoint
ALTER TABLE `return_submissions` ADD `picked_up_at` integer;--> statement-breakpoint
ALTER TABLE `return_submissions` ADD `in_transit_at` integer;--> statement-breakpoint
ALTER TABLE `return_submissions` ADD `processed_at` integer;--> statement-breakpoint
ALTER TABLE `return_submissions` ADD `listed_product_id` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL;