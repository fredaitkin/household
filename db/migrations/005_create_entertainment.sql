-- Creates the entertainment table.
-- Run against the Household database, e.g.:
--   mysql -u root -p Household < 005_create_entertainment.sql

CREATE TABLE IF NOT EXISTS entertainment (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `Type` VARCHAR(100) NOT NULL,
  `Cost` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
