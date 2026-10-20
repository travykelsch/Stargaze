CREATE TABLE `player_limits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`started` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `player_imports` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `player_match_results` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`world` text NOT NULL,
	`difficulty` text NOT NULL,
	`mode` text NOT NULL,
	`won` integer NOT NULL,
	`drawn` integer NOT NULL,
	`ranked` integer NOT NULL,
	`score` integer NOT NULL,
	`rings` integer NOT NULL,
	`distance` integer NOT NULL,
	`duration` real NOT NULL,
	`credits` integer NOT NULL,
	`crashes` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `player_match_owner` ON `player_match_results` (`user_id`);--> statement-breakpoint
CREATE INDEX `player_match_board` ON `player_match_results` (`ranked`,`world`,`difficulty`,`mode`);--> statement-breakpoint
CREATE TABLE `player_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`listed` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_public_id` ON `player_profiles` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `player_name_key` ON `player_profiles` (`name_key`);--> statement-breakpoint
CREATE TABLE `player_solo_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`world` text NOT NULL,
	`difficulty` text NOT NULL,
	`ship` text NOT NULL,
	`duration` real NOT NULL,
	`distance` integer NOT NULL,
	`rings` integer NOT NULL,
	`credits` integer NOT NULL,
	`combo` integer NOT NULL,
	`near_misses` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `player_solo_owner` ON `player_solo_runs` (`user_id`);