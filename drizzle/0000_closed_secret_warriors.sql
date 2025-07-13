CREATE TABLE `api_keys` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`key_hash` text NOT NULL,
	`name` varchar(255) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_used_at` timestamp,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_key_hash_unique` UNIQUE(`key_hash`)
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`endpoint` varchar(255) NOT NULL,
	`method` varchar(10) NOT NULL DEFAULT 'GET',
	`status_code` int NOT NULL,
	`response_time` decimal(10,2) NOT NULL,
	`user_agent` text NOT NULL DEFAULT (''),
	`ip_address` varchar(45) NOT NULL DEFAULT '',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postal_data` (
	`id` varchar(128) NOT NULL,
	`postal_code` varchar(20) NOT NULL,
	`prefecture` json NOT NULL,
	`city` json NOT NULL,
	`town` json NOT NULL,
	`kana` json,
	`country_code` varchar(2) NOT NULL DEFAULT 'JP',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `postal_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` varchar(128) NOT NULL,
	`user_id` varchar(128) NOT NULL,
	`request_count` int NOT NULL DEFAULT 0,
	`window_start` timestamp NOT NULL,
	`window_type` varchar(10) NOT NULL,
	CONSTRAINT `rate_limits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(128) NOT NULL,
	`plan` varchar(20) NOT NULL,
	`max_requests_per_minute` int NOT NULL,
	`max_requests_per_day` int NOT NULL,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(128) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` text NOT NULL,
	`subscription_plan` varchar(20) NOT NULL DEFAULT 'free',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `logs` ADD CONSTRAINT `logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rate_limits` ADD CONSTRAINT `rate_limits_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;