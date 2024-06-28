CREATE TABLE service (
    `id` TEXT PRIMARY KEY,
    `category_id` TEXT NOT NULL,
    `name` TEXT,
    `description` TEXT,
    `disabled` INTEGER,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE restrict ON DELETE restrict
);