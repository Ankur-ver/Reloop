CREATE TABLE `credit_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`reference_id` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `p2p_listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`seller_id` text NOT NULL,
	`seller_name` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`price` real NOT NULL,
	`original_price` real NOT NULL,
	`image_url` text NOT NULL,
	`category` text NOT NULL,
	`quality_grade` text NOT NULL,
	`condition` text NOT NULL,
	`location` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `platform_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`products_rerouted` integer DEFAULT 0 NOT NULL,
	`co2_saved_kg` real DEFAULT 0 NOT NULL,
	`credits_issued` integer DEFAULT 0 NOT NULL,
	`donations_count` integer DEFAULT 0 NOT NULL,
	`recycle_count` integer DEFAULT 0 NOT NULL,
	`resell_count` integer DEFAULT 0 NOT NULL,
	`refurbish_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`original_price` real NOT NULL,
	`reloop_price` real NOT NULL,
	`image_url` text NOT NULL,
	`category` text NOT NULL,
	`brand` text NOT NULL,
	`disposition` text NOT NULL,
	`quality_grade` text NOT NULL,
	`quality_score` integer NOT NULL,
	`listing_type` text NOT NULL,
	`seller_id` text,
	`seller_name` text,
	`is_certified` integer DEFAULT false NOT NULL,
	`green_credits_earned` integer DEFAULT 0 NOT NULL,
	`co2_saved_kg` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `return_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`product_name` text NOT NULL,
	`category` text NOT NULL,
	`brand` text NOT NULL,
	`purchase_date` text NOT NULL,
	`return_reason` text NOT NULL,
	`image_url` text,
	`disposition` text,
	`quality_grade` text,
	`quality_score` integer,
	`confidence_score` integer,
	`green_credits_awarded` integer DEFAULT 0 NOT NULL,
	`ai_reasoning` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`green_credits` integer DEFAULT 0 NOT NULL,
	`total_returns` integer DEFAULT 0 NOT NULL,
	`total_donations` integer DEFAULT 0 NOT NULL,
	`co2_saved` real DEFAULT 0 NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);