import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/shops/pending — list pending butcher shops
router.get('/shops/pending', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.address, s.city, s.license_number, s.verification_status, s.created_at,
              u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
       FROM shops s
       JOIN users u ON u.id = s.owner_user_id
       WHERE s.verification_status = 'pending'
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending shops:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/shops/:shopId/verify — approve shop
router.put('/shops/:shopId/verify', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE shops 
       SET verification_status = 'verified' 
       WHERE id = $1 
       RETURNING *`,
      [req.params.shopId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error verifying shop:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/shops/:shopId/reject — reject shop
router.put('/shops/:shopId/reject', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE shops 
       SET verification_status = 'rejected' 
       WHERE id = $1 
       RETURNING *`,
      [req.params.shopId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error rejecting shop:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/market-prices — list market reference prices
router.get('/market-prices', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const pricesResult = await pool.query(
      `SELECT mp.id, mp.product_id, mp.city, mp.reference_price_per_kg, mp.price_date,
              p.name AS product_name, p.category, p.unit, u.name AS created_by_name
       FROM market_prices mp
       JOIN products p ON p.id = mp.product_id
       LEFT JOIN users u ON u.id = mp.created_by_admin_id
       ORDER BY mp.city, p.category, p.name`
    );
    
    // Also send all products so admin can add new reference prices
    const productsResult = await pool.query('SELECT id AS product_id, name, category, unit FROM products ORDER BY category, name');

    res.json({
      prices: pricesResult.rows,
      products: productsResult.rows
    });
  } catch (err) {
    console.error('Error fetching market prices:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/market-prices — add or update daily market reference prices
router.post('/market-prices', verifyToken, requireRole('admin'), async (req, res) => {
  const { product_id, city, reference_price_per_kg } = req.body;
  if (!product_id || !city || reference_price_per_kg === undefined) {
    return res.status(400).json({ error: 'Missing required reference price fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO market_prices (product_id, city, reference_price_per_kg, created_by_admin_id, price_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       ON CONFLICT (product_id, city)
       DO UPDATE SET reference_price_per_kg = EXCLUDED.reference_price_per_kg, 
                     created_by_admin_id = EXCLUDED.created_by_admin_id,
                     price_date = CURRENT_DATE
       RETURNING *`,
      [product_id, city, reference_price_per_kg, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving market price:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/reports — simple reports
router.get('/reports', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const ordersStats = await pool.query('SELECT COUNT(id) AS total_orders FROM orders');
    const shopsStats = await pool.query("SELECT COUNT(id) AS active_shops FROM shops WHERE verification_status = 'verified'");
    const salesStats = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM orders WHERE order_status = 'Delivered'");
    
    // Detailed platform aggregates for the dashboard view
    const roleStats = await pool.query('SELECT role, COUNT(id) AS count FROM users GROUP BY role');
    const orderStatusStats = await pool.query('SELECT order_status AS status, COUNT(id) AS count FROM orders GROUP BY order_status');
    const shopsStatusStats = await pool.query('SELECT verification_status AS status, COUNT(id) AS count FROM shops GROUP BY verification_status');

    res.json({
      total_orders: parseInt(ordersStats.rows[0].total_orders),
      active_shops: parseInt(shopsStats.rows[0].active_shops),
      total_sales: parseFloat(salesStats.rows[0].total_sales),
      users_breakdown: roleStats.rows,
      orders_breakdown: orderStatusStats.rows,
      shops_breakdown: shopsStatusStats.rows
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
