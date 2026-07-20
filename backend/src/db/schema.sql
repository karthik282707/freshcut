-- FreshCut Connect Database Schema
-- Run: psql -U postgres -c "CREATE DATABASE freshcut;" then psql -U postgres -d freshcut -f schema.sql

-- Users table (all roles)
CREATE TYPE user_role AS ENUM ('customer', 'butcher', 'admin', 'delivery');

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'customer',
  phone       VARCHAR(20),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Shops (owned by butchers)
CREATE TYPE shop_status AS ENUM ('pending', 'verified', 'suspended');

CREATE TABLE IF NOT EXISTS shops (
  id           SERIAL PRIMARY KEY,
  owner_id     INT REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(200) NOT NULL,
  description  TEXT,
  address      TEXT NOT NULL,
  city         VARCHAR(100) NOT NULL,
  latitude     DECIMAL(9,6),
  longitude    DECIMAL(9,6),
  license_url  TEXT,
  status       shop_status DEFAULT 'pending',
  rating_avg   DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  opens_at     TIME DEFAULT '06:00',
  closes_at    TIME DEFAULT '20:00',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Meat categories for type reference
CREATE TABLE IF NOT EXISTS meat_categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL   -- e.g. Chicken, Mutton, Fish, Pork, Beef
);

-- Products (defined per shop)
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  shop_id        INT REFERENCES shops(id) ON DELETE CASCADE,
  category_id    INT REFERENCES meat_categories(id),
  name           VARCHAR(200) NOT NULL,
  cutting_styles JSONB DEFAULT '["Whole","Curry Cut","Boneless","Minced"]',
  unit           VARCHAR(20) DEFAULT 'kg',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory (daily stock & price per product)
CREATE TABLE IF NOT EXISTS inventory (
  id            SERIAL PRIMARY KEY,
  product_id    INT REFERENCES products(id) ON DELETE CASCADE,
  shop_id       INT REFERENCES shops(id) ON DELETE CASCADE,
  stock_qty     DECIMAL(8,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, shop_id)
);

-- Market reference prices (set by admin)
CREATE TABLE IF NOT EXISTS market_prices (
  id             SERIAL PRIMARY KEY,
  category_id    INT REFERENCES meat_categories(id) UNIQUE,
  reference_price DECIMAL(10,2) NOT NULL,
  updated_by     INT REFERENCES users(id),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TYPE order_status AS ENUM (
  'placed','accepted','rejected','preparing','ready','picked_up','in_transit','delivered','cancelled'
);

CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  customer_id        INT REFERENCES users(id),
  shop_id            INT REFERENCES shops(id),
  delivery_partner_id INT REFERENCES users(id),
  status             order_status DEFAULT 'placed',
  delivery_address   TEXT NOT NULL,
  delivery_city      VARCHAR(100),
  subtotal           DECIMAL(10,2) NOT NULL,
  delivery_fee       DECIMAL(10,2) DEFAULT 30,
  total              DECIMAL(10,2) NOT NULL,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INT REFERENCES products(id),
  quantity      DECIMAL(8,2) NOT NULL,
  cutting_style VARCHAR(100),
  unit_price    DECIMAL(10,2) NOT NULL,
  line_total    DECIMAL(10,2) NOT NULL
);

-- Ratings & Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  customer_id INT REFERENCES users(id),
  shop_id     INT REFERENCES shops(id) ON DELETE CASCADE,
  order_id    INT REFERENCES orders(id),
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, order_id)
);

-- Complaints
CREATE TYPE complaint_status AS ENUM ('open','in_review','resolved');

CREATE TABLE IF NOT EXISTS complaints (
  id          SERIAL PRIMARY KEY,
  reporter_id INT REFERENCES users(id),
  shop_id     INT REFERENCES shops(id),
  order_id    INT REFERENCES orders(id),
  description TEXT NOT NULL,
  status      complaint_status DEFAULT 'open',
  admin_notes TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Payments
CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE payment_method AS ENUM ('cod','card','upi','mock');

CREATE TABLE IF NOT EXISTS payments (
  id         SERIAL PRIMARY KEY,
  order_id   INT REFERENCES orders(id) UNIQUE,
  amount     DECIMAL(10,2) NOT NULL,
  method     payment_method DEFAULT 'mock',
  status     payment_status DEFAULT 'pending',
  gateway_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for perf
CREATE INDEX IF NOT EXISTS idx_shops_city ON shops(city);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_inventory_shop ON inventory(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery ON orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_shop ON reviews(shop_id);
