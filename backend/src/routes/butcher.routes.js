import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper to get butcher's shop ID
async function getButcherShopId(userId) {
  const result = await pool.query('SELECT id FROM shops WHERE owner_user_id = $1', [userId]);
  if (!result.rows.length) {
    throw new Error('No shop registered for this butcher');
  }
  return result.rows[0].id;
}

// GET /api/butcher/dashboard — dashboard stats
router.get('/dashboard', verifyToken, requireRole('butcher'), async (req, res) => {
  try {
    const shopId = await getButcherShopId(req.user.id);

    // Today's orders and revenue
    const statsRes = await pool.query(
      `SELECT 
        COUNT(id) AS today_orders,
        COALESCE(SUM(total_amount), 0) AS today_revenue
       FROM orders
       WHERE shop_id = $1 
         AND order_status != 'Cancelled' 
         AND created_at >= CURRENT_DATE`,
      [shopId]
    );

    // Remaining stock
    const stockRes = await pool.query(
      `SELECT COALESCE(SUM(available_quantity_kg), 0) AS remaining_stock
       FROM shop_inventory
       WHERE shop_id = $1`,
      [shopId]
    );

    // Best-selling product
    const bestSellerRes = await pool.query(
      `SELECT p.name, COALESCE(SUM(oi.quantity_kg), 0) AS total_sold
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.shop_id = $1 AND o.order_status = 'Delivered'
       GROUP BY p.name
       ORDER BY total_sold DESC
       LIMIT 1`,
      [shopId]
    );

    const stats = statsRes.rows[0];
    const stock = stockRes.rows[0];
    const bestSeller = bestSellerRes.rows[0] || { name: 'None', total_sold: 0 };

    res.json({
      today_orders: parseInt(stats.today_orders),
      today_revenue: parseFloat(stats.today_revenue),
      remaining_stock: parseFloat(stock.remaining_stock),
      best_selling_product: bestSeller.name,
      best_selling_qty: parseFloat(bestSeller.total_sold)
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/butcher/inventory — list shop stock and prices
router.get('/inventory', verifyToken, requireRole('butcher'), async (req, res) => {
  try {
    const shopId = await getButcherShopId(req.user.id);
    const shopRes = await pool.query('SELECT city FROM shops WHERE id = $1', [shopId]);
    const city = shopRes.rows[0].city;

    // Return inventory + global products list + market prices for the shop's city
    const result = await pool.query(
      `SELECT 
        si.id AS inventory_id,
        si.product_id,
        p.name,
        p.category,
        p.unit,
        si.available_quantity_kg,
        si.selling_price_per_kg,
        mp.reference_price_per_kg AS market_reference_price
       FROM shop_inventory si
       JOIN products p ON p.id = si.product_id
       LEFT JOIN market_prices mp ON mp.product_id = si.product_id AND LOWER(mp.city) = LOWER($2)
       WHERE si.shop_id = $1
       ORDER BY p.category, p.name`,
      [shopId, city]
    );

    // Also fetch products that are NOT yet in the inventory so butcher can add them
    const allProductsRes = await pool.query(
      `SELECT id AS product_id, name, category, unit FROM products 
       WHERE id NOT IN (SELECT product_id FROM shop_inventory WHERE shop_id = $1)`,
      [shopId]
    );

    res.json({
      inventory: result.rows,
      available_to_add: allProductsRes.rows
    });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/butcher/inventory — map a new product to shop inventory
router.post('/inventory', verifyToken, requireRole('butcher'), async (req, res) => {
  const { product_id, available_quantity_kg, selling_price_per_kg } = req.body;
  if (!product_id || available_quantity_kg === undefined || selling_price_per_kg === undefined) {
    return res.status(400).json({ error: 'Missing inventory details' });
  }

  try {
    const shopId = await getButcherShopId(req.user.id);
    const result = await pool.query(
      `INSERT INTO shop_inventory (shop_id, product_id, available_quantity_kg, selling_price_per_kg)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (shop_id, product_id)
       DO UPDATE SET available_quantity_kg = EXCLUDED.available_quantity_kg, selling_price_per_kg = EXCLUDED.selling_price_per_kg
       RETURNING *`,
      [shopId, product_id, available_quantity_kg, selling_price_per_kg]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding inventory:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/butcher/inventory/:inventoryId — update daily stock and price
router.put('/inventory/:inventoryId', verifyToken, requireRole('butcher'), async (req, res) => {
  const { available_quantity_kg, selling_price_per_kg } = req.body;
  if (available_quantity_kg === undefined || selling_price_per_kg === undefined) {
    return res.status(400).json({ error: 'Missing inventory fields' });
  }

  try {
    const shopId = await getButcherShopId(req.user.id);
    const result = await pool.query(
      `UPDATE shop_inventory 
       SET available_quantity_kg = $1, selling_price_per_kg = $2, updated_at = NOW()
       WHERE id = $3 AND shop_id = $4
       RETURNING *`,
      [available_quantity_kg, selling_price_per_kg, req.params.inventoryId, shopId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Inventory record not found or access denied' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating inventory:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/butcher/orders — list shop orders
router.get('/orders', verifyToken, requireRole('butcher'), async (req, res) => {
  try {
    const shopId = await getButcherShopId(req.user.id);
    const result = await pool.query(
      `SELECT o.id, o.customer_id, o.delivery_address, o.total_amount, o.payment_method, o.payment_status, o.order_status, o.created_at,
              u.name AS customer_name, u.phone AS customer_phone
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       WHERE o.shop_id = $1
       ORDER BY o.created_at DESC`,
      [shopId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching butcher orders:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// PUT /api/butcher/orders/:orderId/accept — accept order, reduce inventory
router.put('/orders/:orderId/accept', verifyToken, requireRole('butcher'), async (req, res) => {
  const orderId = req.params.orderId;
  const client = await pool.connect();
  try {
    const shopId = await getButcherShopId(req.user.id);
    await client.query('BEGIN');

    // 1. Verify order belongs to this shop
    const orderRes = await client.query('SELECT id, order_status FROM orders WHERE id = $1 AND shop_id = $2', [orderId, shopId]);
    if (!orderRes.rows.length) {
      throw new Error('Order not found');
    }
    const order = orderRes.rows[0];
    if (order.order_status !== 'New') {
      throw new Error(`Cannot accept order in '${order.order_status}' status`);
    }

    // 2. Fetch ordered items
    const itemsRes = await client.query('SELECT product_id, quantity_kg FROM order_items WHERE order_id = $1', [orderId]);
    const items = itemsRes.rows;

    // 3. Check and deduct stock for each item
    for (const item of items) {
      const { product_id, quantity_kg } = item;

      // Verify stock
      const stockRes = await client.query(
        'SELECT available_quantity_kg, name FROM shop_inventory si JOIN products p ON p.id=si.product_id WHERE shop_id = $1 AND product_id = $2 FOR UPDATE',
        [shopId, product_id]
      );
      if (!stockRes.rows.length) {
        throw new Error(`Product not found in your inventory`);
      }
      const currentStock = parseFloat(stockRes.rows[0].available_quantity_kg);
      const reqQty = parseFloat(quantity_kg);

      if (currentStock < reqQty) {
        throw new Error(`Insufficient stock for ${stockRes.rows[0].name}. Available: ${currentStock}kg, Ordered: ${reqQty}kg`);
      }

      // Deduct stock
      await client.query(
        'UPDATE shop_inventory SET available_quantity_kg = available_quantity_kg - $1 WHERE shop_id = $2 AND product_id = $3',
        [reqQty, shopId, product_id]
      );
    }

    // 4. Update order status to 'Accepted'
    const result = await client.query(
      `UPDATE orders SET order_status = 'Accepted', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [orderId]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Accept order failed:', err.message);
    res.status(400).json({ error: err.message || 'Failed to accept order' });
  } finally {
    client.release();
  }
});

// PUT /api/butcher/orders/:orderId/reject — reject order
router.put('/orders/:orderId/reject', verifyToken, requireRole('butcher'), async (req, res) => {
  try {
    const shopId = await getButcherShopId(req.user.id);
    const orderId = req.params.orderId;

    const result = await pool.query(
      `UPDATE orders 
       SET order_status = 'Cancelled', updated_at = NOW() 
       WHERE id = $1 AND shop_id = $2 AND order_status = 'New'
       RETURNING *`,
      [orderId, shopId]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: 'Order not found or cannot be cancelled' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Reject order failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/butcher/orders/:orderId/status — update status
router.put('/orders/:orderId/status', verifyToken, requireRole('butcher'), async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.orderId;
  const allowedStatuses = ['Accepted', 'Cutting Meat', 'Packed', 'Out for Delivery', 'Delivered'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status transition: ${status}` });
  }

  try {
    const shopId = await getButcherShopId(req.user.id);

    // If setting to Delivered, automatically mark COD payment as paid
    if (status === 'Delivered') {
      await pool.query(
        `UPDATE orders 
         SET order_status = $1, payment_status = 'paid', updated_at = NOW() 
         WHERE id = $2 AND shop_id = $3
         RETURNING *`,
        [status, orderId, shopId]
      );
    } else {
      await pool.query(
        `UPDATE orders 
         SET order_status = $1, updated_at = NOW() 
         WHERE id = $2 AND shop_id = $3
         RETURNING *`,
        [status, orderId, shopId]
      );
    }

    const updatedRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    res.json(updatedRes.rows[0]);
  } catch (err) {
    console.error('Update status failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
