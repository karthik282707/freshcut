import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_DB_FILE = path.resolve(__dirname, 'mock_db.json');

const { Pool } = pg;

// Helper to load/save JSON mock database
function loadMockDb() {
  if (!fs.existsSync(MOCK_DB_FILE)) {
    // Initial Seed Data
    const seedData = {
      users: [
        { id: 1, name: 'Arjun Kumar', phone: '9876543210', email: 'customer@freshcut.com', password_hash: '$2a$10$nVj/EElwXK0WUJeFGk1wReoKrjl3OKsNclnWR8oh55jM0gqfFRof6', role: 'customer', created_at: new Date().toISOString() },
        { id: 2, name: 'Rajan Meats', phone: '9123456789', email: 'butcher@freshcut.com', password_hash: '$2a$10$nVj/EElwXK0WUJeFGk1wReoKrjl3OKsNclnWR8oh55jM0gqfFRof6', role: 'butcher', created_at: new Date().toISOString() },
        { id: 3, name: 'Admin FreshCut', phone: '9000000001', email: 'admin@freshcut.com', password_hash: '$2a$10$nVj/EElwXK0WUJeFGk1wReoKrjl3OKsNclnWR8oh55jM0gqfFRof6', role: 'admin', created_at: new Date().toISOString() },
        { id: 4, name: 'Pending Butcher', phone: '9888888888', email: 'pending_butcher@freshcut.com', password_hash: '$2a$10$nVj/EElwXK0WUJeFGk1wReoKrjl3OKsNclnWR8oh55jM0gqfFRof6', role: 'butcher', created_at: new Date().toISOString() }
      ],
      shops: [
        { id: 1, owner_user_id: 2, name: 'Rajan Fresh Cuts', address: '12 Market Street, T. Nagar', city: 'Chennai', latitude: 13.0350, longitude: 80.2329, license_number: 'LIC-verified-123', verification_status: 'verified', rating: 4.5, created_at: new Date().toISOString() },
        { id: 2, owner_user_id: 4, name: 'Royal Halal Meats', address: '45 Anna Salai', city: 'Chennai', latitude: 13.0400, longitude: 80.2400, license_number: 'LIC-pending-456', verification_status: 'pending', rating: 0.0, created_at: new Date().toISOString() }
      ],
      products: [
        { id: 1, name: 'Broiler Chicken', category: 'Chicken', unit: 'kg' },
        { id: 2, name: 'Country Chicken', category: 'Chicken', unit: 'kg' },
        { id: 3, name: 'Goat Mutton', category: 'Mutton', unit: 'kg' },
        { id: 4, name: 'Rohu Fish', category: 'Fish', unit: 'kg' },
        { id: 5, name: 'Tiger Prawns', category: 'Prawns', unit: 'kg' }
      ],
      shop_inventory: [
        { id: 1, shop_id: 1, product_id: 1, available_quantity_kg: 80.00, selling_price_per_kg: 180.00 },
        { id: 2, shop_id: 1, product_id: 2, available_quantity_kg: 50.00, selling_price_per_kg: 320.00 },
        { id: 3, shop_id: 1, product_id: 3, available_quantity_kg: 25.00, selling_price_per_kg: 750.00 },
        { id: 4, shop_id: 1, product_id: 4, available_quantity_kg: 40.00, selling_price_per_kg: 280.00 },
        { id: 5, shop_id: 1, product_id: 5, available_quantity_kg: 30.00, selling_price_per_kg: 550.00 }
      ],
      market_prices: [
        { id: 1, product_id: 1, city: 'Chennai', reference_price_per_kg: 190.00, created_by_admin_id: 3 },
        { id: 2, product_id: 2, city: 'Chennai', reference_price_per_kg: 340.00, created_by_admin_id: 3 },
        { id: 3, product_id: 3, city: 'Chennai', reference_price_per_kg: 720.00, created_by_admin_id: 3 },
        { id: 4, product_id: 4, city: 'Chennai', reference_price_per_kg: 260.00, created_by_admin_id: 3 },
        { id: 5, product_id: 5, city: 'Chennai', reference_price_per_kg: 520.00, created_by_admin_id: 3 }
      ],
      orders: [
        { id: 1, customer_id: 1, shop_id: 1, delivery_address: 'Block C, T. Nagar, Chennai', total_amount: 1820.00, payment_method: 'UPI', payment_status: 'paid', order_status: 'Delivered', created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date().toISOString() },
        { id: 2, customer_id: 1, shop_id: 1, delivery_address: 'Flat 4A, Green Meadows, Chennai', total_amount: 540.00, payment_method: 'COD', payment_status: 'pending', order_status: 'New', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ],
      order_items: [
        { id: 1, order_id: 1, product_id: 1, quantity_kg: 2.00, price_per_kg: 180.00, cutting_style: 'Curry Cut', special_instruction: 'Please clean thoroughly' },
        { id: 2, order_id: 1, product_id: 3, quantity_kg: 2.00, price_per_kg: 750.00, cutting_style: 'Biryani Cut', special_instruction: null },
        { id: 3, order_id: 2, product_id: 1, quantity_kg: 3.00, price_per_kg: 180.00, cutting_style: 'Boneless', special_instruction: 'No skin, cut small' }
      ],
      reviews: [
        { id: 1, customer_id: 1, shop_id: 1, order_id: 1, rating: 5, comment: 'Absolutely fresh and perfectly cut! Will order again.', created_at: new Date().toISOString() }
      ]
    };
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(seedData, null, 2), 'utf8');
  }
  return JSON.parse(fs.readFileSync(MOCK_DB_FILE, 'utf8'));
}

