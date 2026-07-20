import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/sales?shop_id=X — butcher sales report
router.get('/sales', verifyToken, requireRole('butcher', 'admin'), async (req, res) => {
    const { shop_id, days = 30 } = req.query;
    try {
        const salesByDay = await pool.query(
            `SELECT DATE(o.created_at) AS date,
              COUNT(o.id) AS order_count,
              SUM(o.subtotal) AS revenue
       FROM orders o
       WHERE o.shop_id=$1
         AND o.status NOT IN ('rejected','cancelled')
         AND o.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(o.created_at) ORDER BY date`,
            [shop_id]
        );
        const topProducts = await pool.query(
            `SELECT p.name, SUM(oi.quantity) AS total_qty, SUM(oi.line_total) AS total_revenue
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.shop_id=$1 AND o.status NOT IN ('rejected','cancelled')
         AND o.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY p.name ORDER BY total_revenue DESC LIMIT 5`,
            [shop_id]
        );
        const summary = await pool.query(
            `SELECT COUNT(o.id) AS total_orders,
              SUM(o.subtotal) AS total_revenue,
              COALESCE(AVG(o.subtotal),0) AS avg_order_value
       FROM orders o
       WHERE o.shop_id=$1 AND o.status NOT IN ('rejected','cancelled')
         AND o.created_at >= NOW() - INTERVAL '${parseInt(days)} days'`,
            [shop_id]
        );
        res.json({ sales_by_day: salesByDay.rows, top_products: topProducts.rows, summary: summary.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/reports/platform — admin platform-wide report
router.get('/platform', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const [userStats, orderStats, shopStats] = await Promise.all([
            pool.query(`SELECT role, COUNT(*) AS count FROM users GROUP BY role`),
            pool.query(
                `SELECT status, COUNT(*) AS count, SUM(total) AS revenue
         FROM orders GROUP BY status`
            ),
            pool.query(`SELECT status, COUNT(*) AS count FROM shops GROUP BY status`)
        ]);
        res.json({
            users: userStats.rows,
            orders: orderStats.rows,
            shops: shopStats.rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
