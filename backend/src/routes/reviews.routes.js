import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reviews — customer posts a review
router.post('/', verifyToken, requireRole('customer'), async (req, res) => {
    const { shop_id, order_id, rating, comment } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO reviews (customer_id, shop_id, order_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (customer_id, order_id)
       DO UPDATE SET rating=$4, comment=$5
       RETURNING *`,
            [req.user.id, shop_id, order_id, rating, comment]
        );
        // Update shop rating average
        await pool.query(
            `UPDATE shops SET
         rating_avg = (SELECT AVG(rating) FROM reviews WHERE shop_id=$1),
         rating_count = (SELECT COUNT(*) FROM reviews WHERE shop_id=$1)
       WHERE id=$1`,
            [shop_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/reviews/shops/:shopId
router.get('/shops/:shopId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, u.name AS customer_name
       FROM reviews r JOIN users u ON u.id = r.customer_id
       WHERE r.shop_id=$1 ORDER BY r.created_at DESC`,
            [req.params.shopId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/reviews/complaints — admin
router.get('/complaints', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, u.name AS reporter_name, s.name AS shop_name
       FROM complaints c
       JOIN users u ON u.id = c.reporter_id
       LEFT JOIN shops s ON s.id = c.shop_id
       ORDER BY c.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/reviews/complaints — customer files complaint
router.post('/complaints', verifyToken, requireRole('customer'), async (req, res) => {
    const { shop_id, order_id, description } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO complaints (reporter_id, shop_id, order_id, description) VALUES ($1,$2,$3,$4) RETURNING *`,
            [req.user.id, shop_id, order_id, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/reviews/complaints/:id — admin resolves
router.patch('/complaints/:id', verifyToken, requireRole('admin'), async (req, res) => {
    const { status, admin_notes } = req.body;
    try {
        const result = await pool.query(
            `UPDATE complaints SET status=$1, admin_notes=$2, resolved_at=CASE WHEN $1='resolved' THEN NOW() ELSE resolved_at END
       WHERE id=$3 RETURNING *`,
            [status, admin_notes, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