function saveMockDb(data) {
  fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Global flag to use mock database
let useMock = false;

const realPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Try connecting to verify real database is active
realPool.connect((err, client, release) => {
  if (err) {
    console.warn('\n⚠️  PostgreSQL connection failed. Switching to In-Memory JSON Mock Database for development/prototype demo.');
    console.warn(`   Reason: ${err.message}`);
    console.warn(`   Mock DB Path: ${MOCK_DB_FILE}\n`);
    useMock = true;
  } else {
    console.log('✅ Connected to PostgreSQL database successfully.');
    release();
  }
});

// Mock query engine simulating SQL queries on JS objects
function executeMockQuery(sql, params = []) {
  const db = loadMockDb();
  // Normalize whitespace and force spaces around operator '='
  const sqlNormalized = sql.replace(/\s+/g, ' ').replace(/=/g, ' = ').replace(/\s+/g, ' ').trim();


  // 1. SELECT FROM users WHERE email
  if (sqlNormalized.includes('SELECT') && sqlNormalized.includes('users') && sqlNormalized.includes('email = $1')) {
    const user = db.users.find(u => u.email.toLowerCase() === params[0].toLowerCase());
    return { rows: user ? [user] : [] };
  }

  // 2. SELECT FROM users WHERE id
  if (sqlNormalized.includes('SELECT') && sqlNormalized.includes('users') && sqlNormalized.includes('id = $1') && !sqlNormalized.includes('orders')) {
    const user = db.users.find(u => u.id === parseInt(params[0]));
    return { rows: user ? [user] : [] };
  }

  // 3. INSERT INTO users
  if (sqlNormalized.includes('INSERT INTO users')) {
    const newId = db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const [name, email, password_hash, role, phone] = params;
    const newUser = { id: newId, name, email, password_hash, role, phone: phone || null, created_at: new Date().toISOString() };
    db.users.push(newUser);
    saveMockDb(db);
    return { rows: [newUser] };
  }

  // 4. SELECT FROM shops (verified / by city)
  if (sqlNormalized.includes('SELECT') && sqlNormalized.includes('shops') && sqlNormalized.includes('verification_status = \'verified\'')) {
    let filtered = db.shops.filter(s => s.verification_status === 'verified');
    if (params.length && sqlNormalized.includes('LOWER(city)')) {
      filtered = filtered.filter(s => s.city.toLowerCase() === params[0].toLowerCase());
    }
    return { rows: filtered };
  }

  // 5. SELECT FROM shops WHERE id = $1
  if (sqlNormalized.includes('SELECT') && sqlNormalized.includes('shops') && sqlNormalized.includes('id = $1') && !sqlNormalized.includes('owner_user_id = $1') && !sqlNormalized.includes('orders')) {
    const shop = db.shops.find(s => s.id === parseInt(params[0]));
    return { rows: shop ? [shop] : [] };
  }

  // 6. SELECT FROM shops WHERE owner_user_id = $1
  if (sqlNormalized.includes('SELECT') && sqlNormalized.includes('shops') && sqlNormalized.includes('owner_user_id = $1')) {
    const shop = db.shops.find(s => s.owner_user_id === parseInt(params[0]));
    return { rows: shop ? [shop] : [] };
  }

  // 7. GET shop products (joining shop_inventory, products, and market_prices)
  if (sqlNormalized.includes('shop_inventory') && sqlNormalized.includes('products') && sqlNormalized.includes('si.shop_id = $1') && !sqlNormalized.includes('product_id = $2')) {
    const shopId = parseInt(params[0]);
    const city = params[1] || 'Chennai';
    
    const rows = db.shop_inventory
      .filter(si => si.shop_id === shopId)
      .map(si => {
        const prod = db.products.find(p => p.id === si.product_id) || {};
        const mp = db.market_prices.find(m => m.product_id === si.product_id && m.city.toLowerCase() === city.toLowerCase());
        return {
          product_id: si.product_id,
          name: prod.name,
          category: prod.category,
          unit: prod.unit,
          inventory_id: si.id,
          available_quantity_kg: si.available_quantity_kg,
          selling_price_per_kg: si.selling_price_per_kg,
          market_reference_price: mp ? mp.reference_price_per_kg : null
        };
      });
    return { rows };
  }

  // 8. INSERT/UPDATE shop_inventory
  if (sqlNormalized.includes('INSERT INTO shop_inventory')) {
    const [shop_id, product_id, available_quantity_kg, selling_price_per_kg] = params;
    let inv = db.shop_inventory.find(si => si.shop_id === parseInt(shop_id) && si.product_id === parseInt(product_id));
    if (inv) {
      inv.available_quantity_kg = parseFloat(available_quantity_kg);
      inv.selling_price_per_kg = parseFloat(selling_price_per_kg);
    } else {
      const newId = db.shop_inventory.length ? Math.max(...db.shop_inventory.map(si => si.id)) + 1 : 1;
      inv = { id: newId, shop_id: parseInt(shop_id), product_id: parseInt(product_id), available_quantity_kg: parseFloat(available_quantity_kg), selling_price_per_kg: parseFloat(selling_price_per_kg) };
      db.shop_inventory.push(inv);
    }
    saveMockDb(db);
    return { rows: [inv] };
  }

  // 9. UPDATE shop_inventory by id and shop_id
  if (sqlNormalized.includes('UPDATE shop_inventory') && sqlNormalized.includes('id = $3')) {
    const [qty, price, id, shopId] = params;
    const inv = db.shop_inventory.find(si => si.id === parseInt(id) && si.shop_id === parseInt(shopId));
    if (inv) {
      inv.available_quantity_kg = parseFloat(qty);
      inv.selling_price_per_kg = parseFloat(price);
      saveMockDb(db);
      return { rows: [inv] };
    }
    return { rows: [] };
  }

  // 10. INSERT INTO orders
  if (sqlNormalized.includes('INSERT INTO orders')) {
    const [customer_id, shop_id, delivery_address, total_amount, payment_method, payment_status] = params;
    const newId = db.orders.length ? Math.max(...db.orders.map(o => o.id)) + 1 : 1;
    const newOrder = {
      id: newId,
      customer_id: parseInt(customer_id),
      shop_id: parseInt(shop_id),
      delivery_address,
      total_amount: parseFloat(total_amount),
      payment_method,
      payment_status,
      order_status: 'New',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.orders.push(newOrder);
    saveMockDb(db);
    return { rows: [newOrder] };
  }

  // 11. INSERT INTO order_items
  if (sqlNormalized.includes('INSERT INTO order_items')) {
    const [order_id, product_id, quantity_kg, price_per_kg, cutting_style, special_instruction] = params;
    const newId = db.order_items.length ? Math.max(...db.order_items.map(oi => oi.id)) + 1 : 1;
    const newItem = {
      id: newId,
      order_id: parseInt(order_id),
      product_id: parseInt(product_id),
      quantity_kg: parseFloat(quantity_kg),
      price_per_kg: parseFloat(price_per_kg),
      cutting_style,
      special_instruction: special_instruction || null
    };
    db.order_items.push(newItem);
    saveMockDb(db);
    return { rows: [newItem] };
  }

  // 12. SELECT orders FROM orders WHERE customer_id = $1 (my-orders)
  if (sqlNormalized.includes('FROM orders o') && sqlNormalized.includes('o.customer_id = $1')) {
    const customerId = parseInt(params[0]);
    const rows = db.orders
      .filter(o => o.customer_id === customerId)
      .map(o => {
        const shop = db.shops.find(s => s.id === o.shop_id) || {};
        return {
          ...o,
          shop_name: shop.name,
          shop_address: shop.address
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows };
  }

  // 13. SELECT order details (GET /api/orders/:orderId)
  if (sqlNormalized.includes('FROM orders o') && sqlNormalized.includes('o.id = $1')) {
    const orderId = parseInt(params[0]);
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return { rows: [] };
    const shop = db.shops.find(s => s.id === order.shop_id) || {};
    const customer = db.users.find(u => u.id === order.customer_id) || {};
    return {
      rows: [{
        ...order,
        shop_name: shop.name,
        shop_address: shop.address,
        customer_name: customer.name,
        customer_phone: customer.phone
      }]
    };
  }

  // 13b. SELECT id, order_status FROM orders WHERE id = $1 AND shop_id = $2
  if (sqlNormalized.includes('SELECT id, order_status FROM orders') && sqlNormalized.includes('id = $1') && sqlNormalized.includes('shop_id = $2')) {
    const orderId = parseInt(params[0]);
    const shopId = parseInt(params[1]);
    const order = db.orders.find(o => o.id === orderId && o.shop_id === shopId);
    return { rows: order ? [order] : [] };
  }

  // 14. SELECT order items (for specific order details)
  if (sqlNormalized.includes('FROM order_items oi') && sqlNormalized.includes('oi.order_id = $1')) {
    const orderId = parseInt(params[0]);
    const rows = db.order_items
      .filter(oi => oi.order_id === orderId)
      .map(oi => {
        const prod = db.products.find(p => p.id === oi.product_id) || {};
        return {
          ...oi,
          product_name: prod.name,
          category: prod.category
        };
      });
    return { rows };
  }

  // 15. SELECT order items FOR stock deduct (butcher accept order)
  if (sqlNormalized.includes('SELECT product_id, quantity_kg FROM order_items WHERE order_id = $1')) {
    const orderId = parseInt(params[0]);
    const rows = db.order_items
      .filter(oi => oi.order_id === orderId)
      .map(oi => ({ product_id: oi.product_id, quantity_kg: oi.quantity_kg }));
    return { rows };
  }

  // 16. SELECT stock_qty for verification (accept order & place order)
  if (sqlNormalized.includes('shop_inventory') && sqlNormalized.includes('shop_id = $1') && (sqlNormalized.includes('product_id = $2') || sqlNormalized.includes('si.product_id = $2'))) {
    const shopId = parseInt(params[0]);
    const productId = parseInt(params[1]);
    const si = db.shop_inventory.find(s => s.shop_id === shopId && s.product_id === productId);
    if (!si) return { rows: [] };
    const prod = db.products.find(p => p.id === productId) || {};
    return {
      rows: [{
        available_quantity_kg: si.available_quantity_kg,
        selling_price_per_kg: si.selling_price_per_kg,
        name: prod.name
      }]
    };
  }

  // 17. UPDATE stock_qty (butcher accept order)
  if (sqlNormalized.includes('UPDATE shop_inventory SET available_quantity_kg = available_quantity_kg - $1')) {
    const [qty, shopId, productId] = params;
    const si = db.shop_inventory.find(s => s.shop_id === parseInt(shopId) && s.product_id === parseInt(productId));
    if (si) {
      si.available_quantity_kg = Math.max(0, parseFloat(si.available_quantity_kg) - parseFloat(qty));
      saveMockDb(db);
    }
    return { rows: [si] };
  }

  // 18. UPDATE orders SET order_status = 'Accepted'
  if (sqlNormalized.includes('UPDATE orders SET order_status') && sqlNormalized.includes('order_status = \'Accepted\'')) {
    const orderId = parseInt(params[0]);
    const order = db.orders.find(o => o.id === orderId);
    if (order) {
      order.order_status = 'Accepted';
      order.updated_at = new Date().toISOString();
      saveMockDb(db);
      return { rows: [order] };
    }
    return { rows: [] };
  }

  // 19. UPDATE orders SET order_status = 'Cancelled'
  if (sqlNormalized.includes('UPDATE orders SET order_status = \'Cancelled\'')) {
    const [orderId, shopId] = params;
    const order = db.orders.find(o => o.id === parseInt(orderId) && o.shop_id === parseInt(shopId));
    if (order) {
      order.order_status = 'Cancelled';
      order.updated_at = new Date().toISOString();
      saveMockDb(db);
      return { rows: [order] };
    }
    return { rows: [] };
  }

  // 20. UPDATE orders SET order_status = $1, payment_status = 'paid' (Delivered)
  if (sqlNormalized.includes('payment_status = \'paid\'')) {
    const [status, orderId, shopId] = params;
    const order = db.orders.find(o => o.id === parseInt(orderId) && o.shop_id === parseInt(shopId));
    if (order) {
      order.order_status = status;
      order.payment_status = 'paid';
      order.updated_at = new Date().toISOString();
      saveMockDb(db);
    }
    return { rows: [order] };
  }

  // 21. UPDATE orders SET order_status = $1 (Status update)
  if (sqlNormalized.includes('UPDATE orders SET order_status = $1') && !sqlNormalized.includes('payment_status')) {
    const [status, orderId, shopId] = params;
    const order = db.orders.find(o => o.id === parseInt(orderId) && o.shop_id === parseInt(shopId));
    if (order) {
      order.order_status = status;
      order.updated_at = new Date().toISOString();
      saveMockDb(db);
    }
    return { rows: [order] };
  }

  // 22. GET butcher dashboard stats (orders count, revenue today)
  if (sqlNormalized.includes('COUNT(id) AS today_orders') && sqlNormalized.includes('shop_id = $1')) {
    const shopId = parseInt(params[0]);
    const today = new Date().toISOString().split('T')[0];
    const shopOrders = db.orders.filter(o => o.shop_id === shopId && o.order_status !== 'Cancelled' && o.created_at.startsWith(today));
    const revenue = shopOrders.reduce((sum, o) => sum + o.total_amount, 0);
    return {
      rows: [{
        today_orders: shopOrders.length,
        today_revenue: revenue
      }]
    };
  }

  // 23. GET remaining stock (dashboard)
  if (sqlNormalized.includes('remaining_stock') && sqlNormalized.includes('shop_inventory')) {
    const shopId = parseInt(params[0]);
    const stock = db.shop_inventory
      .filter(si => si.shop_id === shopId)
      .reduce((sum, si) => sum + si.available_quantity_kg, 0);
    return { rows: [{ remaining_stock: stock }] };
  }

  // 24. GET best-selling product (dashboard)
  if (sqlNormalized.includes('GROUP BY p.name ORDER BY total_sold DESC')) {
    const shopId = parseInt(params[0]);
    // Find all Delivered orders
    const oIds = db.orders.filter(o => o.shop_id === shopId && o.order_status === 'Delivered').map(o => o.id);
    const soldMap = {};
    db.order_items.filter(oi => oIds.includes(oi.order_id)).forEach(oi => {
      const prod = db.products.find(p => p.id === oi.product_id);
      if (prod) {
        soldMap[prod.name] = (soldMap[prod.name] || 0) + oi.quantity_kg;
      }
    });
    const sorted = Object.entries(soldMap).sort((a, b) => b[1] - a[1]);
    if (sorted.length) {
      return { rows: [{ name: sorted[0][0], total_sold: sorted[0][1] }] };
    }
    return { rows: [] };
  }

  // 25. GET butcher inventory add-able list (available_to_add)
  if (sqlNormalized.includes('id NOT IN (SELECT product_id FROM shop_inventory')) {
    const shopId = parseInt(params[0]);
    const currentProdIds = db.shop_inventory.filter(si => si.shop_id === shopId).map(si => si.product_id);
    const available = db.products.filter(p => !currentProdIds.includes(p.id)).map(p => ({
      product_id: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit
    }));
    return { rows: available };
  }

  // 26. GET butcher orders
  if (sqlNormalized.includes('FROM orders o') && sqlNormalized.includes('o.shop_id = $1')) {
    const shopId = parseInt(params[0]);
    const rows = db.orders
      .filter(o => o.shop_id === shopId)
      .map(o => {
        const customer = db.users.find(u => u.id === o.customer_id) || {};
        return {
          ...o,
          customer_name: customer.name,
          customer_phone: customer.phone
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows };
  }

  // 27. GET admin pending shops
  if (sqlNormalized.includes('verification_status = \'pending\'') && sqlNormalized.includes('shops s')) {
    const rows = db.shops
      .filter(s => s.verification_status === 'pending')
      .map(s => {
        const owner = db.users.find(u => u.id === s.owner_user_id) || {};
        return {
          ...s,
          owner_name: owner.name,
          owner_email: owner.email,
          owner_phone: owner.phone
        };
      });
    return { rows };
  }

  // 28. PUT admin verify shop
  if (sqlNormalized.includes('verification_status = \'verified\'') && sqlNormalized.includes('UPDATE shops')) {
    const shopId = parseInt(params[0]);
    const shop = db.shops.find(s => s.id === shopId);
    if (shop) {
      shop.verification_status = 'verified';
      saveMockDb(db);
      return { rows: [shop] };
    }
    return { rows: [] };
  }

  // 29. PUT admin reject shop
  if (sqlNormalized.includes('verification_status = \'rejected\'') && sqlNormalized.includes('UPDATE shops')) {
    const shopId = parseInt(params[0]);
    const shop = db.shops.find(s => s.id === shopId);
    if (shop) {
      shop.verification_status = 'rejected';
      saveMockDb(db);
      return { rows: [shop] };
    }
    return { rows: [] };
  }

  // 30. GET admin market-prices
  if (sqlNormalized.includes('FROM market_prices mp') && sqlNormalized.includes('JOIN products p')) {
    const rows = db.market_prices.map(mp => {
      const prod = db.products.find(p => p.id === mp.product_id) || {};
      const adminUser = db.users.find(u => u.id === mp.created_by_admin_id) || {};
      return {
        id: mp.id,
        product_id: mp.product_id,
        city: mp.city,
        reference_price_per_kg: mp.reference_price_per_kg,
        price_date: mp.price_date || new Date().toISOString().split('T')[0],
        product_name: prod.name,
        category: prod.category,
        unit: prod.unit,
        created_by_name: adminUser.name
      };
    });
    return { rows };
  }

  // 31. GET admin products
  if (sqlNormalized.includes('SELECT id AS product_id, name, category, unit FROM products ORDER')) {
    return { rows: db.products.map(p => ({ product_id: p.id, name: p.name, category: p.category, unit: p.unit })) };
  }

  // 32. POST admin market-prices (upsert)
  if (sqlNormalized.includes('INSERT INTO market_prices')) {
    const [product_id, city, reference_price_per_kg, adminId] = params;
    let mp = db.market_prices.find(m => m.product_id === parseInt(product_id) && m.city.toLowerCase() === city.toLowerCase());
    if (mp) {
      mp.reference_price_per_kg = parseFloat(reference_price_per_kg);
      mp.created_by_admin_id = parseInt(adminId);
    } else {
      const newId = db.market_prices.length ? Math.max(...db.market_prices.map(m => m.id)) + 1 : 1;
      mp = { id: newId, product_id: parseInt(product_id), city, reference_price_per_kg: parseFloat(reference_price_per_kg), created_by_admin_id: parseInt(adminId) };
      db.market_prices.push(mp);
    }
    saveMockDb(db);
    return { rows: [mp] };
  }

  // 33. GET admin reports counts
  if (sqlNormalized.includes('total_orders') && sqlNormalized.includes('FROM orders')) {
    return { rows: [{ total_orders: db.orders.length }] };
  }
  if (sqlNormalized.includes('active_shops') && sqlNormalized.includes('FROM shops')) {
    return { rows: [{ active_shops: db.shops.filter(s => s.verification_status === 'verified').length }] };
  }
  if (sqlNormalized.includes('total_sales') && sqlNormalized.includes('FROM orders')) {
    const sales = db.orders.filter(o => o.order_status === 'Delivered').reduce((sum, o) => sum + o.total_amount, 0);
    return { rows: [{ total_sales: sales }] };
  }
  if (sqlNormalized.includes('role') && sqlNormalized.includes('COUNT') && sqlNormalized.includes('FROM users')) {
    const roleMap = {};
    db.users.forEach(u => { roleMap[u.role] = (roleMap[u.role] || 0) + 1; });
    return { rows: Object.entries(roleMap).map(([role, count]) => ({ role, count: parseInt(count) })) };
  }
  if (sqlNormalized.includes('order_status') && sqlNormalized.includes('COUNT') && sqlNormalized.includes('FROM orders')) {
    const statusMap = {};
    db.orders.forEach(o => { statusMap[o.order_status] = (statusMap[o.order_status] || 0) + 1; });
    return { rows: Object.entries(statusMap).map(([status, count]) => ({ status, count: parseInt(count) })) };
  }
  if (sqlNormalized.includes('verification_status') && sqlNormalized.includes('COUNT') && sqlNormalized.includes('FROM shops')) {
    const statusMap = {};
    db.shops.forEach(s => { statusMap[s.verification_status] = (statusMap[s.verification_status] || 0) + 1; });
    return { rows: Object.entries(statusMap).map(([status, count]) => ({ status, count: parseInt(count) })) };
  }

  // 34. POST reviews
  if (sqlNormalized.includes('INSERT INTO reviews')) {
    const [customerId, shopId, orderId, rating, comment] = params;
    const newId = db.reviews.length ? Math.max(...db.reviews.map(r => r.id)) + 1 : 1;
    const newRev = { id: newId, customer_id: parseInt(customerId), shop_id: parseInt(shopId), order_id: parseInt(orderId), rating: parseInt(rating), comment, created_at: new Date().toISOString() };
    
    // remove existing review for same customer/order if any
    db.reviews = db.reviews.filter(r => !(r.customer_id === parseInt(customerId) && r.order_id === parseInt(orderId)));
    db.reviews.push(newRev);

    // Update average rating on shop
    const shop = db.shops.find(s => s.id === parseInt(shopId));
    if (shop) {
      const shopReviews = db.reviews.filter(r => r.shop_id === parseInt(shopId));
      const avg = shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length;
      shop.rating = parseFloat(avg.toFixed(2));
    }

    saveMockDb(db);
    return { rows: [newRev] };
  }

  // Transaction control statements — no-op in mock
  const txnKeywords = ['BEGIN', 'COMMIT', 'ROLLBACK'];
  if (txnKeywords.some(kw => sqlNormalized.toUpperCase().startsWith(kw))) {
    return { rows: [] };
  }

  // SELECT * FROM orders WHERE id = $1 (generic fallback for order details)
  if (sqlNormalized.includes('SELECT * FROM orders WHERE id = $1')) {
    const orderId = parseInt(params[0]);
    const order = loadMockDb().orders.find(o => o.id === orderId);
    return { rows: order ? [order] : [] };
  }

  // Default fallback for any unhandled select/queries
  console.warn(`⚠️ Mock DB warning: unhandled query: ${sqlNormalized}`);
  return { rows: [] };
}

// Pool interface mapping to real or mock database
const pool = {
  query: async (sql, params = []) => {
    if (useMock) {
      return executeMockQuery(sql, params);
    }
    return realPool.query(sql, params);
  },
  connect: async () => {
    if (useMock) {
      // Mock Client supporting transaction queries
      return {
        query: async (sql, params = []) => executeMockQuery(sql, params),
        release: () => {}
      };
    }
    return realPool.connect();
  },
  end: async () => {
    return realPool.end();
  },
  on: (event, handler) => {
    realPool.on(event, handler);
  }
};

export default pool;
export { useMock };
