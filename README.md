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
- Per-tab **+ Add …** links under each table for adding rows.
- Per-row delete actions for groceries, restaurants, and entertainment.
- Client-side pagination with 10 rows per page by default. The page size can be changed to 25 or 50 rows.
- A **⚙ Settings** panel for managing grocery types.

## Using the app

### Settings (grocery types)

Click **⚙ Settings** in the top-right corner of the page to toggle the Settings panel. Settings is where you manage the grocery categories used by the Groceries tab:

- **Add a grocery type**: enter a name in the *Grocery type* field (e.g. "Produce") and click **Add type**. The type is saved via `POST /api/grocery-types` and appears in the list below.
- **Delete a grocery type**: click the **×** on any type chip in the *Grocery types* list. This calls `DELETE /api/grocery-types/:id`. Note: the database enforces a foreign-key constraint (`ON DELETE RESTRICT`), so a type that is used by any grocery row cannot be deleted.

### Adding groceries, restaurants, and entertainment

Each tab has its own **+ Add …** link directly underneath the table, so you add rows where you see them:

1. Switch to the tab you want (**Groceries**, **Restaurants**, or **Entertainment**).
2. Click the **+ Add grocery** / **+ Add restaurant** / **+ Add entertainment** link below the table. Clicking the link again collapses the form.
3. Fill in the fields and click **Add**:
   - **Grocery** — Date, Type (dropdown of the grocery types created in Settings), and Cost. Submits to `POST /api/groceries`.
   - **Restaurant** — Date and Cost. Submits to `POST /api/restaurants`.
   - **Entertainment** — Date, Type (free text, e.g. "Movie"), and Cost. Submits to `POST /api/entertainment`.
4. On success the form clears, the table refreshes, and the new row appears. If a request fails, an error banner is shown at the top of the page.

> Tip: grocery types must exist before you can add a grocery, so create them first via **⚙ Settings**.

### Pagination and deleting rows

Tables display 10 rows at a time by default. Use the **Rows per page** selector to display 10, 25, or 50 rows, and use **Previous** and **Next** to move between pages. Pagination is applied in the browser after the current tab's data has been loaded from the API.

Each table row has a **×** action at the right. Clicking it deletes that grocery, restaurant, or entertainment entry and refreshes the current table. Grocery types continue to be deleted from the **⚙ Settings** panel.

## Getting started

Install dependencies:

```bash
npm install
```

Configure the database connection (copy the example, then edit `server/.env` with your MySQL credentials):

```bash
cp server/.env.example server/.env
```

Start the API server (in one terminal):

```bash
npm run server
```

Start the dev server (in another terminal):

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

Standalone MySQL scripts live in [db/migrations](db/migrations). The front end talks to the database through the Express API in [server/index.js](server/index.js) — these scripts create the schema that the API reads from and writes to.

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

[db/migrations/001_create_admin_user.sql](db/migrations/001_create_admin_user.sql) creates a dedicated MySQL user and grants it access to the `Household` database. **Edit the file first and replace `CHANGE_ME_STRONG_PASSWORD` with a real password.**

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

[db/migrations/002_create_grocery_types.sql](db/migrations/002_create_grocery_types.sql) creates a lookup table of grocery categories:

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
mysql -u <user> -p Household < db/migrations/002_create_grocery_types.sql
```

### 4. Create the `groceries` table

[db/migrations/003_create_groceries.sql](db/migrations/003_create_groceries.sql) creates the groceries spending table, linked to `grocery_types` by foreign key:

```sql
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
```

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | INT UNSIGNED | Primary key, auto-increment |
| `date` | DATE | Purchase date |
| `Type` | INT UNSIGNED | Foreign key → `grocery_types.id` |
| `Cost` | DECIMAL(10,2) | Purchase cost |

Run it against the `Household` database (after `grocery_types` exists):

```bash
mysql -u <user> -p Household < db/migrations/003_create_groceries.sql
```

### 5. Create the `restaurants` table

[db/migrations/004_create_restaurants.sql](db/migrations/004_create_restaurants.sql) creates the restaurants spending table:

```sql
CREATE TABLE IF NOT EXISTS restaurants (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `Cost` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | INT UNSIGNED | Primary key, auto-increment |
| `date` | DATE | Visit date |
| `Cost` | DECIMAL(10,2) | Meal cost |

```bash
mysql -u <user> -p Household < db/migrations/004_create_restaurants.sql
```

### 6. Create the `entertainment` table

[db/migrations/005_create_entertainment.sql](db/migrations/005_create_entertainment.sql) creates the entertainment spending table:

```sql
CREATE TABLE IF NOT EXISTS entertainment (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `Type` VARCHAR(100) NOT NULL,
  `Cost` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | INT UNSIGNED | Primary key, auto-increment |
| `date` | DATE | Activity date |
| `Type` | VARCHAR(100) | Activity type (e.g. Movie) |
| `Cost` | DECIMAL(10,2) | Activity cost |

```bash
mysql -u <user> -p Household < db/migrations/005_create_entertainment.sql
```

### Run everything

Run the scripts in order:

```bash
mysql -u root -p < db/migrations/000_create_database.sql
mysql -u root -p < db/migrations/001_create_admin_user.sql
mysql -u root -p Household < db/migrations/002_create_grocery_types.sql
mysql -u root -p Household < db/migrations/003_create_groceries.sql
mysql -u root -p Household < db/migrations/004_create_restaurants.sql
mysql -u root -p Household < db/migrations/005_create_entertainment.sql
```

## How it works

Tab labels and column configuration live in the `TABS` array at the top of [src/App.jsx](src/App.jsx). The component loads grocery types and table data from the Express API, converts the active tab's data into display rows, and applies client-side pagination before rendering the table:

```jsx
{
  id: 'groceries',
  label: 'Groceries',
  columns: ['Date', 'Type', 'Cost'],
}
```

The active tab, current page, and rows-per-page setting are tracked with React state (`useState`). Clicking a tab resets pagination to the first page. Adding or deleting data calls the corresponding API endpoint and reloads the affected table.

## Customizing

- **Edit columns**: modify the `columns` arrays in `TABS`.
- **Add a tab**: add a new object to `TABS` with a unique `id`.
- **Pagination options**: update the page-size `<option>` values in `src/App.jsx` to offer different choices.
- **Styling**: tweak colors via the CSS custom properties (`--accent`, `--border`, etc.) in [src/App.css](src/App.css).

