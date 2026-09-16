-- Creates the h-admin MySQL user and grants access to the Household database.
-- Replace 'CHANGE_ME_STRONG_PASSWORD' with a real password before running.
-- Run against your MySQL server as a privileged user, e.g.:
--   mysql -u root -p < 002_create_admin_user.sql

CREATE USER IF NOT EXISTS 'h-admin'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

GRANT ALL PRIVILEGES ON `Household`.* TO 'h-admin'@'localhost';

FLUSH PRIVILEGES;
