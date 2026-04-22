CREATE TABLE `squadMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`squadId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('head','member') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `squadMembers_id` PRIMARY KEY(`id`)
);
