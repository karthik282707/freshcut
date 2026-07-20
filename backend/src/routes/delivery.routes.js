import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/delivery/assignments — available orders for pickup (status: ready)
router.get('/assignments', verifyToken, requireRole('delivery'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, s.name AS shop_name, s.address AS shop_address, s.city,
              u.name AS customer_name, u.phone AS customer_phone
       FROM orders o
       JOIN shops s ON s.id = o.shop_id
       JOIN users u ON u.id = o.customer_id
       WHERE o.status = 'ready' AND o.delivery_partner_id IS NULL
       ORDER BY o.updated_at ASC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/delivery/:orderId/accept — delivery partner accepts assignment
router.patch('/:orderId/accept', verifyToken, requireRole('delivery'), async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE orders SET delivery_partner_id=$1, status='picked_up', updated_at=NOW()
       WHERE id=$2 AND status='ready' AND delivery_partner_id IS NULL RETURNING *`,
            [req.user.id, req.params.orderId]
        );
        if (!result.rows.length) return res.status(409).json({ error: 'Order already taken or not ready' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/delivery/:orderId/status — delivery partner updates delivery status
router.patch('/:orderId/status', verifyToken, requireRole('delivery'), async (req, res) => {
    const { status } = req.body;
    const allowed = ['picked_up', 'in_transit', 'delivered'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid delivery status' });
    try {
        const result = await pool.query(
            `UPDATE orders SET status=$1, updated_at=NOW()
       WHERE id=$2 AND delivery_partner_id=$3 RETURNING *`,
            [status, req.params.orderId, req.user.id]
        );
        if (!result.rows.length) return res.status(403).json({ error: 'Not your order' });

        if (status === 'delivered') {
            await pool.query(`UPDATE payments SET status='paid' WHERE order_id=$1`, [req.params.orderId]);
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/delivery/active — delivery partner's active deliveries
router.get('/active', verifyToken, requireRole('delivery'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, s.name AS shop_name, s.address AS shop_address,
              u.name AS customer_name, u.phone AS customer_phone
       FROM orders o
       JOIN shops s ON s.id = o.shop_id JOIN users u ON u.id = o.customer_id
       WHERE o.delivery_partner_id=$1 AND o.status NOT IN ('delivered','cancelled')
       ORDER BY o.updated_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
