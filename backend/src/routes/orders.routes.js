import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST /api/orders — customer places an order
router.post('/', verifyToken, requireRole('customer'), async (req, res) => {
    const { shop_id, items, delivery_address, delivery_city, notes, payment_method } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Validate stock & compute totals
        let subtotal = 0;
        const validatedItems = [];
        for (const item of items) {
            const inv = await client.query(
                `SELECT i.stock_qty, i.selling_price, p.name
         FROM inventory i JOIN products p ON p.id = i.product_id
         WHERE i.product_id=$1 AND i.shop_id=$2`,
                [item.product_id, shop_id]
            );
            if (!inv.rows.length) throw new Error(`Product ${item.product_id} not found`);
            if (inv.rows[0].stock_qty < item.quantity) throw new Error(`Insufficient stock for ${inv.rows[0].name}`);
            const lineTotal = parseFloat(inv.rows[0].selling_price) * item.quantity;
            subtotal += lineTotal;
            validatedItems.push({ ...item, unit_price: inv.rows[0].selling_price, line_total: lineTotal });
        }
        const deliveryFee = 30;
        const total = subtotal + deliveryFee;

        // Insert order
        const orderResult = await client.query(
            `INSERT INTO orders (customer_id, shop_id, delivery_address, delivery_city, subtotal, delivery_fee, total, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [req.user.id, shop_id, delivery_address, delivery_city, subtotal, deliveryFee, total, notes || null]
        );
        const order = orderResult.rows[0];

        // Insert order items & deduct stock
        for (const item of validatedItems) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, cutting_style, unit_price, line_total)
         VALUES ($1,$2,$3,$4,$5,$6)`,
                [order.id, item.product_id, item.quantity, item.cutting_style, item.unit_price, item.line_total]
            );
            await client.query(
                `UPDATE inventory SET stock_qty = stock_qty - $1 WHERE product_id=$2 AND shop_id=$3`,
                [item.quantity, item.product_id, shop_id]
            );
        }

        // Create mock payment record
        await client.query(
            `INSERT INTO payments (order_id, amount, method, status) VALUES ($1,$2,$3,'pending')`,
            [order.id, total, payment_method || 'mock']
        );

        await client.query('COMMIT');
        res.status(201).json({ ...order, items: validatedItems });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to create order' });
    } finally {
        client.release();
    }
});

// GET /api/orders/mine — customer's orders
router.get('/mine', verifyToken, requireRole('customer'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, s.name AS shop_name
       FROM orders o JOIN shops s ON s.id = o.shop_id
       WHERE o.customer_id=$1 ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/orders/shop/:shopId — butcher's incoming orders
router.get('/shop/:shopId', verifyToken, requireRole('butcher'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, u.name AS customer_name, u.phone AS customer_phone
       FROM orders o JOIN users u ON u.id = o.customer_id
       WHERE o.shop_id=$1 ORDER BY o.created_at DESC`,
            [req.params.shopId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/orders/delivery/mine — delivery partner's orders
router.get('/delivery/mine', verifyToken, requireRole('delivery'), async (req, res) => {
    try {
        const available = await pool.query(
            `SELECT o.*, s.name AS shop_name, s.address AS shop_address, u.name AS customer_name
       FROM orders o JOIN shops s ON s.id = o.shop_id JOIN users u ON u.id = o.customer_id
       WHERE o.status = 'ready' AND o.delivery_partner_id IS NULL`
        );
        const mine = await pool.query(
            `SELECT o.*, s.name AS shop_name, s.address AS shop_address, u.name AS customer_name
       FROM orders o JOIN shops s ON s.id = o.shop_id JOIN users u ON u.id = o.customer_id
       WHERE o.delivery_partner_id=$1 ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json({ available: available.rows, assigned: mine.rows });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/orders/:id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [orderRes, itemsRes] = await Promise.all([
            pool.query(
                `SELECT o.*, s.name AS shop_name, s.address AS shop_address,
                u.name AS customer_name, d.name AS delivery_partner_name
         FROM orders o
         JOIN shops s ON s.id = o.shop_id
         JOIN users u ON u.id = o.customer_id
         LEFT JOIN users d ON d.id = o.delivery_partner_id
         WHERE o.id=$1`,
                [req.params.id]
            ),
            pool.query(
                `SELECT oi.*, p.name AS product_name
         FROM order_items oi JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id=$1`,
                [req.params.id]
            )
        ]);
        if (!orderRes.rows.length) return res.status(404).json({ error: 'Order not found' });
        res.json({ ...orderRes.rows[0], items: itemsRes.rows });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/orders/:id/status — update order status
router.patch('/:id/status', verifyToken, async (req, res) => {
    const { status } = req.body;
    const role = req.user.role;

    const allowedTransitions = {
        butcher: ['accepted', 'rejected', 'preparing', 'ready'],
        delivery: ['picked_up', 'in_transit', 'delivered'],
        admin: ['cancelled'],
        customer: ['cancelled']
    };

    if (!allowedTransitions[role]?.includes(status)) {
        return res.status(403).json({ error: `Role ${role} cannot set status to ${status}` });
    }

    try {
        let query = 'UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *';
        let params = [status, req.params.id];

        // delivery partner accepts = assign themselves
        if (status === 'picked_up') {
            query = `UPDATE orders SET status=$1, delivery_partner_id=$3, updated_at=NOW() WHERE id=$2 RETURNING *`;
            params = [status, req.params.id, req.user.id];
        }

        // Mark payment as paid upon delivery
        if (status === 'delivered') {
            await pool.query(`UPDATE payments SET status='paid' WHERE order_id=$1`, [req.params.id]);
        }

        const result = await pool.query(query, params);
        if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/orders/admin/all — admin
router.get('/admin/all', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, s.name AS shop_name, u.name AS customer_name
       FROM orders o JOIN shops s ON s.id=o.shop_id JOIN users u ON u.id=o.customer_id
       ORDER BY o.created_at DESC LIMIT 200`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
