CREATE TABLE category (
    `id` TEXT PRIMARY KEY,
    `name` TEXT NOT NULL,
    `description` TEXT NULL,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL
);