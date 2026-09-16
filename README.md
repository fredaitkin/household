# Household Dashboard

A one-page React app that displays a tabbed table for tracking household spending. Built with Vite + React.

## Features

- Three tabs, each rendering its own table:
  - **Groceries** — columns: Date, Type, Cost
  - **Restaurants** — columns: Date, Cost
  - **Entertainment** — columns: Date, Type, Cost
- Active tab highlighting and hoverable rows.
- Empty-state message ("No data yet") when a tab has no rows.
- Responsive table container (horizontal scroll on small screens).

## Getting started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project structure

- [src/App.jsx](src/App.jsx) — the tabbed table component and all tab data.
- [src/App.css](src/App.css) — page, tab, and table styling.
- [src/main.jsx](src/main.jsx) — React entry point.
- [src/index.css](src/index.css) — minimal global styles.
- [db/migrations](db/migrations) — standalone MySQL setup scripts.

## Database

Standalone MySQL scripts live in [db/migrations](db/migrations). The app is a static front end and does not connect to the database — these scripts are for your own data store.

### 1. Create the database

[db/migrations/000_create_database.sql](db/migrations/000_create_database.sql) creates the `Household` database:

```sql
CREATE DATABASE IF NOT EXISTS Household
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Run it:

```bash
mysql -u <user> -p < db/migrations/000_create_database.sql
```

### 2. Create the `h-admin` user

[db/migrations/002_create_admin_user.sql](db/migrations/001_create_admin_user.sql) creates a dedicated MySQL user and grants it access to the `Household` database. **Edit the file first and replace `CHANGE_ME_STRONG_PASSWORD` with a real password.**

```sql
CREATE USER IF NOT EXISTS 'h-admin'@'localhost'
  IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

GRANT ALL PRIVILEGES ON `Household`.* TO 'h-admin'@'localhost';

FLUSH PRIVILEGES;
```

Run it as a privileged user (e.g., `root`):

```bash
mysql -u root -p < db/migrations/001_create_admin_user.sql
```

### 3. Create the `grocery_types` table

[db/migrations/002_create_grocery_types.sql](db/migrations/001_create_grocery_types.sql) creates a lookup table of grocery categories:

```sql
CREATE TABLE IF NOT EXISTS grocery_types (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | INT UNSIGNED | Primary key, auto-increment |
| `type` | VARCHAR(100) | Grocery category name |

Run it against the `Household` database:

```bash
mysql -u <user> -p Household < db/migrations/003_create_grocery_types.sql
```

### Run everything

Run the scripts in order:

```bash
mysql -u root -p < db/migrations/000_create_database.sql
mysql -u root -p < db/migrations/001_create_admin_user.sql
mysql -u root -p Household < db/migrations/002_create_grocery_types.sql
```

## How it works

All tab configuration lives in the `TABS` array at the top of [src/App.jsx](src/App.jsx). Each tab is defined by an `id`, a `label`, its `columns` (header row), and its `rows` (table body data):

```jsx
{
  id: 'groceries',
  label: 'Groceries',
  columns: ['Date', 'Type', 'Cost'],
  rows: [],
}
```

The active tab is tracked with React state (`useState`). Clicking a tab updates the state, and the table re-renders with that tab's `columns` and `rows`.

## Customizing

- **Edit columns/rows**: modify the `columns` and `rows` arrays in `TABS`.
- **Add a tab**: add a new object to `TABS` with a unique `id`.
- **Row shape**: each row is an array of strings matching the order and length of `columns`.
- **Styling**: tweak colors via the CSS custom properties (`--accent`, `--border`, etc.) in [src/App.css](src/App.css).

