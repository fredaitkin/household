-- Creates the groceries table, linked to grocery_types.
-- Run against the Household database, e.g.:
--   mysql -u root -p Household < 003_create_groceries.sql

CREATE TABLE IF NOT EXISTS groceries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `Type` INT UNSIGNED NOT NULL,
  `Cost` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_groceries_type (`Type`),
  CONSTRAINT fk_groceries_type
    FOREIGN KEY (`Type`)
    REFERENCES grocery_types (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
