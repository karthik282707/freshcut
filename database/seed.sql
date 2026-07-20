-- Sample data for FreshCut Connect
-- Pre-hashed password 'password123' using bcrypt (rounds: 10)
-- Hash: $2a$10$nVj/EElwXK0WUJeFGk1wReoKrjl3OKsNclnWR8oh55jM0gqfFRof6

INSERT INTO users (name, phone, email, password_hash, role) VALUES
('Arjun Kumar', '9876543210', 'customer@freshcut.com', '$2a$10$nVj/EElwXK0WUJeFGk1wReoKrjl3OKsNclnWR8oh55jM0gqfFRof6', 'customer'),
('Rajan Meats', '9123456789', 'butcher@freshcut.com', '$2a$10$nVj/EElwXK0WUJeFGk1wReoKrjl3OKsNclnWR8oh55jM0gqfFRof6', 'butcher'),
('Admin FreshCut', '9000000001', 'admin@freshcut.com', '$2a$10$nVj/EElwXK0WUJeFGk1wReoKrjl3OKsNclnWR8oh55jM0gqfFRof6', 'admin'),
('Pending Butcher', '9888888888', 'pending_butcher@freshcut.com', '$2a$10$nVj/EElwXK0WUJeFGk1wReoKrjl3OKsNclnWR8oh55jM0gqfFRof6', 'butcher');

-- Insert shops
INSERT INTO shops (owner_user_id, name, address, city, latitude, longitude, license_number, verification_status, rating) VALUES
(2, 'Rajan Fresh Cuts', '12 Market Street, T. Nagar', 'Chennai', 13.0350, 80.2329, 'LIC-verified-123', 'verified', 4.5),
(4, 'Royal Halal Meats', '45 Anna Salai', 'Chennai', 13.0400, 80.2400, 'LIC-pending-456', 'pending', 0.0);

-- Insert products
INSERT INTO products (name, category, unit) VALUES
('Broiler Chicken', 'Chicken', 'kg'),
('Country Chicken', 'Chicken', 'kg'),
('Goat Mutton', 'Mutton', 'kg'),
('Rohu Fish', 'Fish', 'kg'),
('Tiger Prawns', 'Prawns', 'kg');

-- Insert shop inventory
-- Rajan Fresh Cuts (shop_id = 1) sells these items:
INSERT INTO shop_inventory (shop_id, product_id, available_quantity_kg, selling_price_per_kg) VALUES
(1, 1, 80.00, 180.00), -- Broiler Chicken
(1, 2, 50.00, 320.00), -- Country Chicken
(1, 3, 25.00, 750.00), -- Goat Mutton
(1, 4, 40.00, 280.00), -- Rohu Fish
(1, 5, 30.00, 550.00); -- Tiger Prawns

-- Insert admin market reference prices for Chennai (admin_id = 3)
INSERT INTO market_prices (product_id, city, reference_price_per_kg, created_by_admin_id) VALUES
(1, 'Chennai', 190.00, 3), -- Broiler Chicken (market is ₹190, Rajan sells for ₹180)
(2, 'Chennai', 340.00, 3), -- Country Chicken (market is ₹340, Rajan sells for ₹320)
(3, 'Chennai', 720.00, 3), -- Goat Mutton (market is ₹720, Rajan sells for ₹750)
(4, 'Chennai', 260.00, 3), -- Rohu Fish (market is ₹260, Rajan sells for ₹280)
(5, 'Chennai', 520.00, 3); -- Tiger Prawns (market is ₹520, Rajan sells for ₹550)

-- Insert sample orders
-- Order 1: Delivered, review added
INSERT INTO orders (customer_id, shop_id, delivery_address, total_amount, payment_method, payment_status, order_status) VALUES
(1, 1, 'Block C, T. Nagar, Chennai', 1820.00, 'UPI', 'paid', 'Delivered');

INSERT INTO order_items (order_id, product_id, quantity_kg, price_per_kg, cutting_style, special_instruction) VALUES
(1, 1, 2.00, 180.00, 'Curry Cut', 'Please clean thoroughly'),
(1, 3, 2.00, 750.00, 'Biryani Cut', NULL);

-- Review for Order 1
INSERT INTO reviews (customer_id, shop_id, order_id, rating, comment) VALUES
(1, 1, 1, 5, 'Absolutely fresh and perfectly cut! Will order again.');

-- Order 2: New order
INSERT INTO orders (customer_id, shop_id, delivery_address, total_amount, payment_method, payment_status, order_status) VALUES
(1, 1, 'Flat 4A, Green Meadows, Chennai', 540.00, 'COD', 'pending', 'New');

INSERT INTO order_items (order_id, product_id, quantity_kg, price_per_kg, cutting_style, special_instruction) VALUES
(2, 1, 3.00, 180.00, 'Boneless', 'No skin, cut small');
