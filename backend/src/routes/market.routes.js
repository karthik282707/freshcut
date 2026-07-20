import express from 'express';
import pool from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/market — all market reference prices (public)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT mp.*, mc.name AS category_name, u.name AS updated_by_name
       FROM market_prices mp
       JOIN meat_categories mc ON mc.id = mp.category_id
       LEFT JOIN users u ON u.id = mp.updated_by
       ORDER BY mc.name`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/market/categories — all meat categories
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM meat_categories ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/market/:categoryId — admin updates reference price
router.put('/:categoryId', verifyToken, requireRole('admin'), async (req, res) => {
    const { reference_price } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO market_prices (category_id, reference_price, updated_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (category_id)
       DO UPDATE SET reference_price=$2, updated_by=$3, updated_at=NOW()
       RETURNING *`,
            [req.params.categoryId, reference_price, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
