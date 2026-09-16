-- Creates the grocery_types lookup table.
-- Run against your MySQL database, e.g.:
--   mysql -u <user> -p <database> < 001_create_grocery_types.sql

CREATE TABLE IF NOT EXISTS grocery_types (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
