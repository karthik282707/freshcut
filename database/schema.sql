-- Database schema for FreshCut Connect

-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS market_prices CASCADE;
DROP TABLE IF EXISTS shop_inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'butcher', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Shops table (owned by a butcher)
CREATE TABLE shops (
  id SERIAL PRIMARY KEY,
  owner_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  license_number VARCHAR(100),
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products table (global catalog)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g. Chicken, Mutton, Fish, Prawns
  unit VARCHAR(20) DEFAULT 'kg'
);

-- 4. Shop Inventory table (mapping products to shops with prices/qty)
CREATE TABLE shop_inventory (
  id SERIAL PRIMARY KEY,
  shop_id INT REFERENCES shops(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  available_quantity_kg DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  selling_price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, product_id)
);

-- 5. Market Prices table (admin-set reference prices by product and city)
CREATE TABLE market_prices (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,
  reference_price_per_kg DECIMAL(10,2) NOT NULL,
  price_date DATE DEFAULT CURRENT_DATE,
  created_by_admin_id INT REFERENCES users(id),
  UNIQUE(product_id, city)
);

-- 6. Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES users(id) ON DELETE SET NULL,
  shop_id INT REFERENCES shops(id) ON DELETE SET NULL,
  delivery_address TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'COD', -- 'COD' or 'UPI'
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  order_status VARCHAR(30) DEFAULT 'New' CHECK (order_status IN ('New', 'Accepted', 'Cutting Meat', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  quantity_kg DECIMAL(8,2) NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  cutting_style VARCHAR(100) NOT NULL,
  special_instruction TEXT
);

-- 8. Reviews table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES users(id) ON DELETE SET NULL,
  shop_id INT REFERENCES shops(id) ON DELETE CASCADE,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, order_id)
);

-- Indexes for performance
CREATE INDEX idx_shops_city ON shops(city);
CREATE INDEX idx_shops_verification_status ON shops(verification_status);
CREATE INDEX idx_shop_inventory_shop ON shop_inventory(shop_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_shop ON orders(shop_id);
CREATE INDEX idx_reviews_shop ON reviews(shop_id);
