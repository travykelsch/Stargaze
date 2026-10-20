CREATE TABLE `multiplayer_inputs` (
	`key` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`pilot` text NOT NULL,
	`seen` integer NOT NULL,
	`input_at` integer NOT NULL,
	`seq` integer NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `multiplayer_rooms` ADD `lease` text;--> statement-breakpoint
ALTER TABLE `multiplayer_rooms` ADD `lease_until` integer DEFAULT 0 NOT NULL;