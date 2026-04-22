CREATE TABLE `crmLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`company` varchar(255),
	`source` varchar(128),
	`stage` enum('lead_frio','follow_up','reuniao_marcada') NOT NULL DEFAULT 'lead_frio',
	`value` decimal(12,2),
	`notes` text,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmLeads_id` PRIMARY KEY(`id`)
);
